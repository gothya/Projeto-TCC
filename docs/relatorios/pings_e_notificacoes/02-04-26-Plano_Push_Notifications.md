# Plano Técnico: Push Notifications de Ping — Psylogos
**Data:** 02/04/2026 — Revisado: 05/04/2026  
**Status:** 📋 Planejamento

---

## 1. Contexto e Diagnóstico

### O que já existe (e está funcionando)

| Componente | Arquivo | Status |
|---|---|---|
| Service Worker FCM (background) | `public/firebase-messaging-sw.js` | ✅ Implementado |
| Foreground listener + Notification API | `src/services/NotificationService.ts` | ✅ Implementado |
| `sendPushNotification` (Cloud Function, 1 token) | `functions/index.js` | ✅ Deployado |
| `saveTokenToFirestore` | `NotificationService.ts` | ⚠️ Salva na coleção errada — ver §2 |
| Broadcast multicast para todos os tokens | `api/send-broadcast.ts` | ❌ Comentado / desativado |
| Agendamento automático por horário de ping | — | ❌ Não existe |
| Pedido de permissão no Onboarding | `OnboardingPage.tsx` | ❌ Não está integrado |

### O problema central

A infraestrutura FCM existe, mas **não há nenhum mecanismo que dispare a notificação no horário certo**. Os pings ocorrem em horários fixos (`PING_HOURS = [9, 11, 13, 15, 17, 19, 21]`) durante 7 dias, o que torna o agendamento determinístico e completamente previsível.

---

## 2. Bug Crítico: Coleção Errada no `saveTokenToFirestore`

### O problema

`NotificationService.saveTokenToFirestore` salva o token FCM na coleção **`"users"`**:

```ts
// NotificationService.ts:101 — INCORRETO
const userRef = doc(db, "users", uid);
await setDoc(userRef, { fcmToken: token }, { merge: true });
```

Mas todos os dados dos participantes (incluindo `hasOnboarded` e `studyStartDate`) estão na coleção **`"participantes"`** (conforme `UserService.ts:49`).

### Impacto

- Tokens FCM de participantes que já fizeram onboarding estão em `"users"`, sem nenhuma leitura
- A Cloud Function agendada (Etapa 4) precisa consultar `hasOnboarded`, `studyStartDate` e `fcmToken` no mesmo documento — impossível se estiverem em coleções diferentes
- `studyStartDate` **está sendo salvo corretamente** em `"participantes"` via `createUser` (que faz spread do estado completo), mas nenhuma Cloud Function consegue cruzar com os tokens em `"users"`

### Correção

Alterar `saveTokenToFirestore` para salvar em `"participantes"`:

```ts
// NotificationService.ts — CORRETO
public async saveTokenToFirestore(uid: string, token: string) {
    if (!uid || !token) return;
    try {
        const userRef = doc(db, "participantes", uid); // ← era "users"
        await setDoc(userRef, { fcmToken: token }, { merge: true });
        console.log("Token saved to Firestore for user:", uid);
    } catch (error) {
        console.error("Error saving token to Firestore:", error);
    }
}
```

### Participantes já cadastrados

Tokens salvos em `"users"` para usuários existentes são inacessíveis pela Cloud Function e precisam ser re-obtidos. O **refresh silencioso no Dashboard** (Etapa 6) resolve isso automaticamente: quando o participante abrir o app após o deploy, um novo token é gerado e salvo na coleção correta.

> Não é necessário migrar os dados antigos de `"users"` — basta deixar o refresh reescrever em `"participantes"`.

---

## 3. Consideração Crítica: PWA e Suporte a Push por Plataforma

O Psylogos é acessado via navegador (PWA), não como app nativo instalado via loja. Isso impõe restrições importantes sobre **quem pode receber push notifications**:

