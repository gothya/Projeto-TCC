# Relatório de Débito Técnico — Pós-Implementação Push Notifications
**Data:** 06/04/2026  
**Revisado:** 06/04/2026 v3 (pente-fino pós-implementação + execução dos itens 2, 3 e 4)  
**Escopo:** Limpeza pós-implementação das §15–§19 do Plano de Push Notifications  
**Status:** 🟡 Items 1–4 resolvidos — pendente apenas deploy e Item 5 opcional

---

## Contexto

Após a implementação completa das features de push notifications (§17–§19), foi realizado um pente-fino no código para identificar sobras, estados órfãos e código morto que permaneceu no repositório. **Todos os itens foram verificados diretamente no código-fonte atual** — não são inferências.

> **Nota de auditoria v1 (06/04):** Itens 3 e 4 tiveram seu status atualizado após verificação ao vivo. O `AdminDashboardScreen.tsx` **não existe mais** em `src/components/screen/` — o Item 1 foi **parcialmente resolvido** pela ausência do arquivo. O `highlightedPing` **ainda está presente** nas dependências do `useCallback` (linha 590), confirmando o Item 4.

> **Nota de auditoria v2 (06/04):** Investigação do botão "Enviar Ping de Teste" (§17) que não estava entregando notificações em produção. Descoberta de **duas causas raízes encadeadas** — Items 7 e 8 abaixo. Ambas corrigidas no código; deploy pendente.

---

## Item 1 — ~~Arquivo morto com bug crítico: `AdminDashboardScreen.tsx`~~

**Severidade:** ~~🔴 Alta~~ → ✅ **Resolvido**  
**Arquivo:** `src/components/screen/AdminDashboardScreen.tsx`

### Status verificado

Arquivo **não encontrado** em `src/components/screen/` após auditoria ao vivo (06/04/2026). O diretório contém apenas: `AdminLoginScreen.tsx`, `ConsentScreen.tsx`, `DashboardScreen.tsx`, `LandingScreen.tsx`, `OnboardingScreen.tsx`, `PWAInstallScreen.tsx`, `PostStudyLockScreen.tsx`, `ScreenTimeEntry.tsx`, `SociodemographicQuestionnaireScreen.tsx`.

**Conclusão:** O arquivo foi deletado. Nenhuma ação necessária.

> **Atenção residual:** Confirmar via `git log` que o arquivo foi removido em commit explícito (e não apenas movido). Garante que nenhum branch de feature o reintroduza acidentalmente por merge.

---

## Item 2 — ~~Botão "Disparar Pings Agora" com endpoint morto~~

**Severidade:** ~~🔴 Alta~~ → ✅ **Resolvido em 06/04/2026**  
**Arquivo:** `src/pages/AdminDashboardPage.tsx`

### O que foi removido

- `const [isSendingPing, setIsSendingPing] = useState(false)` — estado órfão
- Função `triggerPing` completa — chamava `/api/send-broadcast` (endpoint descontinuado)
- Bloco `<button onClick={triggerPing}>` — botão "Disparar Pings Agora" removido do UI
- Import `auth` — ficou sem uso após a remoção, removido junto

### Observação pós-execução

Durante a remoção foi identificado que `getFunctions` já estava chamado com a região explícita `"southamerica-east1"` — alinhado com a declaração das Cloud Functions. Nenhuma ação adicional necessária.

| Função original | Substituto atual |
|---|---|
| Disparo para todos os usuários | Cron job automático (Firebase Scheduled Function) |
| Disparo manual para um usuário | Botão "Enviar Ping de Teste" — §17 |
| Reset de tokens | Botão "Resetar tokens FCM" — §18 |

---

## Item 3 — ~~Estado órfão: `selectedResponseIndex`~~

**Severidade:** ~~🟡 Média~~ → ✅ **Resolvido em 06/04/2026**  
**Arquivo:** `src/pages/AdminDashboardPage.tsx`

### O que foi removido

- `const [selectedResponseIndex, setSelectedResponseIndex] = useState<number | null>(null)` — linha 37
- Bloco de comentários de rascunho nas linhas 265–268 que questionavam se o estado ainda era usado

O estado foi confirmado como completamente substituído por `selectedHistoryIndex` (ainda presente e em uso).

---

## Item 4 — ~~Dep. desnecessária em `handleTimerEnd`~~

**Severidade:** ~~🟢 Baixa~~ → ✅ **Resolvido em 06/04/2026**  
**Arquivo:** `src/pages/DashboardPage.tsx`

