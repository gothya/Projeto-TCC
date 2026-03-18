# Análise v2: Estrutura de Dados de Tempo de Tela vs. Exportação e Estatísticas

**Data:** 18 de Março de 2026
**Versão:** 2.0 — revisada com verificação direta do código-fonte
**Escopo:** Rastreamento completo do fluxo de dados de Tempo de Tela desde o Firestore até o Excel e o painel administrativo.

---

## 1. O Evento que Gerou o Problema

Em algum momento do desenvolvimento, o **botão "Lançar Tempo de Tela"** foi desacoplado do Ping 7 (EOD) e transformado em um fluxo independente. Essa mudança criou dois caminhos de escrita para dados de tempo de tela:

| Período | Como era coletado | Onde era salvo |
|---|---|---|
| **Antes da migração** | Dentro do `EndOfDayLogComponent`, como parte do Ping 7 | `user.responses[].screenTimeLog[]` |
| **Após a migração** | Botão avulso "Lançar Tempo de Tela" | `user.dailyScreenTimeLogs[]` |

O `EndOfDayLogComponent` atual (linha 42) emite apenas `{ sleepQuality, stressfulEvents }` — **confirma que o campo `screenTimeLog` não é mais populado em nenhum ping novo**. O caminho antigo está morto para todos os participantes registrados após a migração.

---

## 2. Mapa do Estado Atual

```
GameState (documento no Firestore)
│
├── responses[]
│   └── InstrumentResponse
│       ├── sam, panas, wasWatchingFeed, sleepQuality, stressfulEvents
│       └── screenTimeLog[]   ← MORTO para dados novos (EndOfDayLogComponent não popula mais)
│                              ← VIVO apenas para participantes pré-migração
│
└── dailyScreenTimeLogs[]     ← ÚNICO caminho ativo para dados novos
    └── DailyScreenTimeLog { date: 'YYYY-MM-DD', entries[] }
        └── ScreenTimeEntry { platform, hours, minutes, duration }
```

---

## 3. Inventário de Impacto por Componente

### 3.1 — `excelExporter.ts` › `buildScreenTimeSheet` (linhas 120–176) 🔴 CRÍTICO

**O que faz:** coleta plataformas e monta linhas lendo exclusivamente `r.screenTimeLog`.

```typescript
// linha 130 — passagem 1: descoberta de plataformas
if (r.screenTimeLog) { r.screenTimeLog.forEach(entry => allPlatforms.add(...)); }

// linha 145 — passagem 2: montagem de linhas
if (!r.screenTimeLog || r.screenTimeLog.length === 0) return; // ← só chega aqui dados pré-migração
```

**Consequência real:** a aba "Tempo de Tela" do Excel estará **completamente vazia** para todos os participantes registrados após a migração. Não é dado faltando — é dado ausente.

---

### 3.2 — `adminStats.ts` › `calculateGlobalAverageStats` (linhas 123–134) 🔴 CRÍTICO

**O que faz:** soma tempo de tela global para o painel do admin.

```typescript
// linha 123
if (r.screenTimeLog) { // ← nunca true para dados novos
  r.screenTimeLog.forEach((entry) => {
    screenTimeStats.totalMinutes += parseDurationMinutes(entry);
    // ...
  });
}
```

**Consequência real:** `avgScreenTimeFormatted` exibe `"0h 0m"` para qualquer participante pós-migração. O painel do admin apresenta média de tempo de tela como zero.

---

### 3.3 — `adminStats.ts` › `calculateParticipantSummary` (linhas 261–287) 🔴 CRÍTICO

**O que faz:** resume dados individuais de um participante para o painel do admin.

```typescript
// linha 261
if (r.screenTimeLog) { // ← morto para dados novos
  r.screenTimeLog.forEach((entry) => { totalScreenTimeMinutes += ...; });
}

// linha 285
if (r.screenTimeLog && r.screenTimeLog.length > 0) screenTimeDays++; // ← sempre false
```

**Consequência real:** `screenTime.totalFormatted` e `screenTime.averageMinutes` mostram zero. A divisão `totalMinutes / screenTimeDays` nunca ocorre. O pesquisador vê sumário de tempo de tela zerado para qualquer participante ativo.

---

### 3.4 — `excelExporter.ts` › `buildCovariablesSheet` (linhas 200–227) ✅ CORRETO

A versão 1 do relatório marcou isso como Falha B duvidosa. Verificação confirma: `sleepQuality` e `stressfulEvents` **ainda são populados** pelo `EndOfDayLogComponent` (linha 42) e salvos no `InstrumentResponse` do Ping 7. O exportador os lê corretamente de `user.responses`. **Não há bug aqui.**

---

## 4. O Problema dos Dados Legados

Participantes que responderam o Ping 7 **antes da migração** têm dados reais em `r.screenTimeLog`. Esses dados não devem ser perdidos. A estratégia de solução deve cobrir os dois grupos:

| Grupo | Onde estão os dados | Como tratar |
|---|---|---|
| **Pré-migração** | `responses[].screenTimeLog[]` | Ler e incluir na exportação/stats |
| **Pós-migração** | `dailyScreenTimeLogs[]` | Nova fonte principal |
| **Transição** | Potencialmente nos dois | Somar sem duplicar |

A boa notícia: ambas as structs usam `ScreenTimeEntry` como tipo-base. Os utilitários `parseDurationMinutes` e `resolvePlatformName` em `screenTimeUtils.ts` funcionam para as duas — **nenhum helper precisa ser alterado**.

