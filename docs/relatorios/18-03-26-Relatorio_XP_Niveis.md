# Relatório e Proposta de XP: Níveis Dinâmicos e Títulos

**Data:** 18 de março de 2026
**Assunto:** Mapeamento Dinâmico de Pontuação, Metas e Níveis na Jornada de 7 Dias

---

## 1. Valores Base de Experiência (XP)

A pontuação do aplicativo funciona como recompensa para as pequenas interações de engajamento do usuário.

- **Ping Comum:** `50 XP`
- **Ping Estrela (Avaliação Densa):** `100 XP`
- **Registro Diário (Tempo de Tela):** `500 XP`

---

## 2. Metas de Pontuação Máxima e Alvos Mínimos

A jornada possui 7 dias com 7 janelas diárias de pings.

### Cenário A: Máximo Realizável (100% de Retenção em 7 dias)
- **42** Pings Comuns (6/dia) × 50 XP = **2.100 XP**
- **7** Pings Estrela (1/dia) × 100 XP = **700 XP**
- **7** Registros de Tempo de Tela × 500 XP = **3.500 XP**
- **Total Teórico Máximo = 6.300 XP → ~Nível 40**

### Cenário B: Alvo Mínimo para Desbloqueio do Relatório
O relatório é liberado por condições de engajamento em pings + mínimo 3 registros de tempo de tela (não por meta de XP diretamente).
- **3** Registros de Tempo de Tela = 1.500 XP
- Pings suficientes para `isEligibleForReport()` retornar `true`

---

## 3. Estado Atual do Sistema de Níveis (Antes da Mudança)

### Problema: Cap em Nível 21
O array `LEVEL_THRESHOLDS` em uso limita o sistema ao nível 21 (3.200 XP). Participantes que ultrapassem esse valor travam na barra de XP (100% estático) ou exibem comportamento indefinido.

```
LEVEL_THRESHOLDS = [0, 160, 320, 480, ..., 3040, 3200]  // 21 entradas
```

**A lógica de progressão existente já é linear e correta** (160 XP/nível). O único problema real é o teto do array, não a fórmula em si.

### Problema: `LEVEL_THRESHOLDS` Duplicado
O array existe em dois arquivos distintos:
- `src/components/tabs/HomeTab.tsx` — usado para renderizar a barra de XP
- `src/pages/DashboardPage.tsx` — usado por `calculateLevel()`, que grava o nível no Firestore

Ambos precisam ser corrigidos. Alterar apenas um causa divergência entre o nível exibido na UI e o nível persistido no banco.

### Problema: Título muda a cada nível
A fórmula atual é:
```ts
LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]
```
Isso troca o título a cada nível conquistado. A proposta é mudar o título **a cada 2 níveis**, exigindo maior dedicação.

---

## 4. Progressão Proposta: Sem Teto e Títulos a cada 2 Níveis

### Nova Fórmula de Nível (substitui `calculateLevel` e o array em DashboardPage)
```ts
const level = Math.floor(totalXp / 160) + 1;
```

### Nova Lógica de Barra de XP (substitui lookup por índice em HomeTab)
```ts
const currentLevelStart = (level - 1) * 160;
const nextLevelTarget   = level * 160;
const xpIntoLevel       = totalXp - currentLevelStart;
const xpPct             = (xpIntoLevel / 160) * 100;  // sempre 0–100%, sem Math.min necessário
```

### Nova Fórmula de Título (substitui lookup atual em HomeTab)
```ts
const titleIndex = Math.min(Math.floor((level - 1) / 2), LEVEL_TITLES.length - 1);
const levelTitle = LEVEL_TITLES[titleIndex];
```

### Array `LEVEL_TITLES` (já presente em HomeTab — 11 títulos)
```ts
const LEVEL_TITLES = [
  "Mente Curiosa",  // Níveis 1–2
  "Explorador",     // Níveis 3–4
  "Observador",     // Níveis 5–6
  "Investigador",   // Níveis 7–8
  "Analista",       // Níveis 9–10
  "Decifrador",     // Níveis 11–12
  "Estrategista",   // Níveis 13–14
  "Visionário",     // Níveis 15–16
  "Mestre",         // Níveis 17–18  ← Alvo Mínimo (~2.700 XP) cai aqui
  "Sábio",          // Níveis 19–20
  "Lenda",          // Nível 21+     ← Máximo teórico (~Nível 40) permanece aqui
];
```

### Tabela de Evolução Estimada

| Níveis | XP Mínimo | Título |
|:---|:---|:---|
| 1–2   | 0 / 160 XP     | Mente Curiosa |
| 3–4   | 320 / 480 XP   | Explorador |
| 5–6   | 640 / 800 XP   | Observador |
| 7–8   | 960 / 1.120 XP | Investigador |
| 9–10  | 1.280 / 1.440 XP | Analista |
| 11–12 | 1.600 / 1.760 XP | Decifrador |
| 13–14 | 1.920 / 2.080 XP | Estrategista |
| 15–16 | 2.240 / 2.400 XP | Visionário |
| 17–18 | 2.560 / 2.720 XP | **Mestre** ← Alvo Mínimo |
| 19–20 | 2.880 / 3.040 XP | Sábio |
| 21+   | 3.200 XP+      | **Lenda** ← Nível máximo real ~40 |

---

## 5. Arquivos a Alterar

| Arquivo | O que muda |
|:---|:---|
| `src/pages/DashboardPage.tsx` | Remover `LEVEL_THRESHOLDS` e `calculateLevel()`, substituir por `Math.floor(xp / 160) + 1` |
| `src/components/tabs/HomeTab.tsx` | Remover `LEVEL_THRESHOLDS`, atualizar fórmulas de barra e de título |
