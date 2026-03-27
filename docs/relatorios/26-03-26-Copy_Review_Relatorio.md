# Revisão de Copy: Teste de Stress do "Meu Relatório" (Cenário Negativo)

> **Data:** 26 de Março de 2026
> **Objetivo:** Avaliar a estruturação narrativa (copywriting) e a conexão lógica gerada pelo gerador de relatórios automáticos no pior cenário emocional possível (Baixo SAM, PANAS elevado e Alto Tempo de Tela).

---

## 1. O Teste de "Stress" Narrativo

Avaliamos o seguinte bloco textual formatado de forma automatizada pelo algoritmo do `ReportGeneratorUtils.ts`:

> *"Seus registros mostram que você atravessou dias desafiadores, com mais momentos difíceis do que agradáveis. Reconhecer isso já é um passo importante. Você relatou emoções mais serenas durante a jornada, com um ritmo voltado ao descanso e à tranquilidade. Você sentiu mais emoções desconfortáveis nestes últimos dias — como frustração ou tristeza. É normal ter semanas assim, e perceber isso já demonstra autoconhecimento. Você usou em média 270 min/dia de vídeos curtos — um pouco acima das médias globais e nacionais. Curioso(a) para entender se isso se relaciona com seu humor? É exatamente isso que o estudo investiga. Se quiser compartilhar como foi essa jornada para você, a equipe adoraria ouvir. Fale com Thiago (thiagosfcarneiro@sempreceub.com) ou com a Prof. Dionne (dionne.correa@ceub.edu.br)."*

### Parâmetros Usados pelo Algoritmo no Teste
*   **SAM Valência:** Baixa (< 4)
*   **SAM Ativação:** Baixa (< 4)
*   **PANAS:** Negativo (PA Baixo / NA Alto)
*   **Tempo de Tela:** Alto (> 229 min)

---

## 2. Análise do Texto Aglutinado

Realizei a avaliação técnica nos seguintes quesitos psicométricos e de UX Writing:

*   **Copy (Tom de Voz nos Instrumentos):** **Excelente.** A voz individual de cada "bloco" de emoção demonstra intensa empatia e acolhimento. A substituição por termos laicos funcionou perfeitamente.
*   **Compreensão:** **10/10.** Qualquer rastro de jargão acadêmico ("nível de significância", "predomínio de afeto negativo") foi expurgado.
*   **Coerência Interna (Lógica do Circumplex):** ⚠️ **Ponto de Falha Crítico.** O texto contradiz a si mesmo. O algoritmo descreveu que o usuário teve "emoções mais serenas, com um ritmo voltado ao descanso e à tranquilidade" (Ativação baixa) logo após constatar "dias desafiadores" (Valência baixa) e quase imediatamente antes de apontar "frustração ou tristeza" (PANAS negativo).
    *   *Fundamentação Psicológica:* No Modelo Circumplexo de Russell, a combinação de Valência Baixa + Ativação Baixa engendra emoções como *Esgotamento, Cansaço, Desânimo ou Tristeza*, e não "serenidade". Serenidade só existe na combinação de Ativação Baixa com Valência ALTA.
*   **Tempo de Tela (Eufemismo e Sobriedade):** ⚠️ **Ponto de Falha.** A frase *"um pouco acima das médias globais... Curioso(a) para entender..."* é inadequada. O uso de "um pouco" mascara a magnitude clínica de casos de hiperconectividade real. Além disso, tentar "vender" a pesquisa ("é isso que o estudo investiga") no meio da devolução clínica desvia o foco empático e parece frio. A devolutiva deve transparecer rigor científico, sem floreios.
*   **Fechamento e Suporte:** O *"equipe adoraria ouvir"* tem uma conotação voltada à "estamos de portas abertas para coletar seu feedback", em vez de "nós apoiamos você caso o estudo tenha causado reações fortes".
*   **Coesão (Fluidez da Leitura):** **Regular.** A estrutura carece de fluidez ("Você relatou... Você sentiu... Você usou..."). Falta a injeção de marcadores argumentativos ("Além disso...", "Notamos também...").

---

## 3. Caminhos para Otimização

O problema de coerência e de adequação de copy exige intervenções definitivas no `ReportGeneratorUtils.ts`.

### Correção 1: Cruzamento do Arousal (Opção B)
Criar uma lógica inteligente que module a avaliação da "Ativação Baixa" com base na "Valência".
```typescript
if (arousal < 4) {
  if (valence >= 5) { // Prazer alto + Arousal Baixo = Serenidade
     parts.push("Você pareceu ter um nível de energia sereno e um ritmo mais calmo na maior parte do tempo.");
  } else { // Prazer baixo + Arousal Baixo = Esgotamento/Cansaço
     parts.push("Seu nível de energia esteve mais baixo e recluso na maior parte do tempo, o que costuma indicar sensação de cansaço ou fadiga mental.");
  }
}
```

### Correção 2: Sobriedade no Tempo de Tela Extremo
Remover a frase marqueteira sobre a pesquisa e focar diretamente no comparativo quantitativo e sem juízo de valor mitigatório ("um pouco").
*   **Proposta Direta:** *"Seu tempo de uso de vídeos curtos foi de X min/dia em média. Este consumo está acima da média global (Y min/dia) e também da média nacional brasileira (Z min/dia, DataReportal 2024)."*

### Correção 3: Suporte Integral na Assinatura (Fechamento)
Trocar o caráter de "ouvir feedback" da equipe por uma disponibilidade genuína de acoelhimento para qualquer desconforto engatilhado pela pesquisa.
*   **Proposta Empática:** *"Lembre-se: se você quiser compartilhar detalhes sobre a sua jornada ou sentir necessidade de conversar sobre qualquer aspecto ou emoção que o estudo tenha despertado no seu dia a dia, a equipe de apoio está à disposição. Fale com Thiago (thiagosfcarneiro@sempreceub.com) ou com a Prof. Dionne (dionne.correa@ceub.edu.br)."*

Junto a isso, o algoritmo injetará conjunções de transição invisíveis ("Além disso", "Quanto aos seus hábitos estruturais...") para fundir os parágrafos semanticamente.
