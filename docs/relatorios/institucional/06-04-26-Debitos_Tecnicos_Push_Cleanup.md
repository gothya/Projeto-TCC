# Relatório de Débito Técnico — Pós-Implementação Push Notifications
**Data:** 06/04/2026  
**Revisado:** 06/04/2026 (verificação ao vivo no repositório)  
**Escopo:** Limpeza pós-implementação das §15–§19 do Plano de Push Notifications  
**Status:** 🔴 Items 1 e 2 pendentes de execução — demais resolvidos ou de baixo risco

---

## Contexto

Após a implementação completa das features de push notifications (§17–§19), foi realizado um pente-fino no código para identificar sobras, estados órfãos e código morto que permaneceu no repositório. **Todos os itens foram verificados diretamente no código-fonte atual** — não são inferências.

> **Nota de auditoria (06/04):** Itens 3 e 4 tiveram seu status atualizado após verificação ao vivo. O `AdminDashboardScreen.tsx` **não existe mais** em `src/components/screen/` — o Item 1 foi **parcialmente resolvido** pela ausência do arquivo, porém o relatório original precisava refletir esse fato. O `highlightedPing` **ainda está presente** nas dependências do `useCallback` (linha 590), confirmando o Item 4.

---

## Item 1 — ~~Arquivo morto com bug crítico: `AdminDashboardScreen.tsx`~~

**Severidade:** ~~🔴 Alta~~ → ✅ **Resolvido**  
**Arquivo:** `src/components/screen/AdminDashboardScreen.tsx`

### Status verificado

Arquivo **não encontrado** em `src/components/screen/` após auditoria ao vivo (06/04/2026). O diretório contém apenas: `AdminLoginScreen.tsx`, `ConsentScreen.tsx`, `DashboardScreen.tsx`, `LandingScreen.tsx`, `OnboardingScreen.tsx`, `PWAInstallScreen.tsx`, `PostStudyLockScreen.tsx`, `ScreenTimeEntry.tsx`, `SociodemographicQuestionnaireScreen.tsx`.

**Conclusão:** O arquivo foi deletado. Nenhuma ação necessária.

> **Atenção residual:** Confirmar via `git log` que o arquivo foi removido em commit explícito (e não apenas movido). Garante que nenhum branch de feature o reintroduza acidentalmente por merge.

---

## Item 2 — Botão "Disparar Pings Agora" com endpoint morto

**Severidade:** 🔴 Alta — **pendente de execução**  
**Arquivo:** `src/pages/AdminDashboardPage.tsx`  
**Linhas afetadas (verificadas ao vivo):** 279, 321–365, 1127–1148

### Verificação ao vivo

```ts
// AdminDashboardPage.tsx:279 (declaração do estado)
const [isSendingPing, setIsSendingPing] = useState(false);

// AdminDashboardPage.tsx:338 (endpoint morto confirmado)
const response = await fetch('/api/send-broadcast', { ... });

// AdminDashboardPage.tsx:1127–1148 (botão visível no UI)
<button onClick={triggerPing} disabled={isSendingPing}>
    Disparar Pings Agora (Todos os {activeUsersCount} usuários)
</button>
```

O endpoint `/api/send-broadcast` foi descontinuado (§1 do plano de push). A chamada não falha em build (é runtime), mas retorna erro de rede ou 404 quando o botão é clicado em produção. O botão **está visível e clicável** no painel — risco de confusão operacional durante o estudo.

### Análise de substituição

| Função original | Substituto atual |
|---|---|
| Disparo para todos os usuários | Cron job automático (Firebase Scheduled Function, horários fixos) |
| Disparo manual para um usuário | Botão "Enviar Ping de Teste" (`handleSendTestPing`) — §17 |
| Reset de tokens | Botão "Resetar tokens FCM" (`handleResetAllFcmTokens`) — §18 |

O botão "Disparar Pings Agora" **não tem substituto direto** e **não é necessário para o TCC**. O cron é a fonte de verdade para disparo em massa.

### Ação recomendada

Remover do `AdminDashboardPage.tsx`:
1. `useState(false)` de `isSendingPing` (linha 279)
2. Função `triggerPing` completa (linhas 321–365)
3. Bloco `<button onClick={triggerPing}>` do UI (linhas 1127–1148)

> **Risco de remoção:** zero — o endpoint chamado não existe. A remoção elimina dead code e evita confusão do pesquisador.

