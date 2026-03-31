# Plano: Sistema de Pings Contínuos (Botão Sempre Ativo)

Este documento detalha o plano para alterar a mecânica de resposta aos *pings* (notificações) diários, passando de um sistema de janelas de tempo estritas para um sistema de aproximação (Botão Sempre Ativo), e a **justificativa de por que essa mudança não é recomendada**.

---

> [!CAUTION]
> ## Decisão: Mudança NÃO Recomendada — Alternativa Implementada
> Após análise metodológica aprofundada, a mudança para "Botão Sempre Ativo" **compromete a validade científica do estudo** de forma irreversível. Em vez disso, foi adotada a **alternativa metodologicamente defensável**: ampliação da janela fixa de 20 para **50 minutos** (janela total: -5min / +50min = 55 minutos).

---

## Goal Original
O botão de formulários ficaria sempre ativo. Ao invés de restringir a resposta a uma janela de -5 / +20 minutos, o momento da resposta determinaria qual ping do dia seria preenchido, escolhendo o horário programado mais próximo.

- Exemplo 1: Responder às 09:30 classifica o formulário no slot das 09h.
- Exemplo 2: Responder às 10:03 classifica o formulário no slot das 11h.

---

## Por Que Esta Mudança Não É Vantajosa

### O "M" do EMA não é opcional

O estudo utiliza **Avaliação Momentânea Ecológica (EMA — Ecological Momentary Assessment)**, um método que existe especificamente para capturar o afeto *no momento em que ele ocorre*, eliminando o viés de memória retrospectiva. A janela de 20 minutos não é uma restrição arbitrária de UX — ela é o núcleo da validade do método.

Ao flexibilizar essa janela para até ~60 minutos (tempo até o midpoint do bloco), o estudo deixa de ser uma EMA e passa a ser uma **retrospective mood diary** — um método diferente, com pressupostos diferentes, que não pode ser analisado com os mesmos critérios científicos.

### Dois vieses introduzidos simultaneamente

A mudança cria **dois vieses opostos** que não se cancelam:

| Cenário | Tipo de Viés | Exemplo |
|---|---|---|
| Responder após o horário do ping | **Recall bias** (retrospectivo) | Responder às 09:50 sobre o afeto das 09h — 50 min de memória |
| Responder antes do horário do ping | **Prospective bias** (antecipativo) | Responder às 10:03, que conta para o ping das 11h — avaliando um momento que ainda não chegou |

O segundo viés é particularmente problemático: o participante preencheria o PANAS/SAM das 11h às 10:03 da manhã, avaliando um estado emocional *futuro*. Isso não é nem recall — é projeção. Nenhum instrumento de autorrelato afetivo é validado para uso prospectivo.

### O problema real é de engajamento, não de janela

A motivação implícita da mudança é aumentar a taxa de resposta (participantes perdendo a janela de 20 minutos). Mas a janela de tempo não é a causa raiz — é o **sistema de notificação** que é insuficiente.

Aumentar a janela resolve o sintoma, não o problema. E o custo é a validade do dado.

A solução correta para o engajamento é melhorar a notificação (push notification confiável, mensagem mais chamativa, lembrete de segundo aviso), não abrir a janela indefinidamente.

### Impacto na análise estatística

Os instrumentos PANAS e SAM serão correlacionados com o **tempo de tela em vídeos curtos registrado no mesmo período**. Essa correlação pressupõe que o afeto medido é *contemporâneo* ao uso de tela avaliado.

Com a mudança, um participante que:
1. Usou o celular das 08h às 09h (alto screen time)
2. Não respondeu às 09h
3. Respondeu às 09:50 (dentro do bloco das 09h) com afeto negativo
4. Usou o celular das 09h às 10h (outro período de uso)

...teria o afeto negativo das 09:50 correlacionado com o uso das 09h–10h, mas a medição foi contaminada pelo uso de 08h–09h. A correlação principal do TCC perde precisão temporal.

### Risco de "preenchimento em lote" invalida a estrutura longitudinal

Sem bloqueio intra-bloco adequado, um participante poderia preencher todos os 7 pings do dia em sequência pela manhã. O banco receberia 7 respostas válidas, mas todas capturando o mesmo estado emocional matinal. A variação emocional ao longo do dia — que é exatamente o que o estudo investiga — desaparece completamente.

