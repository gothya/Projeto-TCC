/**
 * setAdminClaim.cjs
 * 
 * Usa o token do Firebase CLI para chamar a Identity Platform API
 * e atribuir o Custom Claim `admin: true` ao usuário gothya@gmail.com
 * 
 * Uso: node scripts/setAdminClaim.cjs
 */

const fs = require('fs');
const https = require('https');

const PROJECT_ID = 'psylogos-enigma-da-mente';
const TARGET_EMAIL = 'gothya@gmail.com';

// Credenciais OAuth2 do Firebase CLI (público, não é segredo)
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho843u0.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8ggCznFSaxg7507';

function httpsPost(hostname, path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(responseBody) });
        } catch {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpsPostForm(hostname, path, formData) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(formData).toString();
    const options = {
      hostname,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(responseBody) });
        } catch {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  // 1. Lê refresh token do Firebase CLI
  const configPath = process.env.USERPROFILE + '/.config/configstore/firebase-tools.json';
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.error('❌ Não foi possível ler o config do Firebase CLI:', e.message);
    process.exit(1);
  }

  const refreshToken = config.tokens?.refresh_token;
  if (!refreshToken) {
    console.error('❌ Refresh token não encontrado. Faça login com: firebase login');
    process.exit(1);
  }

  console.log('🔑 Trocando refresh token por access token...');
  const tokenRes = await httpsPostForm('oauth2.googleapis.com', '/token', {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  if (tokenRes.status !== 200 || !tokenRes.body.access_token) {
    console.error('❌ Falha ao obter access token:', JSON.stringify(tokenRes.body));
    process.exit(1);
  }

  const accessToken = tokenRes.body.access_token;
  console.log('✅ Access token obtido!\n');

  // 2. Busca o usuário pelo e-mail via Identity Platform API
  console.log(`🔍 Buscando usuário: ${TARGET_EMAIL} ...`);
  const lookupRes = await httpsPost(
    'identitytoolkit.googleapis.com',
    `/v1/projects/${PROJECT_ID}/accounts:lookup`,
    { email: [TARGET_EMAIL] },
    { Authorization: `Bearer ${accessToken}` }
  );

  if (lookupRes.status !== 200 || !lookupRes.body.accounts?.length) {
    console.error('❌ Usuário não encontrado:', JSON.stringify(lookupRes.body));
    process.exit(1);
  }

  const user = lookupRes.body.accounts[0];
  const uid = user.localId;
  console.log(`✅ Usuário encontrado!`);
  console.log(`   UID   : ${uid}`);
  console.log(`   Email : ${user.email}`);
  console.log(`   Claims: ${user.customAttributes || '(nenhum)'}\n`);

  // 3. Seta o custom claim admin: true via Identity Platform
  console.log('🔧 Atribuindo claim { admin: true } ...');
  const updateRes = await httpsPost(
    'identitytoolkit.googleapis.com',
    `/v1/projects/${PROJECT_ID}/accounts:update`,
    {
      localId: uid,
      customAttributes: JSON.stringify({ admin: true }),
    },
    { Authorization: `Bearer ${accessToken}` }
  );

  if (updateRes.status !== 200) {
    console.error('❌ Erro ao atualizar claims:', JSON.stringify(updateRes.body));
    process.exit(1);
  }

  console.log('✅ Claims atualizados com sucesso!');
  console.log(`   UID : ${uid}`);
  console.log(`   Claims: { admin: true }`);
  console.log('\n⚠️  Faça logout e login novamente no app para o novo token ser emitido.');
}

main().catch((e) => {
  console.error('❌ Erro inesperado:', e.message);
  process.exit(1);
});
