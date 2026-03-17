
const admin = require('firebase-admin');

// Initialize with project ID (uses Application Default Credentials via gcloud)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'psylogos-enigma-da-mente'
  });
}

const db = admin.firestore();

async function deleteIniciantes() {
  const collectionRef = db.collection('participantes');

  // Busca todos com nickname "Iniciante"
  const snapshot = await collectionRef
    .where('user.nickname', '==', 'Iniciante')
    .get();

  if (snapshot.empty) {
    console.log('Nenhum usuário "Iniciante" encontrado.');
    return;
  }

  // Filtra no código: remove apenas quem NÃO concluiu o onboarding
  // (hasOnboarded ausente ou false — campo pode não existir nos docs antigos)
  const toDelete = snapshot.docs.filter(doc => doc.data().hasOnboarded !== true);

  if (toDelete.length === 0) {
    console.log('Nenhum usuário "Iniciante" incompleto encontrado. Nenhum documento foi apagado.');
    return;
  }

  console.log(`Encontrados ${snapshot.size} com nickname "Iniciante".`);
  console.log(`Serão deletados: ${toDelete.length} (sem onboarding concluído).`);
  console.log(`Preservados: ${snapshot.size - toDelete.length} (com hasOnboarded: true).`);
  console.log('---');

  const batch = db.batch();
  toDelete.forEach(doc => {
    const data = doc.data();
    const email = data.email || data.user?.email || 'email não informado';
    console.log(`Deletando: ${doc.id} (${email})`);
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log('---');
  console.log(`Deleção concluída. ${toDelete.length} documento(s) removido(s).`);
}

deleteIniciantes().catch(console.error);
