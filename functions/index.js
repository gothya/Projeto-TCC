const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Inicializa o Admin SDK
admin.initializeApp();

exports.sendPushNotification = onCall(
    { cors: true },
    async (request) => {
        // Extrai os dados enviados na requisição
        const { token, title, body, data } = request.data;

        // Validação básica de segurança e dados
        if (!token) {
            throw new HttpsError("invalid-argument", "O token do dispositivo é obrigatório.");
        }

        // Estrutura da mensagem
        const message = {
            notification: {
                title: title || "Nova Notificação",
                body: body || "Você recebeu uma atualização.",
            },
            data: data || {}, // Campos extras (opcional)
            token: token,     // O token de registro do cliente
        };

        try {
            // Envia a notificação via FCM
            const response = await admin.messaging().send(message);
            console.log("Notificação enviada com sucesso:", response);
            return { success: true, messageId: response };
        }
        catch (error) {
            console.error("Erro ao enviar notificação:", error);
            throw new HttpsError("internal", "Erro ao enviar push notification.", error);
        }
    });