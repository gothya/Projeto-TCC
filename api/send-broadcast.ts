import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// Initialize Firebase Admin (Singleton)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.VITE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
        }),
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const authHeader = req.headers.authorization;
        let isCronAuthenticated = false;

        // 1. Verify Authentication (Admin OR Cron Secret)
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];

            // Check Cron Secret first (env var must be set in Vercel)
            if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) {
                isCronAuthenticated = true;
                console.log('Authenticated via CRON_SECRET');
            } else {
                // Verify Firebase ID Token for manual admin trigger
                try {
                    const decodedToken = await admin.auth().verifyIdToken(token);
                    // Block anonymous users
                    if (decodedToken.firebase?.sign_in_provider === 'anonymous') {
                        return res.status(403).json({ error: 'Forbidden: Admin access required' });
                    }
                    console.log(`Broadcast initiated by: ${decodedToken.email || decodedToken.uid}`);
                } catch (authError) {
                    console.error('Auth Error:', authError);
                    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
                }
            }
        } else {
            // Vercel Cron automatically adds this header if secured, but we rely on Bearer token match
            return res.status(401).json({ error: 'Unauthorized: Missing token' });
        }

        // 3. Prepare Message Content
        let { title, body } = req.body || {};
        const isCron = req.query.isCron === 'true';

        if (isCron && isCronAuthenticated) {
            // Determine dynamic title based on current time (BRT is UTC-3)
            // Function runs in UTC environment usually
            const now = new Date();
            // Get hour in BRT (UTC-3)
            const brtHour = (now.getUTCHours() - 3 + 24) % 24;

            title = `Ping das ${brtHour}h`;
            body = 'Hora de registrar seu estado! 🧠✨';

        }

        // 2. Fetch Users with Tokens
        const usersSnapshot = await admin.firestore().collection('users').get();
        const tokens: string[] = [];

        usersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.fcmToken) {
                tokens.push(data.fcmToken);
            }
        });

        if (tokens.length === 0) {
            return res.status(200).json({ success: true, message: 'No devices to notify.' });
        }

        // FCM multicast allows up to 500 tokens per batch. 
        // For simplicity, we assume < 500 users for this MVP.
        const message = {
            notification: {
                title: title || 'Psylogos Ping',
                body: body || 'Hora de registrar seu estado!',
            },
            tokens: tokens,
            // Android Configuration
            android: {
                priority: 'high',
                notification: {
                    priority: 'max',
                    channelId: 'high_importance_channel', // Allows user to config this channel specifically
                    defaultSound: true,
                    visibility: 'public', // Shows content on lock screen
                }
            },
            // Web/PWA Configuration
            webpush: {
                headers: {
                    Urgency: 'high'
                },
                notification: {
                    requireInteraction: true, // Keeps notification until user interacts
                    icon: '/icon-192x192.png',
                    badge: '/icon-192x192.png'
                }
            }
        };

        const response = await admin.messaging().sendEachForMulticast(message as any);

        console.log(`${response.successCount} messages were sent successfully`);

        // Cleanup invalid tokens
        if (response.failureCount > 0) {
            const tokensToRemove: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
                    tokensToRemove.push(tokens[idx]);
                }
            });

            if (tokensToRemove.length > 0) {
                const batch = admin.firestore().batch();
                const usersRef = admin.firestore().collection('users');
                const snapshot = await usersRef.where('fcmToken', 'in', tokensToRemove).get();
                snapshot.forEach(doc => {
                    batch.update(doc.ref, { fcmToken: admin.firestore.FieldValue.delete() });
                });
                await batch.commit();
                console.log(`Cleaned up ${tokensToRemove.length} invalid tokens`);
            }
        }

        return res.status(200).json({
            success: true,
            sentCount: response.successCount,
            failureCount: response.failureCount
        });

    } catch (error) {
        console.error('Broadcast Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