### O que foi alterado

```ts
// Antes
const handleTimerEnd = useCallback(async () => {
  console.log("[TimerEnd]", new Date().toLocaleTimeString(), { isActiveWindow, highlightedPing });
  if (!isActiveWindow) {
    setIsBellVisible(true);
  }
}, [isActiveWindow, highlightedPing]);

// Depois
const handleTimerEnd = useCallback(() => {
  if (!isActiveWindow) {
    setIsBellVisible(true);
  }
}, [isActiveWindow]);
```

- `console.log` de debug removido (sem valor em produção)
- `highlightedPing` removido das dependências — não influenciava o comportamento do callback
- `async` removido — o callback não faz mais nenhuma operação assíncrona
- O callback agora é estável enquanto `isActiveWindow` não muda, respeitando o propósito do `useCallback`

---

## Item 5 — Comentários de rascunho no código de produção

**Severidade:** 🟢 Baixa — **confirmado ativo, ação opcional**  
**Arquivo:** `src/pages/DashboardPage.tsx`

### Verificação ao vivo

```ts
// 🔥 Atualiza estado local        (linha 575)
// 🔥 Persistir no Firestore (IMPORTANTE)  (linha 578)
```

Dois comentários com emoji 🔥 descrevendo operações óbvias (update de estado local e persist no Firestore). Sem impacto em runtime. Deixados ao critério do mantenedor — podem ser removidos em uma passagem de limpeza geral.

---

## Item 6 — Correção crítica: Cron job com fuso horário duplo ✅ Já corrigido

**Severidade:** 🔴 Alta (era) → ✅ **Corrigido em 06/04/2026**  
**Arquivo:** `functions/index.js:35–40`

### O problema

O cron expression estava com compensação manual de UTC somada às 3h (`0 12,14,16,18,20,22,0 * * *`) **simultaneamente** ao uso de `timeZone: "America/Sao_Paulo"`. O Firebase interpretava os horários já no fuso definido, resultando em disparos com 3 horas de atraso em relação à janela exibida no App.

### A correção aplicada

```js
// Antes (errado):
schedule: "0 12,14,16,18,20,22,0 * * *",
timeZone: "America/Sao_Paulo",

// Depois (correto):
schedule: "0 9,11,13,15,17,19,21 * * *",
timeZone: "America/Sao_Paulo",
```

### Relatório de impacto

- **Frontend (`timeUtils.ts`):** Nenhum — calcula janelas localmente, independente do cron.
- **Lógica de pings missed:** Nenhum — baseada em timestamps passivos, não no cron.
- **Experiência do participante:** Alto positivo — notificação e janela do App agora sincronizam.

> **Pendente:** Deploy das Functions para que a correção entre em produção (`firebase deploy --only functions`).

---

## Resumo Executivo

| # | Arquivo | Tipo | Linhas | Severidade | Status | Ação |
|---|---|---|---|---|---|---|
| 1 | `AdminDashboardScreen.tsx` | Arquivo morto | inteiro | 🔴 Alta | ✅ Resolvido | Arquivo deletado — confirmar via git log |
| 2 | `AdminDashboardPage.tsx` | Botão com endpoint morto | 279, 321–365, 1127–1148 | 🔴 Alta | 🔴 Pendente | Remover `isSendingPing` + `triggerPing` + UI |
| 3 | `AdminDashboardPage.tsx` | Estado órfão `selectedResponseIndex` | 37 | 🟡 Média | 🟡 Pendente | Remover linha 37 + comentários |
| 4 | `DashboardPage.tsx` | Dep. desnecessária em `useCallback` | 590 | 🟢 Baixa | 🟡 Pendente | Remover `highlightedPing` das deps |
| 5 | `DashboardPage.tsx` | Comentários de rascunho | 575, 578 | 🟢 Baixa | 🟢 Opcional | A critério do mantenedor |
| 6 | `functions/index.js` | Cron com timezone duplo | 35–40 | 🔴 Alta | ✅ Corrigido | Deploy pendente |

### Prioridade de execução

1. **Deploy das Functions** — Item 6 corrigido no código mas não publicado. Cada hora sem deploy é mais um ciclo de ping com horário errado.
2. **Item 2** — remover botão morto (risco operacional imediato: pesquisador pode clicar durante o estudo e receber erro).
3. **Item 3** — remover estado órfão (baixo risco, alta clareza do código).
4. **Items 4 e 5** — passagem de limpeza opcional, sem urgência.

### Observação sobre deploy

