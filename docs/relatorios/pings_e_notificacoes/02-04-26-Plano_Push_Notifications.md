# Plano Técnico: Push Notifications de Ping — Psylogos
**Data:** 02/04/2026 — Revisado: 06/04/2026 (v10)  
**Status:** 🔴 Correções pendentes antes de ativar `sendPushEnabled: true` — ver §15 e §16

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

    // O cron (timeZone: "America/Sao_Paulo") é a única fonte de verdade do horário.
    // Não há guard interno de PING_HOURS — removido na revisão §13.3 (bug de timezone).
    // O título usa toLocaleString para obter a hora BRT corretamente:
    const brtHour = parseInt(
      new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false })
    );

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
  return diffDays >= 0 && diffDays < 7; // exclusivo: até o fim do dia 6 (corrigido §15.3)
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

### Etapa 7 — Teste unitário por participante via `sendPushNotification` (Opção B)

A função `sendPushNotification` (onCall, já deployada) permite enviar uma notificação para **um token específico** sem ativar a feature flag. Útil para validar que um participante individual está recebendo antes de ligar o disparo geral.

**Como usar via Firebase Functions shell:**

```bash
firebase functions:shell
```

```js
sendPushNotification({
  token: "TOKEN_FCM_DO_PARTICIPANTE",
  title: "🧠 Teste de Ping",
  body: "Você está recebendo notificações corretamente!"
})
```

**Onde pegar o token:** Firestore Console → `participantes` → documento do participante → campo `fcmToken`.

**Pré-requisito:** o usuário chamador precisa ter o custom claim `admin: true` no Firebase Auth. A chamada via shell já usa as credenciais do projeto, então funciona diretamente.

---

### Etapa 8 — Banner de fallback no Dashboard

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
- [x] **Etapa 1** — Corrigir `saveTokenToFirestore`: `"users"` → `"participantes"` em `NotificationService.ts:101`
- [x] **Etapa 2** — Criar `src/utils/pwaUtils.ts`
- [x] **Etapa 5** — Criar `PWAInstallScreen` com 3 views: prompt, instruções iOS, hint de alarme
  - [x] Layout iOS (passo a passo Safari)
  - [x] Layout Android (`beforeinstallprompt` + fallback)
  - [x] Detecção de standalone para liberar "Continuar"
  - [x] View de recusa com dica de alarmes e "Relatório de Jornada"
- [x] **Etapa 5** — Integrar `PWAInstallScreen` no `OnboardingPage.tsx` (todos os dispositivos, exceto já standalone)
- [x] **Menu** — Botão "Instalar o app" visível no menu hamburguer (ProfileMenu), com toast se já instalado
- [x] **Refinamento §9** — Adicionar `isAndroid()` em `pwaUtils.ts`
- [x] **Refinamento §9** — Corrigir roteamento inicial em `PWAInstallScreen`: iOS → ir direto para `ios-instructions`
- [x] **Bug §12** — Criar `src/utils/installPrompt.ts` com `initInstallPromptCapture`, `getInstallPrompt`, `clearInstallPrompt`
- [x] **Bug §12** — Chamar `initInstallPromptCapture()` em `index.tsx` antes do `ReactDOM.createRoot`
- [x] **Bug §12** — Refatorar `PWAInstallScreen`: remover `useEffect` + estado `deferredPrompt`, usar `getInstallPrompt()` no `handleInstall`
- [x] **Bug §12** — Corrigir bug do `outcome` ignorado e tratar ausência de prompt com `setView('skip-hint')`
- [ ] **Etapa 7** — Banner de fallback no Dashboard
- [x] **Teste** — Novo usuário criado; `fcmToken` confirmado em `participantes` no Firestore ✅

### Fase 2 — Testar antes de aplicar
- [x] **Etapa 6** — Integrar `NotificationService` no Onboarding (já implementado em `handlePwaInstallContinue`)
- [x] **Etapa 6 (revisada §13)** — Refresh silencioso no Dashboard: só se `!participante.fcmToken`; atua também se `permission === "default"` — cobre gap do iOS
- [x] **Etapa 4 (revisada §13)** — Implementar `sendPingNotification` sem check de `PING_HOURS` interno; com feature flag `sendPushEnabled: false`
  - [x] Criar doc `config/featureFlags` no Firestore com `{ sendPushEnabled: false }`
  - [x] Adicionar `cleanupInvalidTokens()` helper
  - [x] `firebase deploy --only functions`
  - [x] Testar invocação manual: `firebase functions:shell > sendPingNotification()` → log correto ✅
  - [x] Testar com `sendPushEnabled: true` → notificação recebida no dispositivo ✅

### Fase 3 — Service Worker e ativação
- [x] **Etapa 3** — Atualizar `firebase-messaging-sw.js` com `skipWaiting`, `clients.claim()`, ícone e `requireInteraction`
- [x] Criar `icon-192x192.png` em `public/` (copiado de `src/assets/logo/psylogos-logo-icon.png`)
- [x] Atualizar `manifest.json` para usar `icon-192x192.png`
- [x] Verificar tokens chegando em `participantes` — confirmado via Firestore Console ✅
- [x] Deploy do app no Firebase Hosting e merge na `main` → Vercel atualizado ✅
- [x] "App instalado ✓" exibido corretamente no menu; token salvo via refresh silencioso ✅
- [ ] Setar `sendPushEnabled: true` no Firestore para ativar disparos para todos os participantes
- [ ] **Teste manual iOS** — Push com app standalone em background
- [ ] **Teste manual Android** — Push com app em background sem instalação

### Fase 4 — Teste unitário por participante (Opção B)
- [ ] Usar `sendPushNotification` (onCall, painel admin) para enviar para um `fcmToken` específico
  - Pegar `fcmToken` do participante no Firestore Console
  - Chamar via Firebase Functions shell ou painel admin
  - Confirmar recebimento no dispositivo do participante antes de ativar para todos

### Fase 5 — Correções e ativação (§15 e §16 — v8)

