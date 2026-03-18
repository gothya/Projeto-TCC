# Plano de Implementação: Tempo de Tela (7 Dias) e XP/Níveis

**Data:** 18 de março de 2026

---

# Parte 1 — Acompanhamento de Tempo de Tela (7 Dias)

## Contexto
O participante deve registrar o tempo de tela a cada dia da jornada (até 7 dias). O desbloqueio do relatório exige mínimo de 3 registros — mas a UI deve encorajar o preenchimento de todos os 7 dias.

## Decisões Tomadas
- **3 cristais** permanecem como indicador de desbloqueio do relatório (não foram expandidos para 7).
- Um contador **`X/7`** é exibido ao lado dos cristais para mostrar o progresso total de registros.
- Os conceitos de "rastreamento de dias" e "desbloqueio do relatório" são **separados visualmente**:
  - HomeTab: card de tempo de tela mostra progresso de input (`X/7`) sem mencionar o relatório.
  - ConquistasTab: seção "Meu Relatório" usa os 3 cristais como requisito de desbloqueio, com label `X/3 · faltam Y` ou `Desbloqueado · X/7 dias`.

## Alterações Implementadas

### `src/components/tabs/HomeTab.tsx`
- Adicionado `<span>{screenTimeCount}/7</span>` ao lado dos 3 cristais dentro do card.
- Texto de status abaixo do card mantido: informa "faltam X para liberar o relatório" quando `< 3`, e "Relatório desbloqueado" quando `>= 3`.

### `src/components/tabs/ConquistasTab.tsx`
- Label do `ScreenTimeLocks` corrigido: `"Tempo de tela completo"` → `` `Desbloqueado · ${screenTimeCount}/7 dias` `` (evita texto falso antes de 7 dias completos).
- Adicionada prop `highlightedPing` para exibir glow animado (`animate-ping` + `boxShadow`) na célula do próximo ping no histórico de pings, idêntico ao comportamento da HomeTab.

### `src/components/modal/ScreenTimeModal.tsx`
- Corrigido label "Total hoje:" para refletir o dia selecionado corretamente:
  - Hoje sem log: `"Total hoje:"`
  - Hoje com log: `"Total hoje (editando):"`
  - Dia anterior com log: `"Total Dia X (editando):"`
  - Dia anterior sem log: `"Total Dia X:"`

## Lógica Sem Alterações
- `isReportAvailable` em `DashboardPage.tsx` — continua exigindo `screenTimeCount >= 3`.
- Loop `journeyDays` em `ScreenTimeModal.tsx` — já limita os dias disponíveis aos que já ocorreram na jornada real.

---

# Parte 2 — Progressão de XP e Títulos

## Contexto
O sistema atual usa `LEVEL_THRESHOLDS` (array de 21 entradas) para calcular níveis e exibir a barra de XP. O array está **duplicado** em dois arquivos e impõe um teto no nível 21 (3.200 XP). Participantes com mais XP travam a barra em 100%.

A lógica de incremento **já é linear e correta** (160 XP/nível). A mudança remove o cap e troca o título de 1-por-nível para 1-a-cada-2-níveis.

## Alterações a Implementar

### `src/pages/DashboardPage.tsx`
**Remover** `LEVEL_THRESHOLDS` (array local, linha ~344) e a função `calculateLevel()`.

**Substituir** todas as chamadas de `calculateLevel(newXp)` por:
```ts
const newLevel = Math.floor(newXp / 160) + 1;
```
Há duas ocorrências: ao finalizar um ping e ao salvar tempo de tela.

### `src/components/tabs/HomeTab.tsx`
**Remover** `LEVEL_THRESHOLDS` (array local, linha ~8).

**Substituir** os cálculos de barra de XP:
```ts
// Antes (lookup por índice):
const currentLevelStart = LEVEL_THRESHOLDS[level - 1] ?? 0;
const nextLevelTarget   = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
const xpPct = xpForLevel > 0 ? Math.min(100, (xpIntoLevel / xpForLevel) * 100) : 0;

// Depois (fórmula direta):
const currentLevelStart = (level - 1) * 160;
const nextLevelTarget   = level * 160;
const xpPct             = (xpIntoLevel / 160) * 100;
```

**Substituir** o cálculo do título:
```ts
// Antes (1 título por nível):
const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

// Depois (1 título a cada 2 níveis):
const levelTitle = LEVEL_TITLES[Math.min(Math.floor((level - 1) / 2), LEVEL_TITLES.length - 1)];
```

O array `LEVEL_TITLES` já está correto em HomeTab com os 11 títulos — **não alterar**.

## Verification Plan

| Caso | XP de entrada | Nível esperado | Título esperado | Barra esperada |
|:---|:---|:---|:---|:---|
| Início | 0 XP | 1 | Mente Curiosa | 0% |
| Boundary exato | 160 XP | 2 | Mente Curiosa | 0% |
| Meio do nível | 240 XP | 2 | Mente Curiosa | 50% |
| Troca de título | 320 XP | 3 | Explorador | 0% |
| Antigo teto | 3.200 XP | 21 | Lenda | 0% |
| Acima do antigo teto | 3.360 XP | 22 | Lenda | 0% |
| Máximo teórico | 6.300 XP | ~40 | Lenda | ~37% |

Verificar também que o nível salvo no Firestore (via `DashboardPage`) bate com o nível exibido na UI (via `HomeTab`) para o mesmo participante.
