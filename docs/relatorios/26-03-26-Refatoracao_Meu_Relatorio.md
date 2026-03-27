# Relatório de Planejamento: Refatoração do "Meu Relatório" (UX Writing & PDF Export)

> **Data:** 26 de Março de 2026
> **Objetivo:** Adequação da linguagem de devolução de dados (resultados do EMA) para o público leigo e estabilização do renderizador de PDFs (`html2pdf.js`).
> **Contexto:** Os participantes do estudo Psylogos são leigos em psicologia clínica e estatística. Termos estritos do PANAS e SAM geram desconexão ou ansiedade. Além disso, artefatos visuais reportados no PDF comprometem o aspecto premium do projeto.

---

## 1. O Problema da Linguagem (UX Writing Psicológico)

O "Meu Relatório" atual é uma tradução parcialmente humanizada dos escores estatísticos, mas ainda contém trechos clínicos, comparativos punitivos e ambiguidades que podem gerar ansiedade ou estigma no participante leigo.

A literatura de intervenções em saúde mental digital sugere que relatórios direcionados a usuários finais devem focar no **reconhecimento e acolhimento da experiência**, não na entrega de notas ou comparações normativas.

### 1.1 Mapeamento Completo — Strings Atuais vs. Propostas

As strings abaixo são as **reais do código atual** em `src/utils/ReportGeneratorUtils.ts`, com a proposta de substituição para cada uma.

#### SAM — Valência

| Faixa | Texto Atual (código real) | Novo Texto Proposto |
|---|---|---|
| Alta (≥ 6) | "Ao longo da jornada, seu estado emocional predominante foi positivo, com avaliações frequentes de prazer e bem-estar." | "Na maior parte do tempo, você se sentiu bem e vivenciou emoções agradáveis. Que ótimo saber disso!" |
| Média (4–5) | "Seu estado emocional ao longo da jornada variou entre momentos agradáveis e menos agradáveis, situando-se em uma faixa neutra a moderada." | "Você teve uma jornada equilibrada — com dias melhores e dias mais difíceis. Isso é completamente normal." |
| Baixa (< 4) | "Suas avaliações emocionais indicaram predomínio de estados de baixo bem-estar durante a jornada." | "Seus registros mostram que você atravessou dias desafiadores, com mais momentos difíceis do que agradáveis. Reconhecer isso já é um passo importante." |

#### SAM — Ativação (Arousal)

| Faixa | Texto Atual (código real) | Novo Texto Proposto |
|---|---|---|
| Alta (≥ 6) | "Seu nível de ativação foi predominantemente alto, indicando um estado de alerta e engajamento frequente." | "Você esteve com bastante energia na maior parte do tempo, sentindo-se ativo(a) ou estimulado(a)." |
| Média (4–5) | "Seu nível de ativação se manteve em uma faixa intermediária, alternando entre momentos de maior e menor estimulação." | "Seu ritmo foi variado — houve dias mais agitados e dias mais tranquilos. Um equilíbrio saudável." |
| Baixa (< 4) | "Seu nível de alerta foi predominantemente baixo — um padrão associado a estados de calma ou baixa estimulação." | "Você relatou emoções mais serenas durante a jornada, com um ritmo voltado ao descanso e à tranquilidade." |

> **Nota:** o texto atual da faixa baixa usa "baixa estimulação" — expressão que um leigo pode interpretar negativamente ("sou entediante"). A proposta substitui por linguagem de descanso/serenidade, sem conotação negativa.

#### PANAS — Perfis de Afeto

| Perfil | Texto Atual (código real) | Novo Texto Proposto |
|---|---|---|
| **PA Alto / NA Baixo** | "Seu Afeto Positivo médio foi alto e o Afeto Negativo foi baixo, refletindo um padrão de bem-estar emocional consistente." | "Ao longo do estudo, você relatou muito mais emoções positivas (como entusiasmo e alegria) do que negativas (como estresse). Isso é um excelente sinal!" |
| **PA Baixo / NA Alto** | "Seu Afeto Positivo médio foi baixo e o Afeto Negativo foi elevado, refletindo um padrão de afeto que merece atenção." | "Você sentiu mais emoções desconfortáveis nestes últimos dias — como frustração ou tristeza. É normal ter semanas assim, e perceber isso já demonstra autoconhecimento." |
| **Misto** (PA Alto + NA Alto) | "Seu Afeto Positivo foi alto e o Afeto Negativo foi elevado, refletindo um equilíbrio emocional complexo, com alta presença tanto de afetos positivos quanto negativos." | "Você vivenciou uma jornada emocional intensa — com grandes momentos de alegria e energia, mas também períodos de estresse. Semanas assim costumam ser as mais marcantes." |
| **Moderado** (demais casos) | "Seu Afeto Positivo médio foi moderado e o Afeto Negativo foi moderado, refletindo um equilíbrio emocional dentro da variação esperada para o cotidiano." | "Seus afetos positivos e negativos ficaram equilibrados — sem extremos. Esse é o padrão emocional mais comum no dia a dia." |

> **Problema corrigido:** o texto atual de PA Baixo / NA Alto ("merece atenção") é ambíguo e pode gerar ansiedade — o participante pode interpretar como um sinal de que algo está errado com ele. A proposta substitui por acolhimento incondicional.

#### Chamada de Suporte à Equipe

O texto atual aparece **somente no perfil negativo** (PA Baixo / NA Alto):

> *"Caso você queira conversar sobre como se sentiu durante o estudo, entre em contato com a equipe de pesquisa pelo e-mail informado no Termo de Consentimento."*