> `VITE_FIREBASE_VAPID_KEY` confirmado como correto no Vercel. Causa raiz do falha em produção: **token vinculado a origem diferente do Vercel**.

- [ ] **🔴 Bug §15.1** — Remover lógica de push do `handleTimerEnd` em `DashboardPage.tsx:623-646` *(crítico — corrigir antes de qualquer deploy)*
- [ ] **🟡 Bug §15.2** — Remover `handlePushPermission` useEffect legado (`DashboardPage.tsx:269-291`)
- [ ] **🟡 Bug §15.3** — Corrigir `isParticipantActive` em `functions/index.js`: `<= 7` → `< 7`
- [ ] Deploy com as correções acima
- [ ] **§16 Passo 4** — Deletar `fcmToken` de participantes afetados no Firestore → aguardar regeneração pelo Vercel
- [ ] **§16 Passo 5** — Decidir sobre Firebase Hosting (redirecionar / desativar / documentar URL correta)
- [ ] **§16 Passo 6** — Testar iOS standalone com push em background
- [ ] **§16 Passo 7** — Setar `sendPushEnabled: true` no Firestore após validações acima
- [ ] **Melhoria §15.5** — Implementar banner de fallback (Etapa 8)

---

## 13. Revisão Crítica da Fase 2 (05/04/2026 — v5)

### 13.1 Item 1 — Refresh silencioso: roda desnecessariamente em toda abertura

**Problema do plano original:** o `useEffect` disparava a cada montagem do Dashboard (toda abertura do app), gerando chamada ao FCM + write no Firestore mesmo quando o token já existe e é válido. FCM tokens duram semanas.

**Correção:** checar primeiro se o participante já tem `fcmToken`. Só executar se ausente:

```ts
useEffect(() => {
  async function refreshFcmToken() {
    if (!user || !participante) return;
    if (participante.fcmToken) return; // já tem token — não refaz
    if (isIOS() && !isStandalone()) return; // iOS fora de standalone: impossível
    const permission = Notification.permission;
    if (permission === "denied") return; // usuário bloqueou — não incomoda
    const ns = await NotificationService.init();
    const token = await ns.initializeNotificationsForNewUser();
    if (token) await ns.saveTokenToFirestore(user.uid, token);
  }
  refreshFcmToken();
}, [user, participante]);
```

### 13.2 Item 1 — Gap do iOS: permissão nunca pedida após instalação

**Problema:** quando um usuário iOS instala o app e reabre pelo ícone da tela inicial, o `useEffect` de `OnboardingPage` detecta `hasOnboarded = true` e redireciona diretamente ao Dashboard — pulando o `requestNotificationPermission`. O usuário chega ao Dashboard sem token e com `Notification.permission === "default"` (nunca pedido).

O plano original só executava o refresh se `permission === "granted"`. Isso significa que o safety net também falhava para esses usuários.

**Correção:** o refresh no Dashboard deve também atuar quando `permission === "default"`, pedindo a permissão nesse momento:

```ts
// Cobrir tanto quem nunca pediu quanto quem já tinha concedido
if (permission === "denied") return; // só esse caso descarta
// "granted" e "default" continuam o fluxo normalmente
```

### 13.3 Item 3 — Bug crítico de timezone na Cloud Function

**Problema:** o plano incluía um guard interno de horário:

```js
const brtHour = now.getHours(); // retorna UTC, não BRT
const PING_HOURS = [9, 11, 13, 15, 17, 19, 21]; // são horas BRT
if (!PING_HOURS.includes(brtHour)) return; // nunca bate → função nunca envia
```

`Date.getHours()` em Cloud Functions retorna hora UTC. O `timeZone` do `onSchedule` controla apenas *quando o cron dispara*, não o que `Date` retorna. Quando o cron dispara às 12:00 UTC (= 9h BRT), `brtHour` seria `12` — fora de `PING_HOURS` — e a função retornaria sem enviar nada.

**Correção:** remover o check interno. O cron já é a fonte de verdade para o horário:

```js
// REMOVER — redundante e bugado:
// const brtHour = now.getHours();
// if (!PING_HOURS.includes(brtHour)) return;

// O título da notificação usa horário BRT — converter corretamente:
const brtHour = parseInt(
  new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false })
);
```

### 13.4 Item 3 — Limitação do `cleanupInvalidTokens`

O `where("fcmToken", "in", invalidTokens)` do Firestore suporta no máximo **30 valores** por query. Com mais de 30 tokens inválidos numa execução, a query lança exceção e nenhum token é limpo. Para o TCC com poucos participantes é inócuo, mas está documentado para consciência.

### 13.5 Resumo das mudanças em relação ao plano original

| Item | Plano original | Revisado |
|---|---|---|
| Refresh no Dashboard | Roda sempre que `user` muda | Só se `!participante.fcmToken` |
| Permissão no Dashboard | Só se `permission === "granted"` | Também se `permission === "default"` — cobre gap do iOS |
| Check de horário na Cloud Function | `now.getHours()` vs `PING_HOURS` BRT — bug | Removido; cron é a única fonte de verdade |
| Título da notificação com hora BRT | `${brtHour}h` de `getHours()` — errado | Converter via `toLocaleString` com `timeZone` |
| `cleanupInvalidTokens` | Sem limite documentado | Limitação de 30 tokens do `in` documentada |

---

## 9. Refinamento UX: Fluxo de Instalação por Dispositivo (05/04/2026 — v3)

### Problema identificado

- PC exibia instruções de iPhone (comportamento incorreto)
- `PWAInstallScreen` não tinha roteamento inicial por tipo de dispositivo — todos os dispositivos passavam pela tela de "prompt" genérica primeiro, e só depois chegavam às instruções iOS ao clicar em "Instalar"
- Resultado: experiência confusa e não otimizada para mobile

### Novo fluxo por dispositivo

