# Plano Técnico: Push Notifications de Ping — Psylogos
**Data:** 02/04/2026  
**Status:** 📋 Planejamento

---

## 1. Contexto e Diagnóstico

### O que já existe (e está funcionando)

| Componente | Arquivo | Status |
|---|---|---|
| Service Worker FCM (background) | `public/firebase-messaging-sw.js` | ✅ Implementado |
| Foreground listener + Notification API | `src/services/NotificationService.ts` | ✅ Implementado |
| `sendPushNotification` (Cloud Function, 1 token) | `functions/index.js` | ✅ Deployado |
| `saveTokenToFirestore` (salva `fcmToken` em `users/{uid}`) | `NotificationService.ts` | ✅ Implementado |
| Broadcast multicast para todos os tokens | `api/send-broadcast.ts` | ❌ Comentado / desativado |
| Agendamento automático por horário de ping | — | ❌ Não existe |
| Pedido de permissão no Onboarding | `OnboardingPage.tsx` | ❌ Não está integrado |

### O problema central

A infraestrutura FCM existe, mas **não há nenhum mecanismo que dispare a notificação no horário certo**. Os pings ocorrem em horários fixos (`PING_HOURS = [9, 11, 13, 15, 17, 19, 21]`) durante 7 dias, o que torna o agendamento determinístico e completamente previsível.

---

## 2. Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────────┐
│                  Firebase Cloud Functions                   │
│                                                             │
│  [Scheduled Function]  ←── Horários: 9h, 11h, ... 21h BRT  │
│       ↓                                                     │
│  Lê `users` collection → filtra participantes ativos       │
│       ↓                                                     │
│  FCM sendEachForMulticast(tokens[])                        │
│       ↓                                                     │
│  Limpa tokens inválidos (messaging/registration-token-not-registered) │
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

## 3. Etapas de Implementação

### Etapa 1 — Integrar pedido de permissão no Onboarding
**Arquivo:** `src/pages/OnboardingPage.tsx`

Após `userService.createUser(gameState)` ter sucesso, executar:
```ts
const ns = await NotificationService.init();
const token = await ns.initializeNotificationsForNewUser();
if (token) await ns.saveTokenToFirestore(currentUser.uid, token);
```

> **Por quê aqui?** O navegador só mostra o dialog de permissão após uma ação do usuário. O clique em "Concluir Onboarding" é o momento ideal — o participante está engajado e motivado.

---

### Etapa 2 — Reativar e converter o broadcast para Cloud Function Agendada
**Arquivo:** `functions/index.js`

Descomentar e adaptar a lógica de `api/send-broadcast.ts` como uma **Cloud Function Scheduled** (v2 `onSchedule`):

```js
const { onSchedule } = require("firebase-functions/v2/scheduler");

exports.sendPingNotification = onSchedule(
  {
    schedule: "0 12,14,16,18,20,22,0 * * *", // UTC = BRT+3: 9h→12 UTC, 21h→00 UTC
    timeZone: "America/Sao_Paulo",            // Alternativa mais segura: usar tz diretamente
    region: "southamerica-east1",
  },
  async (event) => {
    const db = admin.firestore();
    const now = new Date();
    const brtHour = now.getHours(); // A tz já define o contexto correto

    // Só dispara nos horários de ping definidos
    const PING_HOURS = [9, 11, 13, 15, 17, 19, 21];
    if (!PING_HOURS.includes(brtHour)) return;

    // Busca apenas participantes que ainda estão na jornada ativa
    const snapshot = await db.collection("users")
      .where("hasOnboarded", "==", true)
      .get();

    const tokens = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Filtra somente participantes dentro dos 7 dias de jornada
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
          tag: "psylogos-ping", // Substitui notif anterior se ainda estiver aberta
        }
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    await cleanupInvalidTokens(db, tokens, response);
  }
);
```