| Plataforma | Instalado na tela inicial? | Push funciona? |
|---|---|---|
| Android (Chrome) | Não precisa instalar | ✅ Funciona |
| Android (Chrome) | Instalado (tela inicial) | ✅ Funciona (mais confiável) |
| iOS (Safari) < 16.4 | Qualquer | ❌ Não funciona |
| iOS (Safari) 16.4+ | **Não instalado** (aba Safari) | ❌ Não funciona |
| iOS (Safari) 16.4+ | **Instalado** (standalone/tela inicial) | ✅ Funciona |
| Desktop (Chrome/Firefox) | N/A | ✅ Funciona |

### Por que isso importa para o TCC

Uma parte significativa dos participantes provavelmente usará iPhone. Se não adicionarem o app à tela inicial, **não receberão nenhuma notificação de ping**, o que compromete diretamente a taxa de resposta e a validade dos dados coletados.

**A solução:** Adicionar uma etapa de instalação do PWA imediatamente após a conclusão do formulário sociodemográfico, antes de redirecionar para o Dashboard.

---

## 4. Análise de Risco por Etapa (App em Produção)

O app está em produção com usuários reais. As etapas têm perfis de risco diferentes:

| Etapa | Afeta usuários existentes? | Risco | Motivo |
|---|---|---|---|
| Correção do `saveTokenToFirestore` | Sim — mas silenciosamente positivo | 🟢 Baixo | Não quebra nada, apenas direciona tokens novos para o lugar certo |
| Tela de instalação no Onboarding | Não — só quem ainda não onboardou | 🟢 Baixo | Usuários existentes não passam pelo onboarding novamente |
| Pedido de permissão no Onboarding | Não — mesma razão | 🟢 Baixo | |
| Cloud Function agendada | Sim — começa a disparar para todos | 🟡 Médio | Usar feature flag antes de ativar |
| Service Worker | **Sim — afeta todos imediatamente** | 🔴 Alto | Atualizar por último, após validar tokens |
| Token refresh no Dashboard | Sim — roda ao abrir o app | 🟡 Médio | Primeiro deploy que faz algo para usuários existentes |
| Banner no Dashboard | Sim — visual | 🟢 Baixo | Sem lógica crítica, só exibe estado |

### Estratégia de deploy segura (ordem recomendada)

**Fase 1 — Sem impacto em usuários existentes:**
1. Correção do `saveTokenToFirestore` (`"users"` → `"participantes"`)
2. Tela de instalação no Onboarding (Etapa 5)
3. Pedido de permissão no Onboarding (Etapa 6)
4. Banner de fallback no Dashboard (Etapa 7, visual)

**Fase 2 — Afeta usuários existentes, testar antes:**

5. Refresh silencioso de token no Dashboard (Etapa 6) com `featureFlag.pushEnabled` no Firestore
6. Service Worker atualizado (Etapa 3) — último, após confirmar tokens chegando em `"participantes"`

**Fase 3 — Ativar o disparo:**

7. Cloud Function agendada com `featureFlag.sendPushEnabled: false` inicialmente
8. Ligar a flag após validar manualmente que tokens existem e notificações chegam

### Feature flag simples no Firestore

```js
// No início do handler da Cloud Function
const configSnap = await db.collection("config").doc("featureFlags").get();
if (!configSnap.data()?.sendPushEnabled) {
    console.log("Push notifications desativadas via feature flag.");
    return;
}
```

Criar o documento `config/featureFlags` com `{ sendPushEnabled: false }` antes do deploy. Ligar a `true` só quando pronto para testar em produção.

### Como testar sem ambiente de staging

1. **Conta de teste reservada** — fazer onboarding completo com nickname `"DEV_TEST"` em um celular próprio
2. **Isolar pelo `studyStartDate`** — `isParticipantActive` filtra por data; um participante de teste com data futura não recebe notificações acidentalmente
3. **Service Worker local** — usar `ngrok` ou `vite --https` para testar FCM em dispositivo real apontando para localhost
4. **Invocar a Cloud Function manualmente** antes de ativar o agendamento:
   ```bash
   firebase functions:shell
   > sendPingNotification()
   ```

---

