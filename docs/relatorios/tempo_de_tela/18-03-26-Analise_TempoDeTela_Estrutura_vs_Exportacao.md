# Análise: Estrutura de Dados de Tempo de Tela vs. Exportação Excel

**Data:** 18 de Março de 2026  
**Autor:** Antigravity (Análise Técnica Automatizada)  
**Escopo:** Rastreamento do fluxo de dados de Tempo de Tela desde o Firestore até a planilha exportada pelo painel do pesquisador.

---

## 1. O Problema Central: Dois Silos Desconectados

O app possui **duas estruturas paralelas** para armazenar tempo de tela. O exportador Excel **só conhece uma delas**, tornando os dados do novo botão avulso invisíveis para análise.

| Onde fica salvo | Campo no Firestore | Quem popula | Exportado para Excel? |
|---|---|---|---|
| Dentro de cada `InstrumentResponse` | `r.screenTimeLog[]` | Ping 7 (EOD) — sistema antigo | ✅ Sim — aba "Tempo de Tela" |
| Diretamente no documento do usuário | `user.dailyScreenTimeLogs[]` | Botão "Lançar Tempo de Tela" — sistema novo | ❌ **NÃO** |

---

## 2. Diagrama da Estrutura de Dados

```
GameState (documento no Firestore)
├── responses[]
│   └── [cada InstrumentResponse]
│       ├── pingDay, pingIndex, timestamp, sam, panas...
│       └── screenTimeLog[]   ← LIDO pelo exportador ✅
│           └── ScreenTimeEntry { platform, hours, minutes, duration }
│
└── dailyScreenTimeLogs[]     ← IGNORADO pelo exportador ❌
    └── DailyScreenTimeLog { date: 'YYYY-MM-DD' }
        └── entries[]
            └── ScreenTimeEntry { platform, hours, minutes, duration }
```

---

## 3. Como o Exportador Funciona Hoje

A função `buildScreenTimeSheet` em `excelExporter.ts` (linhas 120–176) opera em **duas passagens**:

### Passagem 1 — Descoberta de Plataformas
Varre `user.responses` buscando todas as plataformas distintas para montar as colunas da planilha dinamicamente:
```typescript
allUsers.forEach((user) => {
  (user.responses || [])
    .filter((r) => r.isValid !== false)
    .forEach((r) => {
      if (r.screenTimeLog) {
        r.screenTimeLog.forEach((entry) => {
          allPlatforms.add(resolvePlatformName(entry)); // Cria colunas dinâmicas
        });
      }
    });
});
```

### Passagem 2 — Montagem de Linhas
Varre `allResponses` (que já foi achatado a partir de `user.responses`) e cria uma linha por resposta de ping que tenha `screenTimeLog`:
```typescript
allResponses.forEach((entry) => {
  const r = entry.response;
  if (!r.screenTimeLog || r.screenTimeLog.length === 0) return; // ← só lê de dentro do ping
  // ...monta linha com pingDay, pingIndex, Horário...
});
```

**Resultado:** `dailyScreenTimeLogs` nunca é tocado em nenhuma das passagens.

---

## 4. Estrutura da Aba "Tempo de Tela" no Excel Gerado

| Nickname | Timestamp | Dia do Estudo | Ping (Slot) | Horário | Total (min) | Instagram (min) | TikTok (min) | ... |
|---|---|---|---|---|---|---|---|---|
| Thiago | 17/03 21:05 | 7 | 7 | 21h | 120 | 75 | 45 | ... |

A estrutura está ligada ao contexto de ping (dia + slot + horário). Registros avulsos do `dailyScreenTimeLogs` possuem apenas `date` (ex: `"2026-03-18"`) — não têm `pingDay`/`pingIndex`, portanto não se encaixam nessa estrutura sem adaptação.

---

## 5. Utilitários de Conversão (Compartilhados e Corretos)

Ambas as structs usam `ScreenTimeEntry` como tipo-base, então os utilitários em `screenTimeUtils.ts` funcionam para as duas:

- **`parseDurationMinutes(entry)`** — converte `hours`/`minutes` para minutos totais. Cai para o campo legado `duration` se necessário.
- **`resolvePlatformName(entry)`** — trata o caso "Outro" retornando `otherPlatformDetail`.

Esses helpers **não precisam ser alterados**.

---

## 6. Falhas Identificadas

### Falha A — Dados do botão avulso não chegam ao Excel 🔴
Todo registro feito pelo novo botão "Lançar Tempo de Tela" (salvo em `dailyScreenTimeLogs`) **não aparece na exportação**. Para o pesquisador, esses dados simplesmente não existem.

### Falha B — Aba "Co-variáveis" também está incompleta 🟡
A aba de co-variáveis (Qualidade do Sono, Eventos Estressantes) lê apenas de `InstrumentResponse`. Os dados de sono/estresse do ping de fim de dia podem estar ok, mas qualquer desacoplamento futuro similar causaria o mesmo problema.

### Falha C — `adminStats.ts` também ignora `dailyScreenTimeLogs` 🟡
O painel de estatísticas do admin (`adminStats.ts`) calcula médias de tempo de tela lendo apenas `r.screenTimeLog` dentro dos pings. As estatísticas exibidas no painel administrativo estão **subestimadas**.

---

## 7. Solução Proposta

### Opção A — Aba Separada para Registros Avulsos (Recomendado)
Adicionar uma nova aba ao Excel: **"Tempo de Tela (Diário)"**, que lê exclusivamente de `dailyScreenTimeLogs`. Mantém estrutura diferente das linhas de ping (sem `Ping (Slot)`, mas com `Data`).

| Nickname | Data | Total (min) | Instagram (min) | TikTok (min) | ... |
|---|---|---|---|---|---|
| Thiago | 18/03/2026 | 90 | 60 | 30 | ... |

**Impacto:** Adicionar `buildDailyScreenTimeSheet()` em `excelExporter.ts` e registrar a nova aba no `buildWorkbook()`.

### Opção B — Unificar na mesma aba com coluna "Origem"
Adicionar uma coluna `Origem` (`"Ping EOD"` vs. `"Avulso"`) e uma coluna `Data` para os registros avulsos. As linhas de ping já têm `Horário`; as avulsas precisariam dessa coluna vazia ou preenchida com a data.

**Impacto:** Refatorar `buildScreenTimeSheet` para aceitar as duas fontes — mais complexo e pode confundir a análise estatística.

---

## 8. Recomendação Final

Implementar a **Opção A** (aba separada). É a abordagem mais limpa para análise, pois:
- Dados de ping têm contexto de hora específica; dados avulsos têm apenas data.
- O pesquisador pode cruzar as abas via `Nickname + Data` no Excel.
- Nenhum dado existente quebra.

A mesma correção deve ser aplicada em `adminStats.ts` para que as estatísticas do painel reflitam a realidade.