Os Items 2, 3 e 4 são alterações em código frontend (`src/`). Devem ser agrupados em um único commit e buildados antes do deploy no Vercel (`npm run build && vercel --prod`). **Não há dependência entre eles** — podem ser executados em qualquer ordem.


---

## Contexto

Após a implementação completa das features de push notifications (§17–§19), foi realizado um pente-fino no código para identificar sobras, estados órfãos e código morto que permaneceu no repositório. Os itens abaixo foram confirmados no código — não são inferências.

---

## Item 1 — Arquivo morto com bug crítico: `AdminDashboardScreen.tsx`

**Severidade:** 🔴 Alta  
**Arquivo:** `src/components/screen/AdminDashboardScreen.tsx` (1133 linhas)

### Verificação de impacto

- **Referências no codebase:** 0 — nenhum arquivo importa ou usa `AdminDashboardScreen`
- **Referência nas rotas:** `src/routes/index.tsx` usa exclusivamente `AdminDashboardPage` (linha 59)
- **Conclusão:** arquivo nunca é montado em produção

### Problemas internos (mesmo sendo arquivo morto)

1. **Lê da coleção `"users"` (linha 37)** — o bug original do §2 do plano de push. A coleção correta é `"participantes"`. Se o arquivo fosse reativado acidentalmente, nenhum participante seria encontrado.
2. **`triggerPing` com `/api/send-broadcast` (linha 492)** — endpoint desativado (ver §1 do plano).
3. **`selectedResponseIndex` declarado e nunca usado (linha 30)** — igual ao `AdminDashboardPage`.
4. Não tem as features de `fcmToken`, `handleSendTestPing` nem `resetAllFcmTokens` implementadas.

### Ação recomendada

**Deletar o arquivo.** É uma versão antiga do painel admin que foi substituída por `AdminDashboardPage.tsx` mas nunca removida.

> **Risco de remoção:** zero — nenhuma rota ou componente o importa.

---

## Item 2 — Botão "Disparar Pings Agora" com endpoint morto

**Severidade:** 🔴 Alta  
**Arquivo:** `src/pages/AdminDashboardPage.tsx`  
**Linhas afetadas:** 279, 321–365, 1127–1148

### Verificação de impacto

```
AdminDashboardPage.tsx:338
    const response = await fetch('/api/send-broadcast', ...)
```

Confirmado via grep: o endpoint `/api/send-broadcast` está declarado como **"Comentado / desativado"** no §1 do plano de push. A chamada `fetch` não retorna erro imediato no build (é runtime), mas falha silenciosamente ou com erro de rede quando o botão é clicado.

- **O botão está visível no UI do painel admin (linha 1128)**
- **Clicá-lo não envia nada** — o endpoint não existe mais
- **Pode confundir o pesquisador** durante o estudo

### Código envolvido

```ts
// Linhas 279 e 321–365 — tudo relacionado ao botão morto:
const [isSendingPing, setIsSendingPing] = useState(false);

const triggerPing = async () => {
    // ...
    const response = await fetch('/api/send-broadcast', { ... }); // endpoint morto
    // ...
};
```

```tsx
// Linhas 1127–1148 — botão no UI:
<button onClick={triggerPing} disabled={isSendingPing}>
    Disparar Pings Agora (Todos os {activeUsersCount} usuários)
</button>
```

### Análise de substituição

O disparo manual para todos já é feito pela **Cloud Function agendada** (via cron) ou pela flag `sendPushEnabled: true` no Firestore. O botão "Enviar Ping de Teste" (`handleSendTestPing`) cobre o caso de envio por participante. O botão "Disparar Pings Agora" não tem substituto direto, mas também não é necessário para o TCC — o cron é a fonte de verdade.

### Ação recomendada

Remover `isSendingPing`, `setIsSendingPing`, `triggerPing` e o bloco `<button>` correspondente do UI.

> **Risco de remoção:** zero — o endpoint que ele chama não existe.

---

## Item 3 — Estado órfão: `selectedResponseIndex`

**Severidade:** 🟡 Média  
**Arquivos:** `src/pages/AdminDashboardPage.tsx:37` e `src/components/screen/AdminDashboardScreen.tsx:30`

### Verificação de impacto

```
AdminDashboardPage.tsx:37
    const [selectedResponseIndex, setSelectedResponseIndex] = useState<number | null>(null); // Unused now

AdminDashboardPage.tsx:266 (comentário)
    // We use selectedResponseIndex to store the index in *historyItems* array now?
    // Or kept it as response index?
    // Better: Store index of *historyItems*.
```

