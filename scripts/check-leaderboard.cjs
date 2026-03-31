const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
async function run() { 
  const snapshot = await db.collection('leaderboard').get(); 
  snapshot.forEach(doc => console.log(doc.id, doc.data())); 
}
run().catch(console.error).finally(()=>process.exit(0));
