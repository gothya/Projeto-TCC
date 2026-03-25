# Relatório de Segurança — Psylogos TCC
**Data da auditoria:** 2026-03-24
**Data das correções:** 2026-03-24
**Revisor:** Engenharia (assistido por Claude Sonnet 4.6)
**Escopo:** Projeto completo (`c:/dev/Projeto-TCC`) — pré-produção

---

## Contexto importante

Firebase API Key presente no `.env` e no bundle **é comportamento esperado e by-design do Firebase Web SDK.** A segurança não depende de esconder essa chave — depende das Firestore Security Rules. Qualquer auditoria automática que marque isso como CRÍTICO está gerando um falso positivo para projetos Firebase.

Os pilares clássicos de auditoria foram avaliados no contexto do stack real do projeto:

| Pilar | Aplicável? | Status final |
|-------|-----------|--------|
| Chaves/secrets expostos | Parcialmente (VAPID, admin email) | ✅ Resolvido |
| RLS/Security Rules por usuário | Sim (Firestore Rules) | ✅ Resolvido |
| Lógica sensível no servidor | Sim (Cloud Functions) | ✅ Resolvido |
| Rate limiting em rotas de API | N/A — sem backend HTTP próprio | ✅ N/A |
| Verificação de assinatura em webhooks | N/A — sem pagamentos/webhooks | ✅ N/A |

---

## Vulnerabilidades encontradas e corrigidas

### [P0] ✅ `participantes` collection sem nenhuma Firestore Security Rule

**Arquivo corrigido:** `firestore.rules`

O arquivo original definia regras apenas para `/users/{userId}` — uma coleção que **não existe no código**. A aplicação inteira usa `participantes`. Qualquer pessoa autenticada podia ler todos os documentos de todos os participantes, incluindo respostas SAM/PANAS, tempo de tela e e-mail. A coleção `reactionEvaluations` também não tinha regra alguma.

**Correção aplicada:** regras reescritas cobrindo `participantes` e `reactionEvaluations`. Cada participante acessa apenas o próprio documento; admin acessa via Custom Claim.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /participantes/{userId} {
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update, delete: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null &&
                    (request.auth.uid == userId || request.auth.token.admin == true);
    }

    match /reactionEvaluations/{userId} {
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update, delete: if false; // imutável após envio
      allow read: if request.auth != null &&
                    (request.auth.uid == userId || request.auth.token.admin == true);
    }
  }
}
```

---

### [P0] ✅ Checagem de admin era puramente client-side

**Arquivos corrigidos:** `src/components/auth/AdminRoute.tsx`, `src/pages/DashboardPage.tsx`

O código original usava `user.email === 'gothya@gmail.com'` no React — uma barreira de UI que não protege os dados. Qualquer usuário autenticado podia fazer as mesmas queries Firestore diretamente.

**Correção aplicada:** checagem migrada para `user.getIdTokenResult()` — verificação assíncrona do Custom Claim `admin: true` emitido pelo servidor Firebase. E-mail hardcoded removido de ambos os arquivos.

```tsx
// AdminRoute.tsx — novo padrão
useEffect(() => {
  if (!user) { setIsAdmin(false); setClaimChecked(true); return; }
  user.getIdTokenResult()
    .then(result => { setIsAdmin(result.claims.admin === true); setClaimChecked(true); })
    .catch(() => { setIsAdmin(false); setClaimChecked(true); });
}, [user]);
```

---

### [P1] ✅ Cloud Function `sendPushNotification` sem autenticação

**Arquivo corrigido:** `functions/index.js`

A função original não verificava `request.auth`, permitindo que qualquer pessoa com o Project ID enviasse push notifications para qualquer FCM token. `cors: true` ampliava o vetor de chamada.

**Correção aplicada:** verificação obrigatória de autenticação + Custom Claim de admin. `cors` desativado.

```js
exports.sendPushNotification = onCall({ cors: false }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Autenticação obrigatória.");
  }
  if (!request.auth.token.admin) {
    throw new HttpsError("permission-denied", "Apenas administradores podem enviar notificações.");
  }
  // ...
```

---

### [P1] ✅ `.gitignore` já cobria `.env`

Verificado: `.env` e `.env.local` já estavam listados no `.gitignore`. Nenhuma ação necessária.

---

### [P2] ✅ `crypto-js` não é utilizado

Verificado via grep: `crypto-js` está no `package.json` mas **não é importado em nenhum arquivo** de `src/`. Dependência ociosa sem risco de uso inseguro.

---

## Execução e Deploy (2026-03-24)

### Custom Claim

Script renomeado para `scripts/set-admin-claim.cjs` (necessário porque `package.json` usa `"type": "module"`).

Executado com sucesso:
```
node scripts/set-admin-claim.cjs TTGgjPIshFT36PseLYPPFYPcdka2
✅ Custom Claim 'admin: true' definido para UID: TTGgjPIshFT36PseLYPPFYPcdka2
```

`serviceAccountKey.json` salvo em `scripts/` — coberto pelo `.gitignore`, nunca vai ao repositório.

### Deploy

```
firebase deploy --only firestore:rules,functions
```

Resultado:
- ✅ `firestore.rules` compiladas sem erros e publicadas
- ✅ `sendPushNotification` (Cloud Function) atualizada com sucesso

**Aviso não crítico do Firebase:** Node.js 20 nas Functions será descontinuado em 30/10/2026. Sem impacto imediato.

> **Ação necessária uma única vez:** fazer logout e login no app para o token Firebase ser renovado com o Custom Claim `admin: true`. Sem isso o painel admin permanece bloqueado pelas novas regras.

---

## Resumo final

| # | Vulnerabilidade | Prioridade | Status |
|---|----------------|-----------|--------|
| 1 | `participantes` e `reactionEvaluations` sem Firestore Rules | 🔴 P0 | ✅ Corrigido e deployado |
| 2 | Custom Claim de admin | 🔴 P0 | ✅ Definido via script + deployado |
| 3 | Checagem de admin client-side via e-mail | 🟠 P1 | ✅ Corrigido em `AdminRoute.tsx` e `DashboardPage.tsx` |
| 4 | Cloud Function sem autenticação / cors aberto | 🟠 P1 | ✅ Corrigido e deployado |
| 5 | `.env` fora do `.gitignore` | 🟠 P1 | ✅ Já estava coberto |
| 6 | `crypto-js` em uso sensível | 🟡 P2 | ✅ Não utilizado no código |

**Todos os itens resolvidos.** Nenhuma ação pendente além do logout/login manual no app.
