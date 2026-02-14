// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
const firebaseConfig = {
    apiKey: "AIzaSyBbUAAv_zVMCpxS3yyXHR-7egCw_D8iDzM",
    projectId: "psylogos-enigma-da-mente",
    messagingSenderId: "573926171630",
    appId: "1:573926171630:web:cd74093e0c17004fd424ff"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/vite.svg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notification click received.');
    event.notification.close();

    // URL to open (root + query param)
    const urlToOpen = new URL(self.location.origin + '?open_ping=true').href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (const client of windowClients) {
                // Match any URL on the same origin
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    return client.focus().then(focusedClient => {
                        // Send a message to the client to open the ping modal
                        focusedClient.postMessage({ action: 'open_ping' });
                    });
                }
            }
            // If no window/tab is open, open a new one
            if (clients.openWindow) return clients.openWindow(urlToOpen);
        })
    );
});
