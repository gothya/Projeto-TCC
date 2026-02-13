import { db, messaging } from "./firebase";
import { getToken, onMessage, Messaging } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";

export class NotificationService {
    private static instance: NotificationService;
    private messagingInstance: Messaging | null = null;

    private constructor() {
        // messaging is a promise/value from our firebase.ts export
        // We need to handle it carefully since it might be null (if not supported)
        // However, in our firebase.ts we exported it as a Promise<Messaging | null> or Messaging | null depending on implementation.
        // Let's check how we implemented it: 
        // export const messaging = await isMessagingSupported().then(yes => yes ? getMessaging(app) : null);
        // Be careful: top-level await might not be supported in all targets or might block app load.
        // Using a simpler approach: passing the instance or getting it lazily.
    }

    public static async init(): Promise<NotificationService> {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
            // Wait for the async export from firebase.ts
            NotificationService.instance.messagingInstance = await messaging;

            // If permission is already granted, log the token for convenience (helps with testing)
            if (Notification.permission === "granted") {
                NotificationService.instance.requestPermission();
            }
        }
        return NotificationService.instance;
    }

    public async initializeNotificationsForNewUser(): Promise<string | null> {
        if (!this.messagingInstance) return null;

        if (Notification.permission === "default") {
            return await this.requestPermission();
        } else if (Notification.permission === "granted") {
            const token = await getToken(this.messagingInstance, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            });
            return token || null;
        }
        return null;
    }

    public async requestPermission(): Promise<string | null> {
        if (!this.messagingInstance) {
            console.log("Messaging not supported or not initialized.");
            return null;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                console.log("Notification permission granted.");
                const token = await getToken(this.messagingInstance, {
                    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
                });
                // console.log("FCM Token:", token);
                return token;
            } else {
                console.log("Notification permission denied.");
                return null;
            }
        } catch (error) {
            console.error("An error occurred while requesting permission ", error);
            return null;
        }
    }

    public onMessageListener() {
        if (!this.messagingInstance) return;

        return onMessage(this.messagingInstance, (payload) => {
            console.log("Message received. ", payload);
            // You can customize the foreground notification here manually if needed
            // or let the UI handle it via a callback (to be implemented if needed)
            // For now, we'll use a browser notification if the tab is visible but we want to alert.
            // Note: Browsers usually don't show system notifications for foreground tabs automatically.

            const { title, body } = payload.notification || {};
            if (title) {
                // Simple alert for verification (or custom toast later)
                // alert(`New Message: ${title} - ${body}`);
                // Using the Notification API to show a system notification even in foreground if allowed
                new Notification(title, { body, icon: '/vite.svg' });
            }
        });
    }

    public async saveTokenToFirestore(uid: string, token: string) {
        if (!uid || !token) return;

        try {
            const userRef = doc(db, "users", uid);
            // We use setDoc with merge: true to arguably be safer if doc doesn't exist, 
            // though in our app logic user doc should exist.
            await setDoc(userRef, { fcmToken: token }, { merge: true });
            console.log("Token saved to Firestore for user:", uid);
        } catch (error) {
            console.error("Error saving token to Firestore:", error);
        }
    }
}