Mesmo com bloqueio intra-bloco, o participante poderia preencher 1 resposta às 09:05 (slot 09h), 1 às 10:01 (slot 11h), 1 às 12:01 (slot 13h) — completando 3 pings em menos de 3 horas no período matinal. Os dados existiriam no banco, mas não refletiriam a realidade emocional dos momentos assinalados.

---

## Alternativas Avaliadas

| Alternativa | Impacto | Complexidade | Decisão |
|---|---|---|---|
| Push notification com segundo aviso (aos +10min) | Alto | Baixa — já existe infra | 🔲 A considerar futuramente |
| **Ampliar janela fixa de 20 para 50 minutos** | **Médio** | **Baixa — 3 constantes no código** | **✅ Implementado** |
| Mensagem de lembrete mais urgente/gamificada no push | Médio | Baixa — só copy | 🔲 A considerar futuramente |
| Ping de "salvamento" — 1x por semana o usuário pode preencher 1 ping perdido | Baixo | Média | 🔲 Descartado |

## Implementação Realizada

**Arquivo alterado:** `src/utils/timeUtils.ts`

A janela foi ampliada de `-5min / +20min` para `-5min / +50min` (55 minutos totais), alterando 3 constantes no arquivo:

- Comentário JSDoc de `evaluatePingState`
- Cálculo de `windowEnd` em `evaluatePingState`
- Cálculo de `expiresAt` nos dois pontos de `evaluateFullJourneySchedule`

**Sem colisão entre slots:** os pings são espaçados de 2h em 2h. A janela de 50min termina 1h10min antes do próximo ping, sem sobreposição.

**Justificativa científica:** Shiffman, Stone & Hufford (2008) documentam janelas de até 60 minutos como metodologicamente aceitáveis em EMA, desde que o limite seja fixo e a contemporaneidade seja preservada. Uma janela de 50min se enquadra dentro desse parâmetro e pode ser citada no método do TCC.

---

## Plano Técnico Original (Arquivado)

O plano técnico abaixo é mantido para referência caso a decisão seja revisada com a orientadora.

### Algoritmo de Classificação (Midpoint Thresholds)

Os pings ocorrem às 9h, 11h, 13h, 15h, 17h, 19h e 21h. O limite seria `PingAnterior + MetadeDoIntervalo`:

| Slot | Janela | Observação |
|---|---|---|
| **09h** | [08:00, 09:59] | Limite inferior a definir |
| **11h** | [10:00, 11:59] | |
| **13h** | [12:00, 13:59] | |
| **15h** | [14:00, 15:59] | |
| **17h** | [16:00, 17:59] | |
| **19h** | [18:00, 19:59] | |
| **21h** | [20:00, 23:59] | Limite superior a definir |

**Edge cases não resolvidos antes de codar:**
- Resposta antes das 08h ou depois das 23:59
- Comportamento em 10:00:00 exato (qual slot?)
- Fuso horário / horário de verão
- Retrocompatibilidade com dados do piloto

### Mudanças de Código Necessárias

1. **`src/utils/timeUtils.ts`** — Reescrever `evaluatePingState` e `evaluateFullJourneySchedule` para usar os limiares dinâmicos. Mapear todos os consumidores antes de refatorar.
2. **`src/components/tabs/HomeTab.tsx`** — Remover `disabled` do botão de resposta; reformular timer para exibir "Tempo restante no bloco atual".

### Open Questions (não resolvidas)

1. **Bloqueio intra-bloco:** Após responder, o botão fica bloqueado até o próximo bloco ou permanece livre? (Recomendação: bloquear até o próximo bloco.)
2. **Timer:** Manter visível com "Faltam X minutos para este bloco acabar" ou suprimir?

---

## Status

**Decisão:** ✅ Implementado — janela ampliada de 20 para 50 minutos em `src/utils/timeUtils.ts`.

**Botão Sempre Ativo:** ⛔ Não implementado — rejeitado por comprometer a validade do EMA.

**Próximo passo:** Mencionar no método do TCC que a janela de resposta é de 55 minutos (-5min / +50min), citando Shiffman, Stone & Hufford (2008) como respaldo metodológico.