> **Atenção:** O estado `isSendingPing` é **diferente** de `sendingPing` (linha 280, usado pelo `handleSendTestPing`). Remover apenas `isSendingPing` — não `sendingPing`.

---

## Item 3 — Estado órfão: `selectedResponseIndex`

**Severidade:** 🟡 Média → ⚠️ **Confirmado ativo no código**  
**Arquivo:** `src/pages/AdminDashboardPage.tsx:37`

### Verificação ao vivo

```ts
// AdminDashboardPage.tsx:37
const [selectedResponseIndex, setSelectedResponseIndex] = useState<number | null>(null); // Unused now
```

O comentário `// Unused now` do próprio autor confirma a obsolescência. Verificado via grep: `setSelectedResponseIndex` **nunca é chamado** em nenhuma linha do arquivo além da declaração. O getter também nunca é lido. O estado foi substituído por `selectedHistoryIndex` (linha 269).

O arquivo `AdminDashboardScreen.tsx` que continha a segunda ocorrência (linha 30) foi deletado (ver Item 1), eliminando a duplicata automaticamente.

### Ação recomendada

Remover linha 37 de `AdminDashboardPage.tsx`. O comentário nas linhas 265–268 (que questionava o uso) também pode ser removido na mesma passagem.

> **Risco de remoção:** zero — setter nunca é chamado, getter nunca é lido.

---

## Item 4 — Dep. desnecessária em `handleTimerEnd`

**Severidade:** 🟢 Baixa — **confirmado ativo no código**  
**Arquivo:** `src/pages/DashboardPage.tsx:584–590`

### Verificação ao vivo

```ts
// DashboardPage.tsx:584–590
const handleTimerEnd = useCallback(async () => {
    console.log("[TimerEnd]", new Date().toLocaleTimeString(), { isActiveWindow, highlightedPing });
    if (!isActiveWindow) {
        setIsBellVisible(true);
    }
}, [isActiveWindow, highlightedPing]); // ← highlightedPing: só aparece no console.log
```

`highlightedPing` é lido exclusivamente dentro do `console.log` de debug (sem efeito no comportamento do callback). Sua presença no array de dependências força a recriação de `handleTimerEnd` a cada troca de ping — que ocorre a cada avaliação do intervalo de `evaluateSchedule` (frequência alta). Isso invalida o `useCallback` para o propósito de memoização ao ser passado como prop para `CountdownTimer → onTimerEnd`.

O impacto em runtime é pequeno (sem bug visível ao usuário), mas contradiz o propósito do `useCallback` e gera re-renders desnecessários com frequência.

### Ação recomendada (duas opções)

**Opção A (recomendada):** Remover o `console.log` de debug (sem valor em produção) e remover `highlightedPing` do array de deps. Array resultante: `[isActiveWindow]`.

**Opção B:** Manter o log mas capturar `highlightedPing` como ref estática fora do callback via `useRef`, evitando a dependência dinâmica. Mais complexo, indicado apenas se o log tiver valor analítico em produção.

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

## Resumo Executivo

| # | Arquivo | Tipo | Linhas | Severidade | Ação |
|---|---|---|---|---|---|
| 1 | `AdminDashboardScreen.tsx` | Arquivo morto (1133 linhas) + bug coleção `"users"` | inteiro | 🔴 Alta | Deletar arquivo |
| 2 | `AdminDashboardPage.tsx` | Botão com endpoint morto (`/api/send-broadcast`) | 279, 321–365, 1127–1148 | 🔴 Alta | Remover função + estado + UI |
| 3 | `AdminDashboardPage.tsx` | Estado órfão `selectedResponseIndex` | 37, 265–268 | 🟡 Média | Remover declaração + comentários |
| 4 | `DashboardPage.tsx` | Dep. desnecessária em `useCallback` | 590 | 🟢 Baixa | Remover `highlightedPing` das deps |
| 5 | `DashboardPage.tsx` | Comentários de rascunho | 551, 554, 576, 578 | 🟢 Baixa | Opcional |

### Prioridade de execução

1. **Item 1** — deletar `AdminDashboardScreen.tsx` (maior risco se reativado acidentalmente)
2. **Item 2** — remover botão morto (risco de confusão operacional durante o estudo)
3. **Item 3** — remover estado órfão (limpeza de código)
4. **Items 4 e 5** — opcional, baixo impacto