**Helper `isParticipantActive`** (a adicionar no mesmo arquivo):
```js
function isParticipantActive(studyStartDateIso) {
  if (!studyStartDateIso) return false;
  const start = new Date(studyStartDateIso);
  const now = new Date();
  const diffDays = (now - start) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}
```

---

### Etapa 3 — Melhorar o Service Worker (ícone e deep-link)
**Arquivo:** `public/firebase-messaging-sw.js`

Atualizar o `onBackgroundMessage` para usar ícone correto e vibração:
```js
messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'psylogos-ping',        // Agrupa e substitui notifs antigas
    requireInteraction: true,
    vibrate: [200, 100, 200],
  });
});
```

> **Ícone:** Adicionar `icon-192x192.png` na pasta `public/`. O `vite.svg` atual é muito pequeno e não aparece bem como ícone de notificação.

---

### Etapa 4 — Atualizar token ao abrir o app (refresh)
**Arquivo:** `src/pages/DashboardPage.tsx` (ou `AuthContext`)

Tokens FCM podem expirar. Adicionar refresh silencioso ao montar o Dashboard:
```ts
useEffect(() => {
  async function refreshFcmToken() {
    if (!user) return;
    const ns = await NotificationService.init();
    if (Notification.permission === "granted") {
      const token = await ns.initializeNotificationsForNewUser();
      if (token) await ns.saveTokenToFirestore(user.uid, token);
    }
  }
  refreshFcmToken();
}, [user]);
```

---

## 4. Checklist de Implementação

- [ ] **Etapa 1** — Integrar `NotificationService` no final do `handleOnboardingComplete` em `OnboardingPage.tsx`
- [ ] **Etapa 2** — Implementar `sendPingNotification` como `onSchedule` em `functions/index.js`
  - [ ] Adicionar `isParticipantActive()` helper
  - [ ] Adicionar `cleanupInvalidTokens()` helper
  - [ ] Configurar schedule cron corretamente para BRT
- [ ] **Etapa 3** — Atualizar `firebase-messaging-sw.js` com ícone, tag e vibração
  - [ ] Criar/adicionar `icon-192x192.png` na pasta `public/`
- [ ] **Etapa 4** — Adicionar refresh silencioso de token no Dashboard
- [ ] **Deploy** — `firebase deploy --only functions` após as mudanças em functions
- [ ] **Teste manual** — Verificar se a notificação chega com app em background

---

## 5. Riscos e Considerações

### ⚠️ Permissão negada pelo usuário
Se o participante recusar a permissão no onboarding, não há token FCM.  
→ **Mitigação:** Adicionar um lembrete discreto no Dashboard ("Ative as notificações para não perder os pings") caso `Notification.permission === "denied"` não seja o caso mas o token esteja ausente.

### ⚠️ Safari / iOS (PWA)
Safari só suporta FCM push a partir do iOS 16.4+ com o app instalado como PWA.  
→ **Consequência:** Participantes que usam iPhone e não instalaram o app na tela inicial não receberão notificações. Considerar documentar isso no Termo de Uso / instruções de participação.

### ⚠️ Escalonamento do Cron
Um único `onSchedule` que roda 7x por dia é suficiente para a escala do TCC. Para produção real, seria necessário um job por participante com horário personalizado.

### 💡 Verificação de "jornada ativa" na Function
O filtro `isParticipantActive` usa `studyStartDate` do Firestore. Confirmar que este campo é salvo durante o `userService.createUser` com o mesmo nome (`studyStartDate`).

---

## 6. Verificação Final

| Cenário | Comportamento esperado |
|---|---|
| App aberto no ping das 9h | Notificação do sistema aparece via `onMessageListener` |
| App fechado no ping das 9h | Service Worker exibe notificação nativa |
| Clique na notificação | App abre (ou foca) e modal de ping se abre |
| Participante com jornada encerrada | Não recebe notificação (`isParticipantActive = false`) |
| Token expirado/inválido | Limpo automaticamente do Firestore |
