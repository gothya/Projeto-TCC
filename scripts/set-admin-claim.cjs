/**
 * Script one-time: define o Custom Claim `admin: true` para o usuário admin.
 *
 * Pré-requisitos:
 *   1. Baixar a Service Account Key no Firebase Console:
 *      Project Settings → Service accounts → Generate new private key
 *   2. Salvar como `scripts/serviceAccountKey.json` (já está no .gitignore)
 *   3. Obter o UID do admin em Firebase Console → Authentication → usuário admin → copiar UID
 *
 * Uso:
 *   node scripts/set-admin-claim.js <UID_DO_ADMIN>
 *
 * Exemplo:
 *   node scripts/set-admin-claim.js abc123xyz
 */

const admin = require("firebase-admin");
const path = require("path");

const UID = process.argv[2];

if (!UID) {
  console.error("Erro: informe o UID do admin como argumento.");
  console.error("  node scripts/set-admin-claim.js <UID>");
  process.exit(1);
}

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch {
  console.error("Erro: serviceAccountKey.json não encontrado em scripts/");
  console.error("Baixe em: Firebase Console → Project Settings → Service accounts → Generate new private key");
  process.exit(1);
}

admin.auth().setCustomUserClaims(UID, { admin: true })
  .then(() => {
    console.log(`✅ Custom Claim 'admin: true' definido para UID: ${UID}`);
    console.log("O token do usuário será atualizado no próximo login ou refresh.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Erro ao definir Custom Claim:", err.message);
    process.exit(1);
  });
