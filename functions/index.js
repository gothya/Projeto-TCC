const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Inicializa o Admin SDK
admin.initializeApp();

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