O próprio código comenta a obsolescência. O setter `setSelectedResponseIndex` **nunca é chamado** — confirmado via grep (zero ocorrências de chamada além da declaração). O estado foi substituído por `selectedHistoryIndex` (linha 269), que é o índice correto atualmente usado.

### Ação recomendada

Remover as linhas 37 e 265–268 de `AdminDashboardPage.tsx`. O `AdminDashboardScreen.tsx` será deletado integralmente (Item 1), cobrindo a ocorrência duplicada.

> **Risco de remoção:** zero — setter nunca é chamado, getter nunca é lido.

---

## Item 4 — Dep. desnecessária em `handleTimerEnd`

**Severidade:** 🟢 Baixa  
**Arquivo:** `src/pages/DashboardPage.tsx:584–590`

### Verificação de impacto

```ts
const handleTimerEnd = useCallback(async () => {
    console.log("[TimerEnd]", new Date().toLocaleTimeString(), { isActiveWindow, highlightedPing });
    if (!isActiveWindow) {
        setIsBellVisible(true);
    }
}, [isActiveWindow, highlightedPing]); // ← highlightedPing lido só no console.log
```

`highlightedPing` aparece no array de dependências e é usado apenas dentro do `console.log` de debug. Isso causa recriação do callback a cada troca de ping (a cada 5 segundos, pelo intervalo de `evaluateSchedule`), o que por sua vez invalida o `useCallback` passado como prop para `HomeTab → PingTimer → onTimerEnd`.

O impacto é pequeno em runtime (sem bug visível), mas é uma imprecisão que contraria o propósito do `useCallback`.

### Ação recomendada

Remover `highlightedPing` do array de deps. O `console.log` pode ser removido também (é log de debug sem valor em produção) ou mantido com `highlightedPing` como closure estática — aceitável para log.

---

## Item 5 — Comentários de rascunho no código de produção

**Severidade:** 🟢 Baixa  
**Arquivo:** `src/pages/DashboardPage.tsx`

### Verificação de impacto

```ts
// 🔥 Atualiza estado local        (linha 551)
// 🔥 (Recomendado) Salva no Firestore   (linha 554)
// 🔥 Atualiza estado local        (linha 576)
// 🔥 Persistir no Firestore (IMPORTANTE)  (linha 578)
```

Comentários de desenvolvimento que descrevem operações óbvias. Não afetam runtime. Deixados ao critério do mantenedor.

---

## Item 7 — `fcmToken` não mapeado no fetch do AdminDashboard

**Severidade:** 🔴 Alta — **causa raiz confirmada do botão Enviar Ping de Teste não funcionando**  
**Arquivo:** `src/pages/AdminDashboardPage.tsx:47–54`  
**Status:** ✅ Corrigido — deploy pendente

### Causa raiz

O fetch de participantes usava `doc.data() as GameState` (cast TypeScript direto). Em TypeScript, um cast `as T` **não executa mapeamento — apenas suprime erros de tipo em tempo de compilação**. Campos marcados como `optional` em `GameState.tsx` (`fcmToken?: string`, `fcmTokenOrigin?: string`) não são garantidos pelo runtime — apenas pelo compilador.

O resultado em memória era: `selectedUser.fcmToken === undefined`, mesmo que o campo existisse no documento Firestore. Com `undefined`, a guard na linha 295:

```ts
if (!selectedUser?.fcmToken) {
    setToast("Participante sem token FCM...");
    return; // saía aqui — nunca chegava no sendPushNotification
}
```

...disparava sempre. O toast de aviso aparecia, ma **nenhuma chamada à Cloud Function era feita**.

### Correção aplicada

```ts
// AdminDashboardPage.tsx — dentro do forEach do fetchUsers
const rawData = doc.data();
data.fcmToken = rawData.fcmToken ?? undefined;
data.fcmTokenOrigin = rawData.fcmTokenOrigin ?? undefined;
usersData.push(data);
```

O `doc.data()` retorna o documento Firestore sem o filtro do cast TypeScript — incluindo todos os campos presentes, inclusive campos opcionais. O mapeamento explícito garante que o `fcmToken` chegue ao estado do componente.

### Lição

Nunca confiar em `as T` para mapear dados externos (Firestore, APIs). Campos opcionais em TypeScript exigem mapeamento explícito ou uso de bibliotecas de validação (Zod, io-ts). Para o TCC, o mapeamento manual é suficiente.

---

