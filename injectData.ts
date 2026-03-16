import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

// Initialize Firebase Admin
try {
  // Check if serviceAccountKey.json exists, otherwise use default credential if available
  const serviceAccountPath = './serviceAccountKey.json';
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
      initializeApp(); // Relies on GOOGLE_APPLICATION_CREDENTIALS
  }
} catch(e) {
  console.log("Error initializing, probably already initialized", e);
}


const db = getFirestore();

async function injectData(nickname: string) {
  try {
    const participantesRef = db.collection('participantes');
    const snapshot = await participantesRef.where('user.nickname', '==', nickname).get();

    if (snapshot.empty) {
      console.log(`No matching documents for nickname: ${nickname}.`);
      return;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    console.log(`Found user: ${doc.id} with email ${data.user?.email}`);

    // Create 25 fake responses (more than 50% of 49)
    const fakeResponses = Array.from({ length: 25 }).map((_, i) => ({
      timestamp: new Date(Date.now() - (25 - i) * 3600000).toISOString(), // distribute in the past
      type: "regular",
      pingDay: Math.floor(i / 7),
      pingIndex: i % 7,
      sam: { pleasure: 5 + (i % 3), arousal: 3 + (i % 4), dominance: 7 - (i % 2) },
      panas: { "Animado": 4, "Aflito": 1, "Entusiasmado": 5 },
      screenTimeLog: [{ platform: "Instagram", duration: "60" }, { platform: "WhatsApp", duration: "30" }],
      sleepQuality: 4 + (i % 2),
      stressfulEvents: i % 5 === 0 ? "Muito trabalho hoje" : ""
    }));

    // Generate 7 days x 7 pings
    const fakePings = Array.from({ length: 7 }).map((_, day) => ({
      date: new Date(Date.now() + day * 86400000).toISOString(),
      statuses: Array.from({ length: 7 }).map((_, ping) => {
        const totalIndex = day * 7 + ping;
        return totalIndex < 25 ? "completed" : "pending";
      })
    }));

    await doc.ref.update({
      responses: fakeResponses,
      pings: fakePings,
      "user.points": 1250,
      "user.level": 3
    });

    console.log(`Successfully injected test data for ${nickname}!`);
  } catch (error) {
    console.error("Error injecting data:", error);
  }
}

// Run for 'Captão'
injectData('Captão');
