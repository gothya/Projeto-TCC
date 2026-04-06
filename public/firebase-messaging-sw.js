// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const SW_VERSION = "1.1.0";

// Ativação imediata — evita estado inconsistente ao atualizar o SW
self.addEventListener('install', () => {
    console.log('[SW] Instalando versão', SW_VERSION);
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Ativado — assumindo controle de todos os clientes');
    event.waitUntil(clients.claim());
});

const firebaseConfig = {
    apiKey: "AIzaSyBbUAAv_zVMCpxS3yyXHR-7egCw_D8iDzM",
    projectId: "psylogos-enigma-da-mente",
    messagingSenderId: "573926171630",
    appId: "1:573926171630:web:cd74093e0c17004fd424ff"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[SW] Mensagem em background recebida:', payload);

    const notificationTitle = payload.notification?.title || 'Psylogos';
    const notificationOptions = {
        body: payload.notification?.body || 'Como você está se sentindo agora?',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'psylogos-ping',
        requireInteraction: true,
        vibrate: [200, 100, 200],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    console.log('[SW] Notificação clicada.');
    event.notification.close();

    const urlToOpen = new URL(self.location.origin + '?open_ping=true').href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            for (const client of windowClients) {
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    return client.focus().then(focusedClient => {
                        focusedClient.postMessage({ action: 'open_ping' });
                    });
                }
            }
            if (clients.openWindow) return clients.openWindow(urlToOpen);
        })
    );
});