## 5. Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────────┐
│                  Firebase Cloud Functions                   │
│                                                             │
│  [Scheduled Function]  ←── Horários: 9h, 11h, ... 21h BRT  │
│       ↓                                                     │
│  Lê "participantes" → filtra ativos com fcmToken           │
│       ↓                                                     │
│  FCM sendEachForMulticast(tokens[])                        │
│       ↓                                                     │
│  Limpa tokens inválidos automaticamente                    │
└─────────────────────────────────────────────────────────────┘
         ↓ notificação chega no dispositivo
┌─────────────────────────────────────────────────────────────┐
│                    PWA / Navegador                          │
│                                                             │
│  App em foreground → NotificationService.onMessageListener │
│  App em background → firebase-messaging-sw.js              │
│  Click na notif   → abre app + foca modal de ping          │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Novo Fluxo do Onboarding

```
Nickname + Sociodemográfico
        ↓
  userService.createUser()       ← salva dados em "participantes"
        ↓
  [Nova Etapa] Tela "Instale o App"
        ↓ (condicional)
  ┌─────────────────────────────────────────────────────┐
  │  iOS e NÃO standalone?                              │
  │  → Mostrar instrução: Safari → Compartilhar →       │
  │    "Adicionar à Tela de Início" → Reabrir o app     │
  │                                                     │
  │  Android?                                           │
  │  → Disparar beforeinstallprompt (banner nativo)     │
  │    ou mostrar instrução manual como fallback        │
  │                                                     │
  │  Já standalone (iOS ou Android)?                    │
  │  → Pular direto para pedido de permissão            │
  └─────────────────────────────────────────────────────┘
        ↓
  NotificationService.init() + salva FCM token em "participantes"
        ↓
  navigate("/dashboard")
```

---

## 7. Etapas de Implementação

### Etapa 1 — Corrigir `saveTokenToFirestore` (BUG FIX)

**Arquivo:** `src/services/NotificationService.ts` — linha 101

Alterar `"users"` para `"participantes"`:

```ts
const userRef = doc(db, "participantes", uid); // era "users"
```

> Esta é a correção mais urgente e de menor risco. Deve ser a primeira a ir para produção.

---

### Etapa 2 — Criar utilitários de detecção de PWA

**Arquivo:** `src/utils/pwaUtils.ts` (novo)

```ts
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;
}

export function needsInstallPrompt(): boolean {
  if (isIOS() && !isStandalone()) return true;
  return false;
}
```

---

### Etapa 3 — Service Worker com `skipWaiting` e ícone

**Arquivo:** `public/firebase-messaging-sw.js`

Adicionar ativação imediata para evitar estado inconsistente durante updates:

```js
const SW_VERSION = "1.1.0";
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'psylogos-ping',
    requireInteraction: true,
    vibrate: [200, 100, 200],
  });
});
```

> **Ícone:** Criar `icon-192x192.png` na pasta `public/`. O `vite.svg` atual não aparece bem como ícone de notificação.

> **Atenção:** Esta etapa afeta todos os usuários ativos. Aplicar por último, após validar que tokens estão chegando corretamente em `"participantes"`.

---

### Etapa 4 — Cloud Function Agendada com Feature Flag

**Arquivo:** `functions/index.js`

