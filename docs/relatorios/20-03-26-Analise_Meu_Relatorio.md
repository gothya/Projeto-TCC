# 📊 Meu Relatório — Análise Técnica, Crítica e Plano de Evolução

> **Psylogos: Enigma da Mente** · Relatório de Engenharia · Março 2026

---

## 1. Visão Geral

O **Meu Relatório** entrega ao participante uma síntese personalizada da sua jornada de 7 dias no estudo EMA. Ele agrega dados de três instrumentos psicológicos (SAM, PANAS e tempo de tela), calcula estatísticas descritivas e gera um texto interpretativo automaticamente.

A feature **não** é um diagnóstico clínico; é um espelho quantitativo da participação do usuário, com tom de devolutiva científica acessível.

---

## 2. Arquitetura e Fluxo de Dados

### 2.1 Mapa de Arquivos

| Arquivo | Papel |
|---|---|
| [`ReportGeneratorUtils.ts`](../../src/utils/ReportGeneratorUtils.ts) | Motor de cálculo e geração de texto |
| [`ReportTestScenarios.ts`](../../src/utils/ReportTestScenarios.ts) | **[NOVO]** Fábrica de GameState mock para testes |
| [`ParticipantReportModal.tsx`](../../src/components/modal/ParticipantReportModal.tsx) | View do relatório (modal + impressão + modo teste) |
| [`DashboardPage.tsx`](../../src/pages/DashboardPage.tsx) | Orquestrador: guard de acesso + abertura do modal |
| [`ConquistasTab.tsx`](../../src/components/tabs/ConquistasTab.tsx) | Ponto de entrada principal (botão desbloqueável) |

### 2.2 Diagrama de Fluxo (atualizado)

```
Firestore (GameState)
    │
    └─▶ DashboardPage (hook reativo)
            │
            ├─▶ isEligibleForReport (≥21 pings + ≥3 screen time)
            │       └─▶ ConquistasTab: botão desbloqueado
            │
            └─▶ ParticipantReportModal (gameState prop — REATIVO)
                    │
                    ├─▶ [DEV] ScenarioSelector ─▶ buildMockGameState(profile)
                    │                                      │
                    │                              substitui gameState
                    │
                    ├─▶ calculateReportStats(gameState)   ← recalcula em todo render
                    ├─▶ generateTextFeedback(stats)
                    └─▶ Renderização das seções
```

> **Sobre atualização em tempo real:** `calculateReportStats` e `generateTextFeedback` são chamados no corpo do componente (não em efeito ou memo), portanto recalculam a cada re-render. Enquanto o modal estiver aberto e o `gameState` do Firestore for atualizado (novo ping respondido), a UI reflete os novos dados automaticamente. Nenhuma mudança de arquitetura é necessária para isso.

---

## 3. Crítica da Implementação Anterior

### 3.1 🔴 Bug Crítico — Normalização PANAS

**Problema:**
```typescript
// ANTES — soma bruta sem normalizar pelo número de itens respondidos
panasTotals.pa += pa;  // PA pode ser 7 (2 itens) ou 35 (10 itens)
panasTotals.na += na;
panasTotals.count++;
// → média entre respostas com pesos completamente diferentes
```

Se o participante respondeu 2 itens numa sessão (PA=8) e 10 itens em outra (PA=40), a média resulta em 24 — mas o valor correto normalizado seria ~(20 + 40)/2 = 30.

**Correção:**
```typescript
// DEPOIS — normaliza cada resposta para a escala completa (10 itens × max 5 = 50)
const paItemCount = items respondidos em PA nesta resposta;
panasTotals.pa += (paSum / paItemCount) * POSITIVE_ITEMS.length;  // extrapola para 10 itens
```

### 3.2 🔴 Gap no Texto — Arousal Neutro

**Problema:** A faixa 4–6 no Arousal SAM não gerava nenhuma sentença. Participantes com arousal médio ficavam sem feedback sobre essa dimensão — perceptível ao ler o texto.

**Correção:** Adicionada sentença explícita para a faixa neutra.

### 3.3 🟡 Linguagem Causal no Tempo de Tela

**Problema:**
```
"um padrão de consumo intenso que pode influenciar seu bem-estar"
```
A frase "pode influenciar" implica causalidade onde há apenas correlação. Viola o princípio ético norteador do relatório (descrever padrões, não inferir causas).

**Correção:** Substituído por linguagem puramente descritiva com referência às médias.

### 3.4 🟡 Disclaimer Invisível

`text-xs text-gray-400 italic` torna o aviso de "não é diagnóstico" quase imperceptível. Em contexto de pesquisa com participantes, precisa de visibilidade adequada.

### 3.5 🟡 Sem Mensagem de Suporte para Bem-Estar Negativo

O cenário `PA baixo + NA elevado` gerava apenas "sinais de sofrimento emocional que merecem atenção" — sem encaminhamento. Participantes nesse perfil precisam de uma instrução concreta de onde buscar apoio.

### 3.6 🟢 O Que Já Funcionava Bem

- Filtro `isValid !== false` — proteção contra respostas sobrescritas
- Referências empíricas para tempo de tela (DataReportal 2024)
- Seções condicionais — modal não exibe seções vazias
- Reatividade nativa — stats recalculadas a cada render