| Dispositivo | Estado | Comportamento esperado |
|---|---|---|
| **iPhone/iPad** | Não standalone | Mostra **instruções iOS diretamente** (sem tela de prompt intermediária) |
| **iPhone/iPad** | Standalone | Toast "App instalado e pronto!" — tratado no ProfileMenu/Onboarding antes de abrir a tela |
| **Android** | Não instalado + `deferredPrompt` disponível | Tela de prompt → botão "Instalar" → dispara prompt nativo do Chrome |
| **Android** | Instalado (standalone) | Toast "App instalado e pronto!" — tratado antes de abrir a tela |
| **Desktop/PC** | Não instalado + `deferredPrompt` disponível | Tela de prompt → botão "Instalar" → dispara prompt nativo |
| **Desktop/PC** | Sem prompt disponível (já instalado ou não elegível) | Fecha silenciosamente via `onContinue()` |

### Mudanças de implementação planejadas

1. **`src/utils/pwaUtils.ts`** — adicionar `isAndroid()`:
   ```ts
   export function isAndroid(): boolean {
     return /Android/.test(navigator.userAgent);
   }
   ```

2. **`src/components/screen/PWAInstallScreen.tsx`** — roteamento inicial por dispositivo:
   - Substituir `useState<View>("prompt")` por estado calculado:
     ```ts
     const initialView: View = isIOS() ? "ios-instructions" : "prompt";
     const [view, setView] = useState<View>(initialView);
     ```
   - Isso elimina a tela de prompt desnecessária para iOS e leva diretamente às instruções
   - Para Android/Desktop: mantém o fluxo atual de prompt → install via `deferredPrompt`

3. **`src/components/menu/ProfileMenu.tsx`** — label do botão já está correto:
   - standalone → `"App instalado ✓"`
   - iOS não standalone → `"Como instalar o app"`
   - Android/Desktop não standalone → `"Instalar o app"`

### Por que o PC mostrava instruções de iPhone

A `PWAInstallScreen` sempre iniciava na view `"prompt"`. Nessa view, ao clicar em "Instalar", a função `handleInstall` verificava `isIOS()`. Se o usuário estava com DevTools abertos simulando um dispositivo iOS (ou se `isIOS()` retornou true por algum user-agent customizado), ele caia nas instruções de iPhone. O fix de inicializar com `isIOS() ? "ios-instructions" : "prompt"` corrige isso porque: no carregamento, o dispositivo é identificado corretamente; não há mais botão de "Instalar" na tela de iOS que redirecione para instruções depois.

---

## 10. Bug: Botão "Instalar" não aciona o banner nativo do navegador (PC/Android)

### Diagnóstico

O `beforeinstallprompt` é um evento **one-shot** — o navegador dispara ele **uma única vez**, logo no carregamento da página, quando decide que o PWA é instalável.

O código atual captura esse evento **dentro do `PWAInstallScreen`** via `useEffect`:

```tsx
// PWAInstallScreen.tsx — problema atual
useEffect(() => {
  const handler = (e: Event) => {
    e.preventDefault();
    setDeferredPrompt(e); // nunca chega aqui
  };
  window.addEventListener("beforeinstallprompt", handler);
  return () => window.removeEventListener("beforeinstallprompt", handler);
}, []);
```

Esse `useEffect` só roda quando o componente **monta** — ou seja, quando o usuário clica em "Instalar app" no menu. Mas o evento já disparou minutos antes, quando a página carregou. O componente perdeu o evento. Resultado: `deferredPrompt` fica `null` para sempre, e o `handleInstall` cai no `else { onContinue(); }` — fechando a tela silenciosamente sem nada acontecer.

| Momento | `useEffect` atual | Solução (módulo-level) |
|---|---|---|
| Página carrega | `PWAInstallScreen` não existe | Listener já ativo ✅ |
| `beforeinstallprompt` dispara | Ninguém ouve ❌ | Evento capturado ✅ |
| Usuário clica "Instalar app" | `deferredPrompt` é `null` ❌ | `getDeferredInstallPrompt()` retorna o evento ✅ |

### Solução

Capturar o `beforeinstallprompt` **no nível do módulo**, em `pwaUtils.ts`. Quando esse arquivo é importado (o que acontece cedo no ciclo de vida do app), o listener já fica registrado:

```ts
// pwaUtils.ts — adicionar
let _deferredInstallPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredInstallPrompt = e;
  });
}

export function getDeferredInstallPrompt() {
  return _deferredInstallPrompt;
}

export function clearDeferredInstallPrompt() {
  _deferredInstallPrompt = null;
}
```

`PWAInstallScreen` não precisa mais escutar o evento — apenas lê `getDeferredInstallPrompt()` no clique:

```tsx
const handleInstall = async () => {
  const prompt = getDeferredInstallPrompt();
  if (prompt) {
    prompt.prompt(); // abre o banner nativo do navegador
    const { outcome } = await prompt.userChoice;
    clearDeferredInstallPrompt();
    if (outcome === 'accepted') {
      onContinue();
    }
    // se recusou: permanece na tela (usuário pode pular)
  } else {
    // sem prompt disponível (PWA não elegível ou já instalado): fallback
    setView("skip-hint");
  }
};
```

### Casos adicionais a tratar

| Situação | Comportamento atual | Comportamento esperado |
|---|---|---|
| Usuário aceita o install | `onContinue()` → dashboard | Igual ✅ |
| Usuário rejeita o install | `onContinue()` silencioso ❌ | Permanece na tela com opção de pular |
| App já instalado (`isStandalone`) | Toast (tratado no Dashboard) | Correto ✅ |
| Prompt não disponível (PWA não elegível) | `onContinue()` silencioso ❌ | Exibir view `"skip-hint"` como fallback |

---

## 11. Riscos e Considerações

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

---

## 12. Adendo Técnico: Revisão Crítica do Bug §10 e Solução Revisada (05/04/2026 — v4)

### 12.1 O diagnóstico do §10 está correto