```js
const { onSchedule } = require("firebase-functions/v2/scheduler");

exports.sendPingNotification = onSchedule(
  {
    schedule: "0 12,14,16,18,20,22,0 * * *",
    timeZone: "America/Sao_Paulo",
    region: "southamerica-east1",
  },
  async (event) => {
    const db = admin.firestore();

    // Feature flag — ligar apenas após validação manual
    const configSnap = await db.collection("config").doc("featureFlags").get();
    if (!configSnap.data()?.sendPushEnabled) {
      console.log("Push desativado via feature flag.");
      return;
    }

    const now = new Date();
    const brtHour = now.getHours();
    const PING_HOURS = [9, 11, 13, 15, 17, 19, 21];
    if (!PING_HOURS.includes(brtHour)) return;

    // Lê APENAS de "participantes" — tokens e dados de jornada no mesmo documento
    const snapshot = await db.collection("participantes")
      .where("hasOnboarded", "==", true)
      .get();

    const tokens = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcmToken && isParticipantActive(data.studyStartDate)) {
        tokens.push(data.fcmToken);
      }
    });

    if (tokens.length === 0) return;

    const message = {
      notification: {
        title: `🧠 Hora do Ping das ${brtHour}h`,
        body: "Psylogos está esperando. Como você está se sentindo agora?",
      },
      android: { priority: "high" },
      webpush: {
        headers: { Urgency: "high" },
        notification: {
          requireInteraction: true,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: "psylogos-ping",
        }
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    await cleanupInvalidTokens(db, tokens, response);
  }
);

function isParticipantActive(studyStartDateIso) {
  if (!studyStartDateIso) return false;
  const start = new Date(studyStartDateIso);
  const now = new Date();
  const diffDays = (now - start) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

async function cleanupInvalidTokens(db, tokens, response) {
  const invalidTokens = [];
  response.responses.forEach((resp, idx) => {
    if (resp.error?.code === "messaging/registration-token-not-registered") {
      invalidTokens.push(tokens[idx]);
    }
  });

  if (invalidTokens.length === 0) return;

  const snapshot = await db.collection("participantes")
    .where("fcmToken", "in", invalidTokens)
    .get();

  const deletes = snapshot.docs.map(doc =>
    doc.ref.update({ fcmToken: admin.firestore.FieldValue.delete() })
  );
  await Promise.all(deletes);
  console.log(`🧹 ${deletes.length} tokens inválidos removidos.`);
}
```

---

### Etapa 5 — Tela de instalação do PWA no Onboarding

**Onde inserir:** Nova etapa de tela no `OnboardingScreen`, renderizada entre o `createUser` e o `navigate("/dashboard")` em `OnboardingPage.tsx`.

**Tela para iOS (não standalone):**
- Título: "Instale o Psylogos para receber os pings"
- Instrução visual passo a passo:
  1. Toque no ícone de compartilhar (□↑) no Safari
  2. Role para baixo e toque em **"Adicionar à Tela de Início"**
  3. Toque em **"Adicionar"**
  4. Abra o app pela tela inicial e continue
- Botão "Já instalei / Continuar" → detecta `isStandalone()`; se ainda não está, avisa mas permite pular

**Tela para Android (não instalado):**
- Mensagem suave: "Instalar garante que você receba todos os pings"
- Disparar `beforeinstallprompt` se disponível
- Botão "Instalar" e botão "Continuar sem instalar"

**Tela quando já está standalone:**
- Pular instrução, ir direto para pedido de permissão

---

### Etapa 6 — Pedido de permissão + refresh silencioso de token

**Onboarding** (`OnboardingPage.tsx`) — após tela de instalação:

```ts
const ns = await NotificationService.init();
const token = await ns.initializeNotificationsForNewUser();
if (token) await ns.saveTokenToFirestore(currentUser.uid, token);
```

**Dashboard** (`DashboardPage.tsx`) — refresh para usuários existentes e novos tokens:

```ts
useEffect(() => {
  async function refreshFcmToken() {
    if (!user) return;
    if (isIOS() && !isStandalone()) return; // iOS fora de standalone: impossível
    const ns = await NotificationService.init();
    if (Notification.permission === "granted") {
      const token = await ns.initializeNotificationsForNewUser();
      if (token) await ns.saveTokenToFirestore(user.uid, token);
    }
  }
  refreshFcmToken();
}, [user]);
```

> O refresh no Dashboard é o mecanismo que migra tokens de usuários existentes de `"users"` para `"participantes"` automaticamente, sem intervenção manual.

---

### Etapa 7 — Banner de fallback no Dashboard

Para participantes sem token ativo, exibir banner discreto:

```
⚠️ Você não está recebendo lembretes de ping.
```

- **iOS não standalone:** "Adicione o app à tela inicial para ativar" → instrução
- **Permissão negada:** "Ative as notificações nas configurações do seu navegador"
- **Token ausente por outro motivo:** "Toque aqui para reativar"

