# Feature: Relatório de Desempenho do Participante ("Meu Relatório")

**Commit de implementação:** `7a10c45`
**Data:** 15 de março de 2026
**Base (commit anterior):** `1b0a944` — feat: implement continuous 7-day user journey and fix onboarding bypass

---

## 1. Visão Geral

A feature "Meu Relatório" entrega ao participante um resumo visual e textual do seu desempenho ao longo da jornada EMA de 7 dias, incluindo engajamento (pings respondidos/perdidos), bem-estar emocional (SAM e PANAS), e consumo de vídeos curtos (tempo de tela). O relatório pode ser baixado como PDF diretamente pelo browser, sem necessidade de servidor.

---

## 2. Critério de Elegibilidade

O botão "Meu Relatório" só aparece no `ProfileMenu` quando o participante atingiu pelo menos **50% de taxa de resposta sobre os pings já emitidos** (não sobre o total de 49):

```
elegível = (pings completados / pings emitidos) >= 0.5
```

Pings com status `"pending"` são excluídos do denominador — apenas `"completed"` e `"missed"` contam como emitidos.

---

## 3. Arquivos Criados / Modificados

### 3.1 Arquivos Criados

| Arquivo | Descrição |
|---|---|
| `src/utils/ReportGeneratorUtils.ts` | Utilitários puros de agregação de dados e elegibilidade |
| `src/components/modal/ParticipantReportModal.tsx` | Modal completo do relatório com UI e download em PDF |
| `src/types/html2pdf.d.ts` | Declarações TypeScript para a biblioteca `html2pdf.js` |
| `docs/relatorios/feature-meu-relatorio.md` | Este relatório |

### 3.2 Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/components/menu/ProfileMenu.tsx` | Adicionados props `isReportAvailable` e `onDownloadReport`; botão "Meu Relatório" condicional |
| `src/pages/DashboardPage.tsx` | Integração completa: imports, estado, elegibilidade, render do modal, props passados ao ProfileMenu |
| `src/service/user/UserService.ts` | `updateUser` agora persiste `studyStartDate` no Firestore |

---

## 4. Estrutura do Documento Gerado (PDF)

O relatório é renderizado em HTML branco (fundo `#ffffff`) com o id `psylogos-report` e convertido para PDF via `html2pdf.js`. Suas seções são:

### 4.1 Cabeçalho
- Título "Psylogos" + subtítulo "O Enigma do Coração"
- Nickname, nível e XP do participante
- Data de geração

### 4.2 Desempenho na Jornada
- Cards: pings respondidos, perdidos, taxa de resposta (%)
- Barra de progresso geral: completados / emitidos

### 4.3 Bem-Estar Emocional — SAM
- Três dimensões em barras horizontais (escala 1–9):
  - **Valência (Prazer):** cor cyan (≥5) ou laranja (<5)
  - **Alerta (Arousal):** cor azul
  - **Dominância (Controle):** cor roxa (≥5) ou cinza (<5)
- Legenda de extremos por dimensão
- Contador de avaliações usadas

### 4.4 Afeto — PANAS
- Duas barras horizontais (escala 10–50):
  - **Afeto Positivo (PA):** verde
  - **Afeto Negativo (NA):** vermelho
- Legenda de extremos (10 = baixo, 50 = alto)
- Contador de avaliações usadas

### 4.5 Consumo de Vídeos Curtos (Tempo de Tela)
- Barra termômetro comparativa (escala 0–300 min/dia)
- Barra do usuário com cor dinâmica:
  - Verde: ≤ 143 min/dia (abaixo da média global)
  - Amarelo: entre 143 e 229 min/dia (acima do global, dentro do BR)
  - Vermelho: > 229 min/dia (acima da média nacional)
- Linhas de referência verticais: azul (143 min — Global) e roxa (229 min — Brasil)
- Grid de breakdown por plataforma (min/dia estimado por plataforma)

### 4.6 Avaliação do Psylogos (Texto Dinâmico)
- Parágrafo gerado programaticamente por `generateTextFeedback(stats)` com base nas métricas calculadas
- Cobre SAM (valência e arousal), PANAS (PA/NA) e tempo de tela
- Aviso de que o relatório não constitui diagnóstico clínico

### 4.7 Rodapé
- Nome do estudo e data de geração

---

## 5. Lógica de Agregação (`ReportGeneratorUtils.ts`)

```
calculateReportStats(gameState):
  ├── Itera gameState.responses[]
  │   ├── SAM: acumula pleasure, arousal, dominance → média ao final
  │   ├── PANAS: soma itens positivos (10 items) e negativos (10 items) → média ao final
  │   └── screenTimeLog: soma duração por dia e por plataforma
  └── Retorna ReportStats { pingStats, sam|null, panas|null, screenTime|null }
```

Campos SAM lidos: `r.sam.pleasure`, `r.sam.arousal`, `r.sam.dominance`
Itens PANAS positivos: Amável, Animado, Apaixonado, Determinado, Dinâmico, Entusiasmado, Forte, Inspirado, Orgulhoso, Vigoroso
Itens PANAS negativos: Aflito, Amedrontado, Angustiado, Humilhado, Incomodado, Inquieto, Irritado, Nervoso, Perturbado, Rancoroso

Seções exibem mensagem alternativa ("Nenhuma avaliação registrada ainda") quando o dado é `null`.

---

## 6. Geração de PDF (`html2pdf.js`)

Dependência instalada via npm: `html2pdf.js` (wrapper de `html2canvas` + `jsPDF`).

Configuração usada:

```
margin:      [10, 10, 10, 10] mm
format:      A4 portrait
image:       JPEG quality 0.98
html2canvas: scale 2 (alta resolução), useCORS true, fundo branco
```

Nome do arquivo gerado: `psylogos-relatorio-{nickname}.pdf`

Durante a geração o botão muda para "Gerando PDF..." com spinner e fica desabilitado para evitar cliques duplos.

---

## 7. Referências de Escala

| Métrica | Escala | Referência bibliográfica |
|---|---|---|
| SAM Valência / Alerta / Dominância | 1–9 | Bradley & Lang (1994) |
| PANAS Afeto Positivo / Negativo | 10–50 (10 itens × 1–5) | Watson, Clark & Tellegen (1988) |
| Tempo de tela — média global | 143 min/dia | DataReportal 2024 |
| Tempo de tela — média nacional (BR) | 229 min/dia | DataReportal 2024 |

---

## 8. Observações Técnicas

- **Tailwind CDN:** valores arbitrários como `max-h-[90vh]` não são suportados; substituído por `style={{ maxHeight: "90vh" }}`.
- **`useCallback` em `useParticipante`:** a função `updateParticipante` é estabilizada com `useCallback(fn, [])` para evitar loop infinito de render no `useEffect` do `DashboardPage` que depende dela.
- O modal renderiza dentro do `DashboardPage` (não usa Portal), mas usa `position: fixed` com `z-50` para sobrepor o conteúdo corretamente.
