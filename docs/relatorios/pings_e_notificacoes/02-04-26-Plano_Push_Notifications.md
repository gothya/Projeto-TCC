# Plano Técnico: Push Notifications de Ping — Psylogos
**Data:** 02/04/2026 — Revisado: 05/04/2026 (v5)  
**Status:** 📋 Em implementação

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
- [ ] **Bug §10** — Capturar `beforeinstallprompt` no nível de módulo em `pwaUtils.ts` (`getDeferredInstallPrompt` / `clearDeferredInstallPrompt`)
- [ ] **Bug §10** — Remover `useEffect` de captura dentro de `PWAInstallScreen` e usar `getDeferredInstallPrompt()` no clique
- [ ] **Bug §10** — Tratar rejeição do prompt (permanecer na tela) e ausência de prompt (exibir `skip-hint`)
- [ ] **Etapa 7** — Banner de fallback no Dashboard
- [ ] **Teste** — Criar novo usuário e validar fluxo em iOS e Android; verificar `fcmToken` em `participantes` no Firestore

### Fase 2 — Testar antes de aplicar
- [x] **Etapa 6** — Integrar `NotificationService` no Onboarding (já implementado em `handlePwaInstallContinue`)
- [ ] **Etapa 6 (revisada §13)** — Refresh silencioso no Dashboard: só se `!participante.fcmToken`; pede permissão também se `permission === "default"`
- [ ] **Etapa 4 (revisada §13)** — Implementar `sendPingNotification` sem check de `PING_HOURS` interno (cron é a fonte de verdade); com feature flag `sendPushEnabled: false`
  - [ ] Criar doc `config/featureFlags` no Firestore com `{ sendPushEnabled: false }`
  - [ ] Adicionar `cleanupInvalidTokens()` helper (documentar limite de 30 tokens do `in`)
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