Condição de exibição: `!gameState.fcmToken || Notification.permission === 'denied'`

---

## 8. Checklist de Implementação (em ordem de deploy)

### Fase 1 — Segura para produção imediata
- [ ] **Etapa 1** — Corrigir `saveTokenToFirestore`: `"users"` → `"participantes"` em `NotificationService.ts:101`
- [ ] **Etapa 2** — Criar `src/utils/pwaUtils.ts`
- [ ] **Etapa 5** — Criar tela de instalação no `OnboardingScreen`
  - [ ] Layout iOS (passo a passo Safari)
  - [ ] Layout Android (`beforeinstallprompt` + fallback)
  - [ ] Detecção de standalone para liberar "Continuar"
- [ ] **Etapa 5** — Integrar nova tela no `OnboardingPage.tsx`
- [ ] **Etapa 7** — Banner de fallback no Dashboard

### Fase 2 — Testar antes de aplicar
- [ ] **Etapa 6** — Integrar `NotificationService` no Onboarding (após tela de instalação)
- [ ] **Etapa 6** — Refresh silencioso no Dashboard com guard de `isStandalone`
- [ ] **Etapa 4** — Implementar `sendPingNotification` com feature flag `sendPushEnabled: false`
  - [ ] Criar doc `config/featureFlags` no Firestore com `{ sendPushEnabled: false }`
  - [ ] Adicionar `cleanupInvalidTokens()` helper
  - [ ] `firebase deploy --only functions`
  - [ ] Testar invocação manual: `firebase functions:shell > sendPingNotification()`

### Fase 3 — Service Worker e ativação
- [ ] **Etapa 3** — Atualizar `firebase-messaging-sw.js` (após confirmar tokens em `"participantes"`)
  - [ ] Criar `icon-192x192.png` em `public/`
- [ ] Verificar no Firestore que tokens estão chegando em `"participantes"` (não em `"users"`)
- [ ] Setar `sendPushEnabled: true` no Firestore para ativar disparos
- [ ] **Teste manual iOS** — Push com app standalone em background
- [ ] **Teste manual Android** — Push com app em background sem instalação

---

## 9. Riscos e Considerações

### 🔴 Coleção errada — já documentado no §2
Correção obrigatória antes de qualquer outra etapa de notificação.

### ⚠️ iOS < 16.4
Push não funciona de forma alguma, independente de instalação.  
→ Documentar no Termo de Consentimento que o dispositivo precisa suportar notificações web.

### ⚠️ Participante instala o app APÓS o onboarding
O token não foi salvo na sessão de onboarding.  
→ O refresh silencioso no Dashboard e o banner de fallback resolvem automaticamente.

### ⚠️ Safari / iOS — nova instância ao instalar
Ao adicionar à tela inicial, o iOS abre standalone sem o estado do Safari.  
→ A sessão anônima do Firebase persiste via `localStorage` — sem perda de dados.

### ⚠️ `studyStartDate` — verificação concluída ✅
O campo é salvo corretamente em `"participantes"` via `createUser` (spread do estado completo). Nenhuma ação necessária.

---

## 10. Verificação Final

| Cenário | Comportamento esperado |
|---|---|
| App aberto (standalone) no ping das 9h | Notificação do sistema via `onMessageListener` |
| App fechado (standalone) no ping das 9h | Service Worker exibe notificação nativa |
| Clique na notificação | App abre (ou foca) e modal de ping se abre |
| iOS no Safari (não standalone) | Tela de instrução de instalação no onboarding |
| iOS < 16.4 ou permissão negada | Banner de fallback no Dashboard |
| Participante existente abre o Dashboard | Refresh silencioso migra token para `"participantes"` |
| Participante com jornada encerrada | Não recebe notificação (`isParticipantActive = false`) |
| Token expirado/inválido | Limpo automaticamente do Firestore por `cleanupInvalidTokens` |
| `sendPushEnabled: false` | Cloud Function loga e retorna sem disparar |