---

## 5. Plano de Correção

### Correção A — Excel: nova aba "Tempo de Tela (Diário)" + preservação da aba legada

**Arquivo:** `excelExporter.ts`

Adicionar a função `buildDailyScreenTimeSheet` que lê de `dailyScreenTimeLogs`:

```typescript
function buildDailyScreenTimeSheet(allUsers: GameState[]): Record<string, unknown>[] {
  // 1ª passagem: coletar plataformas distintas
  const allPlatforms = new Set<string>();
  allUsers.forEach((user) => {
    (user.dailyScreenTimeLogs ?? []).forEach((log) => {
      log.entries.forEach((entry) => allPlatforms.add(resolvePlatformName(entry)));
    });
  });
  const platformList = Array.from(allPlatforms).sort();

  // 2ª passagem: montar linhas
  const rows: Record<string, unknown>[] = [];
  allUsers.forEach((user) => {
    const nickname = user.user?.nickname || "Desconhecido";
    (user.dailyScreenTimeLogs ?? []).forEach((log) => {
      const row: Record<string, unknown> = {
        Nickname: nickname,
        Data: new Date(log.date + "T12:00:00").toLocaleDateString("pt-BR"),
        "Total (min)": 0,
      };
      platformList.forEach((p) => { row[`${p} (min)`] = 0; });

      let total = 0;
      log.entries.forEach((entry) => {
        const plat = resolvePlatformName(entry);
        const dur = parseDurationMinutes(entry);
        row[`${plat} (min)`] = ((row[`${plat} (min)`] as number) || 0) + dur;
        total += dur;
      });
      row["Total (min)"] = total;
      rows.push(row);
    });
  });
  return rows;
}
```

Em `buildWorkbook`, adicionar a nova aba após "Tempo de Tela":

```typescript
// Manter aba legada (dados pré-migração)
addSheetToWorkbook(wb, sheets.screenTime as ..., "Tempo de Tela (EOD)");
// Nova aba para dados pós-migração
addSheetToWorkbook(wb, buildDailyScreenTimeSheet(allUsers), "Tempo de Tela (Diário)");
```

**Resultado:** o pesquisador recebe duas abas. Pode cruzá-las por `Nickname + Data` quando necessário.

---

### Correção B — `adminStats.ts` › `calculateGlobalAverageStats` (linha 123)

Após o bloco `if (r.screenTimeLog)` existente, adicionar leitura de `dailyScreenTimeLogs`:

```typescript
// Após o bloco existente de r.screenTimeLog (linha 134):
(user.dailyScreenTimeLogs ?? []).forEach((log) => {
  log.entries.forEach((entry) => {
    const dur = parseDurationMinutes(entry);
    screenTimeStats.totalMinutes += dur;
    const plat = resolvePlatformName(entry) || "Outros";
    screenTimeStats.platformBreakdown[plat] =
      (screenTimeStats.platformBreakdown[plat] || 0) + dur;
  });
  if (log.entries.length > 0) screenTimeStats.count++;
});
```

---

### Correção C — `adminStats.ts` › `calculateParticipantSummary` (linha 261)

Após o bloco `if (r.screenTimeLog)` existente (linha 261–268), adicionar:

```typescript
// Após o bloco existente (linha 268):
(user.dailyScreenTimeLogs ?? []).forEach((log) => {
  log.entries.forEach((entry) => {
    const dur = parseDurationMinutes(entry);
    totalScreenTimeMinutes += dur;
    const plat = resolvePlatformName(entry) || "Outros";
    platformBreakdown[plat] = (platformBreakdown[plat] || 0) + dur;
  });
});

// Recalcular screenTimeDays após os dois blocos (substituir linhas 284–287):
const screenTimeDays =
  validResponses.filter((r) => r.screenTimeLog && r.screenTimeLog.length > 0).length +
  (user.dailyScreenTimeLogs ?? []).filter((l) => l.entries.length > 0).length;
```

---

## 6. Sobre os Dados Legados no Firestore

**Não migrar.** Os dados em `r.screenTimeLog` são históricos e estão corretamente associados ao contexto do Ping 7 (dia e horário exatos). Tentar movê-los para `dailyScreenTimeLogs` perderia esse contexto e introduziria risco de corrupção.

A abordagem correta é **ler de ambas as fontes nos leitores** (exportador e adminStats), como descrito nas Correções B e C. Nenhum script de migração no Firestore é necessário.

---

## 7. Resumo Executivo

| Componente | Status | Correção |
|---|---|---|
| `excelExporter` › aba "Tempo de Tela" | 🔴 Vazia para dados novos | Adicionar aba "Tempo de Tela (Diário)" |
| `adminStats` › `calculateGlobalAverageStats` | 🔴 Mostra 0 para dados novos | Correção B — ler `dailyScreenTimeLogs` |
| `adminStats` › `calculateParticipantSummary` | 🔴 Mostra 0 para dados novos | Correção C — ler `dailyScreenTimeLogs` |
| `excelExporter` › aba "Co-variáveis" | ✅ Correto | Nenhuma ação |
| Dados legados (`r.screenTimeLog`) | ✅ Preservados | Não migrar — ler nos dois leitores |

**Prioridade:** as três correções são independentes entre si e podem ser implementadas em qualquer ordem. A Correção A (Excel) tem maior impacto direto na pesquisa; B e C afetam o painel administrativo.