O root cause identificado é válido: `beforeinstallprompt` é um evento **one-shot** disparado pelo navegador logo no carregamento da página. O `useEffect` dentro do `PWAInstallScreen` só registra o listener quando o componente monta (i.e., quando o usuário já está na tela de instalação), momento em que o evento já disparou e foi perdido. O estado `deferredPrompt` fica `null` permanentemente.

### 12.2 Problemas na solução proposta pelo §10

#### ❌ Anti-pattern: estado mutable em módulo utilitário

A solução do §10 propõe adicionar um listener e uma variável `_deferredInstallPrompt` diretamente no `pwaUtils.ts`:

```ts
// pwaUtils.ts — proposta do §10 (problemática)
let _deferredInstallPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredInstallPrompt = e;
  });
}
```

Issues:

1. **Viola separação de responsabilidades.** `pwaUtils.ts` é um módulo de funções puras de detecção de ambiente. Introduzir estado mutable e side effects transforma o módulo num objeto implicitamente stateful — qualquer arquivo que importe `isIOS()` ativa o listener como efeito colateral não declarado.

2. **O timing ainda não é garantido.** A garantia de que `pwaUtils.ts` seja avaliado *antes* do evento disparar depende de quais outros arquivos o importam e de como o bundler organiza o carregamento. Se o único consumidor for o próprio `PWAInstallScreen` (que é lazy-mounted), o módulo pode ser avaliado tarde demais — exatamente o mesmo problema que existe hoje.

3. **Não usa `{ once: true }`.** O evento `beforeinstallprompt` dispara uma única vez. O listener deveria se auto-remover com `{ once: true }` para não ficar pendurado indefinidamente.

#### ❌ Bug adicional identificado no código atual (não mencionado no §10)

No `PWAInstallScreen.tsx` atual (linhas 37–39), o resultado do `userChoice` é ignorado:

```tsx
// ATUAL — bug
await deferredPrompt.userChoice; // outcome ignorado
setDeferredPrompt(null);
onContinue(); // chamado sempre, mesmo se o usuário RECUSOU a instalação
```

O correto é desestruturar o `outcome` e só chamar `onContinue()` se o usuário aceitou. Se recusou, deve permanecer na tela.

### 12.3 Solução revisada: singleton isolado + inicialização em `main.tsx`

A abordagem correta é criar um **módulo singleton com responsabilidade única** (`installPrompt.ts`) e inicializá-lo **explicitamente no ponto de entrada da aplicação** (`main.tsx`), antes de qualquer renderização.

#### Estrutura proposta

```
src/
  utils/
    pwaUtils.ts        ← mantido: apenas funções puras de detecção (sem alterações)
    installPrompt.ts   ← novo: singleton responsável exclusivamente pelo prompt
```

#### `src/utils/installPrompt.ts` (novo arquivo)

```ts
type DeferredPromptEvent = {
  prompt(): void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let _prompt: DeferredPromptEvent | null = null;

export function initInstallPromptCapture(): void {
  window.addEventListener(
    'beforeinstallprompt',
    (e) => {
      e.preventDefault();
      _prompt = e as unknown as DeferredPromptEvent;
    },
    { once: true } // alinha com comportamento real do evento
  );
}

export function getInstallPrompt(): DeferredPromptEvent | null {
  return _prompt;
}

export function clearInstallPrompt(): void {
  _prompt = null;
}
```

#### `src/main.tsx` — inicialização explícita

```tsx
import { initInstallPromptCapture } from '@/src/utils/installPrompt';

// Registrar antes de qualquer renderização — garante captura do evento
initInstallPromptCapture();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### `src/components/screen/PWAInstallScreen.tsx` — simplificado

```tsx
import { getInstallPrompt, clearInstallPrompt } from '@/src/utils/installPrompt';

// Remover: useEffect de captura (linhas 17-24)
// Remover: estado deferredPrompt

