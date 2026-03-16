import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

try {
  const serviceAccountPath = './serviceAccountKey.json';
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    initializeApp();
  }
} catch(e) {
  console.log("Error initializing", e);
}

const db = getFirestore();

const LEVEL_THRESHOLDS = [
  0, 160, 320, 480, 640, 800, 960, 1120, 1280, 1440, 1600, 1760, 1920, 2080,
  2240, 2400, 2560, 2720, 2880, 3040, 3200,
];

const calculateLevel = (xp: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
};

async function fixUser() {
  try {
    const participantesRef = db.collection('participantes');
    const snapshot = await participantesRef.where('user.nickname', '==', 'Captão').get();

    if (snapshot.empty) {
      console.log('No matching documents for nickname: Captão.');
      return;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const points = data.user?.points || 0;
    const currentLevel = data.user?.level || 1;
    
    const correctLevel = calculateLevel(points);
    console.log(`User Captão has ${points} points. Current level in DB: ${currentLevel}. Correct level: ${correctLevel}`);

    await doc.ref.update({
      'user.level': correctLevel
    });

    console.log('Successfully updated the user level!');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixUser();