---

## 4. Modelo Evoluído — O Que Foi Implementado

### 4.1 ReportGeneratorUtils.ts

| Item | Antes | Depois |
|---|---|---|
| Normalização PANAS | Soma bruta, pesos diferentes | Normalizado por itens respondidos × escala completa |
| Arousal neutro (4–6) | Silêncio — nenhuma sentença | Sentença descritiva explícita |
| Screen time acima da média BR | "pode influenciar o bem-estar" | Descritivo puro, sem causalidade |
| Bem-estar negativo | Sem encaminhamento | Parágrafo com instrução de contato |

### 4.2 ReportTestScenarios.ts (arquivo novo)

Fábrica de `GameState` mock com 5 perfis pré-definidos:

| Perfil | SAM (V/A/D) | PANAS (PA/NA) | Tela (min/dia) | Finalidade |
|---|---|---|---|---|
| `high` | 8.0 / 7.5 / 8.0 | 44 / 11 | 85 | Verificar tom positivo sem condescendência |
| `medium` | 5.5 / 5.0 / 5.5 | 30 / 20 | 155 | Verificar linguagem neutra e equilibrada |
| `low` | 2.5 / 3.0 / 2.0 | 16 / 34 | 285 | ⚠️ Verificar ética: sem diagnóstico, com suporte |
| `mixed` | 7.0 / 6.5 / 4.0 | 43 / 30 | 200 | Afeto misto: PA alto + NA elevado simultaneamente |
| `minimal` | 5.0 / 5.0 / 5.0 | null | null | Dados mínimos — evitar projeções |

### 4.3 ParticipantReportModal.tsx

- **Modo Teste (DEV):** barra de seleção de perfil visível apenas quando `testMode={true}` (prop opcional). Trocar o perfil substitui o `gameState` real por um mock e re-renderiza o relatório inteiro em tempo real.
- **Disclaimer:** elevado para `text-sm font-medium` com borda e ícone de atenção.
- **studyStartDate:** exibido no cabeçalho quando disponível.

---

## 5. Como Usar o Modo de Teste

### 5.1 Ativar via prop em DashboardPage.tsx

```tsx
// DashboardPage.tsx — ativar apenas em desenvolvimento
<ParticipantReportModal
  gameState={gameState}
  onClose={...}
  testMode={process.env.NODE_ENV === 'development'}
/>
```

### 5.2 Fluxo de Teste

1. Abra a aplicação em modo `dev` (`npm run dev`)
2. Navegue até a aba **Conquistas** e abra o relatório (mesmo sem 21 pings — o testMode ignora o guard de acesso)
3. No topo do modal aparecerá a barra **"[DEV] Perfil de Teste"**
4. Selecione um dos 5 perfis e observe o texto e as barras atualizarem imediatamente
5. Valide especialmente o perfil `low` — verificar se o tom está ético

### 5.3 Checklist de Validação por Perfil

**Perfil `high` — o que verificar:**
- [ ] Texto positivo sem soar condescendente ("você é perfeito")
- [ ] Arousal 7.5 → deve mencionar "alto nível de ativação"
- [ ] Screen time 85 min → deve mencionar "abaixo da média global"

**Perfil `low` — o que verificar (mais crítico):**
- [ ] Nenhuma palavra: "depressão", "ansiedade", "transtorno"
- [ ] Presença do parágrafo de suporte com contato
- [ ] Tom: descritivo e acolhedor, não alarmista

**Perfil `mixed` — o que verificar:**
- [ ] PA alto + NA elevado → deve descrever "equilíbrio emocional complexo"
- [ ] Não deve classificar como positivo nem negativo

**Perfil `minimal` — o que verificar:**
- [ ] Apenas seção SAM visível (PANAS e screen time ausentes)
- [ ] Texto deve evitar projeções sobre padrão estabelecido

---

## 6. Cenários de Teste Manuais (Borda)

### T-06 — Sobrescrita de Respostas
- Ping 3 do Dia 2: respondido, depois sobrescrito
- `isValid: false` na original → verificar que só a substituta conta

### T-08 — Plataforma "Outro" com detalhe customizado
```json
{ "platform": "Outro", "otherPlatformDetail": "Kwai", "hours": "1", "minutes": "30" }
```
→ `resolvePlatformName()` deve retornar `"Kwai"`, não `"Outro"`

### T-10 — PANAS com itens parciais (agora normalizado)
```json
{ "Amável": 4, "Animado": 3 }
```
→ Com a nova normalização: PA = (7/2) × 10 = 35 (alto), não 7 (baixo)
→ ScoreBar deve mostrar ~62% em vez de 0%

---

## 7. Próximas Melhorias (não implementadas nesta iteração)

| Prioridade | Item | Esforço |
|---|---|---|
| 🟡 Média | `studyStartDate` → calcular duração real da jornada | Baixo |
| 🟡 Média | Scroll hint visual (indicador de conteúdo abaixo) | Baixo |
| 🟠 Média | Isolamento de CSS para impressão — testar com `position: fixed` na `BottomNav` | Médio |
| 🟢 Baixa | Exportar como PDF nativo (sem `window.print`) usando biblioteca | Alto |

---

*Documento atualizado em 20/03/2026 — implementação aplicada na mesma sessão*