**Problema:** aparecer só no perfil ruim cria estigma implícito — o participante infere que foi sinalizado como "precisando de ajuda". A proposta move o contato para **todos os perfis**, como convite aberto:

> *"Se quiser compartilhar como foi essa jornada para você, a equipe de pesquisa adoraria ouvir. O contato está no Termo de Consentimento."*

#### Tempo de Tela

| Faixa | Texto Atual (código real) | Novo Texto Proposto |
|---|---|---|
| Abaixo da média global | "Seu tempo médio de uso de vídeos curtos foi de X min/dia — abaixo da média global registrada (Y min/dia, DataReportal 2024)." | "Você usou em média X min/dia de vídeos curtos — menos do que a maioria das pessoas no mundo (Y min/dia, DataReportal 2024). Interessante, né?" |
| Entre global e nacional | "Seu tempo médio de uso foi de X min/dia, acima da média global (Y min/dia) e dentro da média nacional brasileira (Z min/dia, DataReportal 2024)." | "Você usou em média X min/dia — na faixa típica dos brasileiros (Z min/dia, DataReportal 2024)." |
| Acima de ambos | "Seu tempo médio de uso foi de X min/dia — acima tanto da média global (Y min/dia) quanto da média nacional brasileira (Z min/dia, DataReportal 2024)." | "Você usou em média X min/dia de vídeos curtos — um pouco acima das médias globais e nacionais. Curioso para entender se isso se relaciona com seu humor? É exatamente isso que o estudo investiga." |

> **Problema corrigido:** o texto atual da faixa alta tem tom comparativo punitivo ("acima tanto da média global quanto da nacional"). A proposta redireciona para curiosidade e conecta ao propósito do estudo, sem julgamento.

---

## 2. Correção da Exportação de PDF (Glitch Tipográfico)

### Diagnóstico do Problema Visual

O participante relatou sobreposição de letras na exportação (character overlapping/glitching). Analisando a stack (TailwindCSS + `html2pdf.js`), dois fatores combinados causam o problema:

1. **Letter-spacing utilitário:** classes como `tracking-widest` forçam espaçamento que o motor `html2canvas` não recalcula corretamente ao rasterizar pixels.
2. **Fontes não aguardadas:** o PDF era disparado antes das fontes (Inter/Roboto via Google Fonts) estarem 100% instanciadas pelo DOM.

Há **3 ocorrências** de `tracking-widest` confirmadas em `ParticipantReportModal.tsx` (linhas 43, 124, 167).

### Ações de Correção

**Fix 1 — Aguardar carregamento tipográfico:**
Adicionar `await document.fonts.ready` no início de `handleExportPdf`, antes de acionar o `html2pdf`.

```ts
const handleExportPdf = async () => {
  if (!reportRef.current) return;
  setIsExporting(true);
  await document.fonts.ready; // ← garante fontes carregadas
  // ... restante
};
```

**Fix 2 — Neutralizar letter-spacing via injeção de `<style>` temporária:**
A solução correta **não é remover as classes Tailwind permanentemente** (quebraria o visual na tela). É injetar um `<style>` temporário dentro do elemento capturado antes do render do canvas e removê-lo logo após:

```ts
const style = document.createElement("style");
style.textContent = "* { letter-spacing: normal !important; line-height: 1.5 !important; }";
reportRef.current.appendChild(style);
await html2pdf()...save();
reportRef.current.removeChild(style);
```

**Fix 3 — Line-height explícito:**
Incluir `line-height: 1.5 !important` no mesmo bloco de estilo temporário. Renderizadores web-to-pdf são sensíveis a line-heights herdados inconsistentes.

**Trade-off documentado — scale: 2 em telas HiDPI:**
A configuração `html2canvas: { scale: 2 }` dobra a resolução do canvas. Em monitores Retina/HiDPI isso pode gerar PDFs com tamanho excessivo e lentidão perceptível na exportação. Se reportado, reduzir para `scale: 1.5` como ajuste de equilíbrio.

---

## 3. Checklist de Validação

Após implementar, validar cada item abaixo antes de considerar a tarefa concluída:

- [ ] Todas as 10 strings de texto foram atualizadas em `ReportGeneratorUtils.ts`
- [ ] Texto de contato da equipe aparece em **todos** os perfis PANAS (não só no negativo)
- [ ] Nenhum texto usa os termos: "merece atenção", "baixa estimulação", "acima tanto da média global quanto"
- [ ] PDF exportado sem sobreposição de letras em Chrome desktop
- [ ] PDF exportado sem sobreposição de letras em Chrome mobile (Android)
- [ ] Quebras de página não cortam elementos no meio (verificar relatórios com 7 dias de dados completos)
- [ ] O `<style>` temporário é removido após exportação (verificar no DevTools que não persiste no DOM)
- [ ] Visual da tela (modal) permanece idêntico após a mudança (classes Tailwind intactas)

---

## 4. Próximos Passos

- [ ] **`src/utils/ReportGeneratorUtils.ts`** — substituir todas as strings conforme tabelas da Seção 1
- [ ] **`src/utils/ReportGeneratorUtils.ts`** — mover chamada de suporte para fora do bloco `if (isNegativeProfile)`
- [ ] **`src/components/modal/ParticipantReportModal.tsx`** — implementar `await document.fonts.ready` + injeção/remoção de `<style>` temporário em `handleExportPdf`
- [ ] Executar checklist de validação completa