## Item 8 — `getFunctions()` sem região: chama endpoint errado

**Severidade:** 🔴 Alta — **segunda causa raiz do botão Enviar Ping de Teste não funcionando**  
**Arquivos:** `src/pages/AdminDashboardPage.tsx:275` e `functions/index.js:135, 179`  
**Status:** ✅ Corrigido — deploy pendente

### Causa raiz

`getFunctions()` sem argumentos conecta o cliente Firebase JS SDK à região padrão `us-central1`. As Cloud Functions `sendPushNotification` e `resetAllFcmTokens` foram deployadas **sem `region` definida**, o que também as coloca em `us-central1` por padrão.

Começamos a investigar se o problema era de região ao constatar que `sendPingNotification` (onSchedule) tinha `region: "southamerica-east1"` explícito, enquanto as onCall não tinham. A ausência de `region` nas funções onCall significava:

1. Funções deployadas em `us-central1` pelo Firebase
2. Cliente chamando `us-central1` via `getFunctions()` sem região
3. **Inconsistência latente:** se qualquer deploy futuro definir região globalmente no projeto Firebase, ou se o Firebase mudar o padrão, a chamada quebraria silenciosamente

Ainda que a falha técnica não fosse a causa imediata (mesmo região no cliente e servidor — ambos em `us-central1`), a ausência de `region` explícita é um débito técnico grave por falta de rastreabilidade e risco real em redeploys.

### Correção aplicada

**Frontend (`AdminDashboardPage.tsx`):**
```ts
// Antes:
const functions = getFunctions();

// Depois:
const functions = getFunctions(undefined, "southamerica-east1");
```

**Backend (`functions/index.js`):**
```js
// Antes:
exports.sendPushNotification = onCall({ cors: true }, ...);
exports.resetAllFcmTokens = onCall({ cors: true }, ...);

// Depois:
exports.sendPushNotification = onCall({ cors: true, region: "southamerica-east1" }, ...);
exports.resetAllFcmTokens = onCall({ cors: true, region: "southamerica-east1" }, ...);
```

As três funções do projeto agora usam `southamerica-east1` de forma consistente, alinhadas com a latência do Brasil e com a função de cron existente.

> **Atenção de deploy:** Alterar a `region` de uma Cloud Function **exige que a versão anterior seja deletada manualmente** no Console Firebase antes do novo deploy, ou que o deploy use `--force`. Se o `firebase deploy --only functions` falhar com erro de conflito de região, deletar as funções afetadas pelo console e fazer redeploy.

---

## Resumo Executivo

| # | Arquivo | Tipo | Severidade | Status |
|---|---|---|---|---|
| 1 | `AdminDashboardScreen.tsx` | Arquivo morto | 🔴 Alta | ✅ Resolvido — arquivo deletado |
| 2 | `AdminDashboardPage.tsx` | Botão com endpoint morto (`/api/send-broadcast`) | 🔴 Alta | ✅ Resolvido em 06/04 |
| 3 | `AdminDashboardPage.tsx` | Estado órfão `selectedResponseIndex` | 🟡 Média | ✅ Resolvido em 06/04 |
| 4 | `DashboardPage.tsx` | Dep. desnecessária + `console.log` em `handleTimerEnd` | 🟢 Baixa | ✅ Resolvido em 06/04 |
| 5 | `DashboardPage.tsx` | Comentários de rascunho `🔥` | 🟢 Baixa | 🟢 Opcional — a critério do mantenedor |
| 6 | `functions/index.js` | Cron com timezone duplo | 🔴 Alta | ✅ Corrigido — deploy pendente |
| 7 | `AdminDashboardPage.tsx` | `fcmToken` não mapeado no fetch | 🔴 Alta | ✅ Corrigido — deploy pendente |
| 8 | `AdminDashboardPage.tsx` + `functions/index.js` | `getFunctions()` sem região | 🔴 Alta | ✅ Corrigido — deploy pendente |

### Pendências

> [!CAUTION]
> **Deploy duplo obrigatório antes de qualquer teste de push:**
>
> 1. `firebase deploy --only functions` — publica correção do cron (Item 6) e regiões das funções onCall (Item 8)
> 2. `npm run build && vercel --prod` — publica correção do `fcmToken` (Item 7), região do `getFunctions` (Item 8) e limpezas dos itens 2–4
>
> Fazer apenas um dos dois **não resolve** — as correções são interdependentes.

- **Item 5** (opcional): limpeza de comentários `🔥` no `DashboardPage.tsx` — sem impacto funcional.
