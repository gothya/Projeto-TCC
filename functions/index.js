const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

// Inicializa o Admin SDK
admin.initializeApp();

exports.deleteParticipantAccount = onCall(
    { cors: true },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Autenticação obrigatória.");
        }

        const uid = request.auth.uid;
        const db = admin.firestore();

        const deletes = [
            db.collection("participantes").doc(uid).delete(),
            db.collection("reactionEvaluations").doc(uid).delete(),
            db.collection("publicMessages").doc(uid).delete(),
        ];

        await Promise.allSettled(deletes);

        await admin.auth().deleteUser(uid);

        console.log(`✅ Conta excluída: ${uid}`);
        return { success: true };
    }
);

// ─── Scheduled: dispara nos horários de ping (BRT) ──────────────────────────
// Cron em UTC: 9h, 11h, 13h, 15h, 17h, 19h, 21h BRT = 12h, 14h, 16h, 18h, 20h, 22h, 0h UTC
exports.sendPingNotification = onSchedule(
  {
    schedule: "0 12,14,16,18,20,22,0 * * *",
    timeZone: "America/Sao_Paulo",
    region: "southamerica-east1",
  },
  async () => {
    const db = admin.firestore();

    // Feature flag — manter false até validação manual
    const configSnap = await db.collection("config").doc("featureFlags").get();
    if (!configSnap.data()?.sendPushEnabled) {
      console.log("Push desativado via feature flag. Nenhuma notificação enviada.");
      return;
    }

    // Hora BRT para o título da notificação (cron já garantiu que estamos no horário certo)
    const brtHour = parseInt(
      new Date().toLocaleString("en-US", {
        timeZone: "America/Sao_Paulo",
        hour: "numeric",
        hour12: false,
      })
    );

    const snapshot = await db.collection("participantes")
      .where("hasOnboarded", "==", true)
      .get();

    const tokens = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcmToken && isParticipantActive(data.studyStartDate)) {
        tokens.push(data.fcmToken);
      }
    });

    if (tokens.length === 0) {
      console.log("Nenhum participante ativo com token FCM.");
      return;
    }

    console.log(`Enviando notificação para ${tokens.length} participante(s) — ${brtHour}h BRT`);

    const message = {
      notification: {
        title: `🧠 Hora do Ping das ${brtHour}h`,
        body: "Psylogos está esperando. Como você está se sentindo agora?",
      },
      android: { priority: "high" },
      webpush: {
        headers: { Urgency: "high" },
        notification: {
          requireInteraction: true,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: "psylogos-ping",
        },
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Enviados: ${response.successCount} | Falhas: ${response.failureCount}`);
    await cleanupInvalidTokens(db, tokens, response);
  }
);

function isParticipantActive(studyStartDateIso) {
  if (!studyStartDateIso) return false;
  const start = new Date(studyStartDateIso);
  const now = new Date();
  const diffDays = (now - start) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays < 7;
}

// Nota: Firestore "in" suporta no máximo 30 valores.
// Para o TCC (poucos participantes) é inócuo. Documentado para consciência.
async function cleanupInvalidTokens(db, tokens, response) {
  const invalidTokens = [];
  response.responses.forEach((resp, idx) => {
    if (resp.error?.code === "messaging/registration-token-not-registered") {
      invalidTokens.push(tokens[idx]);
    }
  });

  if (invalidTokens.length === 0) return;

  const snapshot = await db.collection("participantes")
    .where("fcmToken", "in", invalidTokens)
    .get();

  const deletes = snapshot.docs.map(doc =>
    doc.ref.update({ fcmToken: admin.firestore.FieldValue.delete() })
  );
  await Promise.all(deletes);
  console.log(`🧹 ${deletes.length} token(s) inválido(s) removido(s).`);
}

// ─── onCall: envio manual pelo painel admin ──────────────────────────────────
exports.sendPushNotification = onCall(
    { cors: false },
    async (request) => {
        // Verifica autenticação
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Autenticação obrigatória.");
        }

        // Verifica Custom Claim de admin
        if (!request.auth.token.admin) {
            throw new HttpsError("permission-denied", "Apenas administradores podem enviar notificações.");
        }

        // Extrai os dados enviados na requisição
        const { token, title, body, data } = request.data;

        // Validação básica
        if (!token) {
            throw new HttpsError("invalid-argument", "O token do dispositivo é obrigatório.");
        }

        // Estrutura da mensagem
        const message = {
            notification: {
                title: title || "Nova Notificação",
                body: body || "Você recebeu uma atualização.",
            },
            data: data || {},
            token: token,
        };

        try {
            const response = await admin.messaging().send(message);
            console.log("Notificação enviada com sucesso:", response);
            return { success: true, messageId: response };
        }
        catch (error) {
            console.error("Erro ao enviar notificação:", error);
            throw new HttpsError("internal", "Erro ao enviar push notification.", error);
        }
    });

// ─── onCall: limpa tokens FCM de todos os participantes (migração de origem) ─
exports.resetAllFcmTokens = onCall(
    { cors: false },
    async (request) => {
        if (!request.auth?.token.admin) {
            throw new HttpsError("permission-denied", "Apenas administradores.");
        }
        const db = admin.firestore();
        const snapshot = await db.collection("participantes").get();
        const updates = snapshot.docs.map(doc =>
            doc.ref.update({
                fcmToken: admin.firestore.FieldValue.delete(),
                fcmTokenOrigin: admin.firestore.FieldValue.delete(),
            })
        );
        await Promise.all(updates);
        console.log(`🔄 ${updates.length} token(s) FCM removido(s).`);
        return { cleared: updates.length };
    }
);