const handleInstall = async () => {
  const prompt = getInstallPrompt();
  if (!prompt) {
    // Sem prompt disponível: feedback visual, não silêncio
    setView('skip-hint');
    return;
  }
  prompt.prompt();
  const { outcome } = await prompt.userChoice;
  clearInstallPrompt();
  if (outcome === 'accepted') {
    onContinue();
  }
  // Se recusou: permanece na tela — usuário pode pular via botão
};
```

### 12.4 Comparativo das abordagens

| Critério | §10 (módulo-level em `pwaUtils`) | **Revisado (`installPrompt.ts` + `main.tsx`)** |
|---|---|---|
| Timing garantido | ⚠️ Depende de quando `pwaUtils` é importado | ✅ `main.tsx` roda antes de qualquer renderização |
| Separação de responsabilidades | ❌ `pwaUtils` vira stateful com side effects | ✅ Módulo com propósito único e declarado |
| `{ once: true }` no listener | ❌ Não usa | ✅ Alinha com o comportamento real do evento |
| Bug do `outcome` ignorado | ❌ Não cobre | ✅ Corrigido junto |
| Caso sem prompt (`null`) | `onContinue()` silencioso ❌ | `setView('skip-hint')` com feedback ✅ |

### 12.5 Observações adicionais sobre `installPrompt.ts`

#### `initInstallPromptCapture` não é idempotente

Se chamada duas vezes, registra dois listeners. O segundo seria inútil (o `{ once: true }` remove o primeiro após disparo), mas para ser defensivo:

```ts
export function initInstallPromptCapture(): void {
  if (_prompt !== null) return; // guard de idempotência
  window.addEventListener('beforeinstallprompt', ...);
}
```

Não é um problema na prática (só é chamada em `main.tsx`), mas protege contra usos futuros inadvertidos.

#### Guard de SSR ausente

O §10 incluía `if (typeof window !== 'undefined')`. O §12 não tem esse guard. Para este projeto (PWA puro, sem SSR), não é problema — `main.tsx` só roda no navegador. Documentado aqui apenas para consciência: se o codebase algum dia adotar SSR, a chamada em `main.tsx` precisaria do guard ou ser movida para um ponto exclusivamente client-side.

---

### 12.6 Atualização do checklist (Fase 1)

Substituir os 3 itens do Bug §10 no checklist por:

- [ ] Criar `src/utils/installPrompt.ts` com `initInstallPromptCapture`, `getInstallPrompt`, `clearInstallPrompt`
- [ ] Chamar `initInstallPromptCapture()` no `main.tsx`, antes do `ReactDOM.createRoot`
- [ ] Refatorar `PWAInstallScreen`: remover `useEffect` + estado `deferredPrompt`, usar `getInstallPrompt()` no `handleInstall`
- [ ] Corrigir bug do `outcome` ignorado: desestruturar `userChoice` e condicionar `onContinue()` ao `'accepted'`
- [ ] Tratar ausência de prompt com `setView('skip-hint')` em vez de `onContinue()` silencioso

---

## 14. Diagnóstico: Notificações funcionam em localhost mas não em produção (06/04/2026 — v6)

### Contexto

Após implementação completa das Fases 1, 2 e 3, os testes em localhost funcionaram corretamente. Em produção (Vercel — `projeto-tcc-pi.vercel.app`), nenhuma notificação foi recebida por participante real no Android.

---

### Causa raiz provável — Token vinculado à origem errada

FCM tokens são **vinculados à origem (domínio) onde o Service Worker foi registrado**. Um token gerado em `psylogos-enigma-da-mente.web.app` está vinculado ao SW desse domínio. Um token gerado em `localhost:3000` está vinculado ao SW do localhost. Eles não são intercambiáveis.

| Sessão de teste | Origem | Token no Firestore | Resultado |
|---|---|---|---|
| Teste que funcionou | `localhost:3000` | Gerado no localhost | Notificação chegou no localhost ✅ |
| Participante no Android | `projeto-tcc-pi.vercel.app` | Possivelmente de outra origem | Não chegou ❌ |

Quando `sendPingNotification` enviou para o token salvo no Firestore, o FCM entregou a mensagem ao SW da **origem em que o token foi gerado** — que pode não estar instalado no celular do participante.

### ~~Causa secundária provável — `VITE_FIREBASE_VAPID_KEY` ausente no Vercel~~ ✅ Descartada

`VITE_FIREBASE_VAPID_KEY` confirmado como corretamente configurado no Vercel (verificado em 06/04/2026). Não é causa do problema.

### Causas terciárias (Android específico)

| Causa | Descrição |
|---|---|
| **Otimização de bateria** | Android mata o processo do Chrome em background, impedindo o SW de receber a mensagem |
| **SW não atualizado no dispositivo** | Participante pode estar com o SW antigo (sem `skipWaiting`) — notificação chega mas ninguém processa |
| **Notificação bloqueada no OS** | Permissão concedida no navegador mas bloqueada nas configurações do Android → Chrome → Notificações |

---

### Plano de verificação (em ordem de probabilidade)

**~~Passo 1 — Verificar `VITE_FIREBASE_VAPID_KEY` no Vercel~~** ✅ Confirmado correto em 06/04/2026.

**Passo 2 — Verificar qual token está no Firestore do participante:**
- Firestore Console → `participantes` → documento do participante → campo `fcmToken`
- Identificar em qual origem o token foi gerado (não é visível diretamente, mas pode ser inferido pela sessão de quando foi salvo)

**Passo 3 — Forçar regeneração do token no Vercel:**
- Participante abre `projeto-tcc-pi.vercel.app`
- Deletar manualmente o campo `fcmToken` no documento do participante no Firestore
- O refresh silencioso do Dashboard vai gerar e salvar um novo token vinculado ao Vercel
- Confirmar que o novo token apareceu no Firestore

**Passo 4 — Verificar otimização de bateria no Android:**
- Configurações → Aplicativos → Chrome → Bateria → Sem restrições

**Passo 5 — Testar com token novo:**
- Com `sendPushEnabled: true`, executar `sendPingNotification()` via shell
- Ou usar `admin.messaging().send({ token: "NOVO_TOKEN", ... })` diretamente no shell

---

### Lição arquitetural

O projeto tem **dois hostings paralelos** (Firebase Hosting e Vercel) com origens diferentes. Tokens FCM são origem-específicos. Para evitar confusão:

- **Definir uma única origem de produção** — preferencialmente o Vercel (`projeto-tcc-pi.vercel.app`) já que é o que os participantes usam
- **Remover o Firebase Hosting** ou usá-lo apenas como fallback sem notificações
- Garantir que todos os tokens no Firestore foram gerados no Vercel antes de ativar `sendPushEnabled: true` definitivamente

---

## 15. Revisão de Código: Bugs Adicionais Identificados (06/04/2026 — v7)

Revisão detalhada dos arquivos `DashboardPage.tsx` e `functions/index.js` após o erro em produção revelou três bugs não documentados nas versões anteriores deste plano.

### Priorização dos itens

| Item | Criticidade | Motivo |
|---|---|---|
| **15.1** — `handleTimerEnd` enviando push | 🔴 Crítico | Gera erro `permission-denied` em produção a cada ping |
| **15.2** — dois refresh paralelos | 🟡 Médio | Gera chamada extra ao FCM a cada abertura do app |
| **15.3** — `isParticipantActive` inclui dia 8 | 🟡 Médio | Dado coletado fora da janela de estudo é inválido para o TCC |
| **15.4** — banner de fallback | 🟢 Baixo | Feature nova, não é bug |
| **15.5** — diagnóstico de logs | 🟢 Baixo | Investigação, não corrige comportamento |

> O item **15.1 deve ser corrigido antes de qualquer deploy**, independente do estado do `sendPushEnabled`. Os demais podem ser agrupados num único PR de correção antes de ativar o disparo.

---

### 15.1 Bug crítico: `handleTimerEnd` tenta enviar push como participante não-admin

**Arquivo:** `DashboardPage.tsx:623–646`

```ts
const handleTimerEnd = useCallback(async () => {
  if (!isActiveWindow) {
    setIsBellVisible(true);
    try {
      const currentToken = await getToken(getMessaging(), {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      if (currentToken) {
        const response = await sendPush({ // sendPush = sendPushNotification (onCall)
          token: currentToken,
          title: "É hora do Ping!",
          body: "Você tem 50 minutos para responder ao seu ping do Psylogos."
        });
      }
    }
    catch (error) {
      console.error("Error fetching FCM token:", error);
    }
  }
}, [isActiveWindow, sendPush]);
```

**Problemas:**

1. **`permission-denied` silencioso para todos os participantes.** A função `sendPushNotification` exige `request.auth.token.admin === true`. Participantes normais não têm esse claim. Toda vez que o timer de um ping futura zera com o app aberto, o Firebase Functions retorna `permission-denied` — catchado silenciosamente, sem nenhuma indicação para o usuário.

2. **Lógica de push no cliente é inútil para o objetivo.** Push notifications existem para alertar quem está **com o app fechado**. Quando o `handleTimerEnd` executa, o app está obrigatoriamente aberto — o sino já aparece via `setIsBellVisible(true)`. Enviar push para o próprio dispositivo que já está com o app aberto é redundante e gera custo desnecessário no FCM.

3. **Pode duplicar notificações.** Se por algum motivo o `sendPush` tivesse permissão (ex: teste com conta admin) e a Cloud Function agendada também disparasse no mesmo horário, o participante receberia dois pushes.

**Correção:** Remover completamente o bloco de `sendPush` do `handleTimerEnd`. O sino (`setIsBellVisible(true)`) é suficiente para quem está com o app aberto. A Cloud Function agendada é a única fonte de verdade para pushes.

```ts
// CORRETO — sem chamada ao FCM
const handleTimerEnd = useCallback(async () => {
  if (!isActiveWindow) {
    setIsBellVisible(true); // suficiente — app está aberto
  }
}, [isActiveWindow]);
```

---

### 15.2 Bug: dois mecanismos de refresh de token paralelos no Dashboard

**Arquivo:** `DashboardPage.tsx:269–291` vs `85–100`

O Dashboard tem dois `useEffect` que lidam com token FCM de forma independente:

**Mecanismo A (correto — §13):** linhas 85–100
```ts
useEffect(() => {
  async function refreshFcmToken() {
    if (!user || !participante) return;
    if (participante.fcmToken) return; // ← guarda condicional correto
    if (isIOS() && !isStandalone()) return;
    if (Notification.permission === "denied") return;
    // ...
  }
  refreshFcmToken();
}, [user, participante]);
```

**Mecanismo B (legado — problemático):** linhas 269–291
```ts
useEffect(() => {
  async function handlePushPermission() {
    const currentPermission = Notification.permission;
    if (currentPermission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") await registerPushToken();
    }
    if (currentPermission === "granted") {
      await registerPushToken(); // ← sem guarda de "já tem token"
    }
  }
  handlePushPermission();
}, []); // ← roda uma vez na montagem, sem dependências
```

O Mecanismo B chama `registerPushToken()` (que internamente chama `ns.requestPermission()` → `getToken()`) **a cada montagem do Dashboard**, independente de o token já existir. Isso contraria diretamente a melhoria do §13.1 e gera uma chamada ao FCM a cada abertura do app.

**Correção:** Remover o Mecanismo B. O Mecanismo A já cobre todos os casos: token ausente, permissão `"default"`, iOS não-standalone. Não há razão para manter os dois em paralelo.

---

### 15.3 Bug lógico: `isParticipantActive` inclui o 8º dia

**Arquivo:** `functions/index.js:103–109`

```js
function isParticipantActive(studyStartDateIso) {
  if (!studyStartDateIso) return false;
  const start = new Date(studyStartDateIso);
  const now = new Date();
  const diffDays = (now - start) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7; // ← inclui valores entre 7.0 e 8.0
}
```

A jornada de pesquisa tem 7 dias (dias 0 a 6, índice base-zero). Quando `diffDays` está entre `7.0` e `8.0` (ou seja, qualquer momento do 8º dia corrido), a condição `<= 7` ainda retorna `true` — e o participante recebe push mesmo após o encerramento oficial da coleta.

Para um TCC onde cada resposta precisa estar dentro da janela de estudo, isso é um dado inválido.

**Correção:**

```js
return diffDays >= 0 && diffDays < 7; // exclusivo: até o fim do dia 6
```

---

### 15.4 Resumo das correções

| Bug | Arquivo | Linha | Severidade | Correção |
|---|---|---|---|---|
| `handleTimerEnd` chama push como não-admin | `DashboardPage.tsx` | 623–646 | 🔴 Alta | Remover bloco de `sendPush` |
| `handlePushPermission` rodando sem guarda | `DashboardPage.tsx` | 269–291 | 🟡 Média | Remover `useEffect` legado |
| `isParticipantActive` inclui 8º dia | `functions/index.js` | 108 | 🟡 Média | `<= 7` → `< 7` |

> **Pré-condição para ativar `sendPushEnabled: true`:** os bugs 15.1 e 15.2 devem ser corrigidos e tokens dos participantes devem ter sido regenerados na origem correta (Vercel) — ver §16.

---

## 16. Plano de Execução Revisado (06/04/2026 — v8)

### Contexto atual

- `VITE_FIREBASE_VAPID_KEY` confirmado como corretamente configurado no Vercel
- Causa raiz do falha em produção: **token FCM vinculado a origem diferente do Vercel** (gerado em localhost ou Firebase Hosting)
- Bugs do §15 identificados mas ainda não corrigidos
- `sendPushEnabled` permanece `false` no Firestore

### Ações em ordem de execução

#### Passo 1 — Corrigir Bug 15.1 (obrigatório antes de qualquer deploy)

**Arquivo:** `DashboardPage.tsx`, linhas 623–646

Remover o bloco de `sendPush` dentro do `handleTimerEnd`. O sino (`setIsBellVisible(true)`) é suficiente — o app está aberto nesse momento. Nenhum push é necessário.

```ts
// CORRETO — após correção
const handleTimerEnd = useCallback(async () => {
  if (!isActiveWindow) {
    setIsBellVisible(true);
  }
}, [isActiveWindow]);
```

#### Passo 2 — Corrigir Bug 15.2 (mesmo PR)

**Arquivo:** `DashboardPage.tsx`, linhas 269–291

Remover o `useEffect` do Mecanismo B (`handlePushPermission`). O Mecanismo A (refresh silencioso com guard `!participante.fcmToken`) cobre todos os casos.

#### Passo 3 — Corrigir Bug 15.3 (mesmo PR)

**Arquivo:** `functions/index.js`

Alterar `diffDays <= 7` para `diffDays < 7` em `isParticipantActive`.

> Os passos 1, 2 e 3 podem ir no mesmo commit/PR. Deploy via `npm run build && vercel --prod` + `firebase deploy --only functions`.

#### Passo 4 — Forçar regeneração dos tokens no Vercel

Para cada participante com `fcmToken` no Firestore que pode ter sido gerado em outra origem (localhost ou Firebase Hosting):

1. Abrir **Firestore Console** → coleção `participantes` → documento do participante
2. **Deletar o campo `fcmToken`** manualmente
3. Pedir ao participante que abra `projeto-tcc-pi.vercel.app`
4. O refresh silencioso no Dashboard vai detectar `!participante.fcmToken` e gerar um novo token vinculado ao Vercel
5. Confirmar que o campo `fcmToken` reapareceu no Firestore com novo valor

> Este passo deve ser feito para **todos os participantes ativos** antes de ativar o disparo.

#### Passo 5 — Decidir sobre Firebase Hosting

Enquanto `psylogos-enigma-da-mente.web.app` estiver ativo, qualquer acesso por essa URL gera tokens vinculados ao Firebase Hosting — que não funcionam no Vercel. Opções:

| Opção | O que fazer |
|---|---|
| **A — Redirecionar** | Configurar `firebase.json` para redirecionar todo tráfego para o Vercel |
| **B — Desativar** | Remover o site do Firebase Hosting no console |
| **C — Aceitar** | Documentar que a URL oficial é o Vercel e orientar participantes a usarem apenas ela |

> Para o TCC, a opção C é a mais prática desde que os participantes tenham sido instruídos a acessar a URL correta.

#### Passo 6 — Testar iOS standalone com push

Cenário crítico não validado ainda:

1. Instalar o app no iPhone como PWA (Safari → Compartilhar → Adicionar à Tela de Início)
2. Fechar o app (não apenas colocar em background — sair completamente)
3. Executar `sendPingNotification()` via Firebase Functions shell com `sendPushEnabled: true`
4. Confirmar recebimento da notificação no iPhone

Se falhar, investigar: permissão concedida no standalone? SW registrado corretamente? Token salvo com origem correta (`projeto-tcc-pi.vercel.app`)?

#### Passo 7 — Ativar `sendPushEnabled: true`

Somente após:
- [x] Bugs 15.1, 15.2, 15.3 corrigidos e em produção
- [ ] Tokens de todos os participantes ativos regenerados no Vercel
- [ ] Teste iOS standalone validado (ou documentado como limitação conhecida)

No Firestore Console → `config/featureFlags` → alterar `sendPushEnabled` de `false` para `true`.

### Checklist da §16

- [ ] Remover bloco `sendPush` de `handleTimerEnd` (Bug 15.1)
- [ ] Remover `handlePushPermission` useEffect legado (Bug 15.2)
- [ ] Corrigir `isParticipantActive`: `<= 7` → `< 7` (Bug 15.3)
- [ ] Deploy com as correções acima
- [ ] Deletar `fcmToken` de participantes afetados no Firestore
- [ ] Confirmar regeneração do token pelo Vercel para cada participante
- [ ] Decidir sobre Firebase Hosting (redirecionar / desativar / documentar)
- [ ] Testar iOS standalone com push em background
- [ ] Setar `sendPushEnabled: true` no Firestore

---

## 17. Feature: Envio de Notificação por Participante no Painel do Pesquisador (06/04/2026 — v9)

### Objetivo

Permitir que o pesquisador envie uma **notificação de teste** para um participante específico diretamente pelo `AdminDashboardPage`, sem precisar do Firebase Functions shell.

### Estado atual da infraestrutura

| Componente | Status | Detalhe |
|---|---|---|
| `sendPushNotification` (onCall) | ✅ Deployado | Aceita `{ token, title, body }`, exige custom claim `admin: true` |
| `AdminDashboardPage.tsx` | ✅ Existe | Carrega todos os participantes, tem busca e seleção individual |
| Padrão de chamada onCall no frontend | ✅ Existe | `getFunctions` + `httpsCallable` já usados em `DashboardPage.tsx` |

Nenhuma Cloud Function nova é necessária. A implementação é **exclusivamente frontend**, em `AdminDashboardPage.tsx`.

---

### O que será construído

Um bloco na área de detalhes do participante selecionado (`selectedUser !== null`):

```
┌──────────────────────────────────────────────────┐
│  Enviar notificação de teste                      │
│                                                  │
│  FCM Token: ✅ disponível                        │
│  (ou: ❌ sem token — participante precisa         │
│   abrir o app em projeto-tcc-pi.vercel.app)       │
│                                                  │
│  [ Enviar Ping de Teste ]                        │
└──────────────────────────────────────────────────┘
```

---

### Implementação

#### Arquivo: `src/pages/AdminDashboardPage.tsx`

**1. Adicionar import:**

```ts
import { getFunctions, httpsCallable } from "firebase/functions";
```

**2. Dentro do componente, junto dos outros states:**

```ts
const [sendingPing, setSendingPing] = useState(false);
const functions = getFunctions();
const sendPushNotification = httpsCallable(functions, 'sendPushNotification');
```

**3. Handler:**

```ts
const handleSendTestPing = async () => {
  if (!selectedUser?.fcmToken) {
    setToast("Participante sem token FCM. O app precisa ser aberto em projeto-tcc-pi.vercel.app primeiro.");
    return;
  }
  setSendingPing(true);
  try {
    await sendPushNotification({
      token: selectedUser.fcmToken,
      title: "🧠 Ping de Teste — Pesquisador",
      body: `Ping enviado manualmente para ${selectedUser.user.nickname}.`,
    });
    setToast(`✅ Notificação enviada para ${selectedUser.user.nickname}`);
  } catch (error: any) {
    setToast(`❌ Erro ao enviar: ${error.message}`);
  } finally {
    setSendingPing(false);
  }
};
```

**4. Bloco de UI (na seção de detalhes de `selectedUser`):**

```tsx
<div className="mt-4 p-4 border rounded-lg bg-gray-800">
  <p className="text-sm font-semibold text-white mb-2">Enviar notificação de teste</p>

  {selectedUser.fcmToken ? (
    <p className="text-xs text-green-400 mb-3">✅ Token FCM disponível</p>
  ) : (
    <p className="text-xs text-red-400 mb-3">
      ❌ Sem token FCM — participante precisa abrir o app no Vercel
    </p>
  )}

  <button
    onClick={handleSendTestPing}
    disabled={sendingPing || !selectedUser.fcmToken}
    className="px-4 py-2 bg-blue-600 text-white text-sm rounded disabled:opacity-50"
  >
    {sendingPing ? "Enviando..." : "Enviar Ping de Teste"}
  </button>
</div>
```

---

### Pré-condição de segurança

A Cloud Function exige `request.auth.token.admin === true`. O pesquisador precisa ter o **custom claim `admin: true`** no Firebase Auth.

Para verificar: Firebase Console → Authentication → usuário do pesquisador → Custom Claims.  
Se ausente, adicionar via Firebase Admin SDK ou script antes de usar o botão.

---

### Checklist da §17

- [ ] Adicionar import de `getFunctions`, `httpsCallable` em `AdminDashboardPage.tsx`
- [ ] Adicionar `sendingPing` state e callable `sendPushNotification`
- [ ] Implementar `handleSendTestPing`
- [ ] Adicionar bloco de UI na seção de detalhes do participante selecionado
- [ ] Verificar que o pesquisador tem custom claim `admin: true` no Firebase Auth
- [ ] Testar: participante com token → notificação recebida
- [ ] Testar: participante com token → notificação recebida
- [ ] Testar: participante sem token → toast de aviso correto

---

## 18. Feature: Reset automático de tokens FCM por origem (06/04/2026 — v10)

### Problema

Apagar `fcmToken` manualmente no Firestore para cada participante é inviável. Além disso, a guard `if (participante.fcmToken) return;` no refresh silencioso impedia a substituição de tokens gerados em outra origem (ex: localhost ou Firebase Hosting).

### Solução em duas partes

#### Parte 1 — Detecção e auto-regeneração por origem

**`src/services/NotificationService.ts` — `saveTokenToFirestore`:**
Salva `fcmTokenOrigin: window.location.origin` junto com o token. Permite identificar de qual origem o token veio.

**`src/pages/DashboardPage.tsx` — refresh silencioso:**
```ts
const tokenOriginMatch = participante.fcmTokenOrigin === window.location.origin;
if (participante.fcmToken && tokenOriginMatch) return; // token válido e da origem certa
// caso contrário: regenera automaticamente
```

Com isso, qualquer participante com token de origem errada tem o token substituído automaticamente na próxima abertura do app no Vercel — sem intervenção manual.

**`src/components/data/GameState.tsx`:**
```ts
fcmTokenOrigin?: string; // origem onde o token FCM foi gerado
```

#### Parte 2 — Cloud Function `resetAllFcmTokens` (migração inicial)

Para limpar todos os tokens existentes de uma vez (necessário na migração inicial):

```js
// functions/index.js
exports.resetAllFcmTokens = onCall(
  { cors: false },
  async (request) => {
    if (!request.auth?.token.admin) throw new HttpsError("permission-denied", "Apenas administradores.");
    const db = admin.firestore();
    const snapshot = await db.collection("participantes").get();
    const updates = snapshot.docs.map(doc =>
      doc.ref.update({
        fcmToken: admin.firestore.FieldValue.delete(),
        fcmTokenOrigin: admin.firestore.FieldValue.delete(),
      })
    );
    await Promise.all(updates);
    return { cleared: updates.length };
  }
);
```

Botão **"Resetar tokens FCM de todos os participantes"** adicionado ao painel admin (Controle de Campo), com confirmação antes de executar.

### Fluxo após o reset

1. Pesquisador clica em "Resetar tokens FCM" no painel admin
2. Todos os campos `fcmToken` e `fcmTokenOrigin` são removidos do Firestore
3. Cada participante, ao abrir o app no Vercel, tem o token regenerado automaticamente pelo refresh silencioso
4. O novo token é salvo com `fcmTokenOrigin: "https://projeto-tcc-pi.vercel.app"`
5. Tokens ficam prontos para uso pelo `sendPingNotification`

### Checklist da §18

- [x] Adicionar `fcmTokenOrigin?: string` em `GameState.tsx`
- [x] Salvar `fcmTokenOrigin: window.location.origin` em `saveTokenToFirestore`
- [x] Atualizar guard do refresh silencioso: checar origem além de presença do token
- [x] Adicionar `resetAllFcmTokens` em `functions/index.js`
- [x] Adicionar botão "Resetar tokens FCM" em `AdminDashboardPage.tsx`
- [ ] Deploy: `npm run build && vercel --prod` + `firebase deploy --only functions`
- [ ] Executar reset pelo painel admin
- [ ] Confirmar regeneração dos tokens (participantes abrem o app)
- [ ] Usar "Enviar Ping de Teste" para validar entrega
