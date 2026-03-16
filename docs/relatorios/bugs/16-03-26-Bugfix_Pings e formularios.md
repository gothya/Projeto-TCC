# Relatório de Diagnóstico: Pings e Ativação de Formulários

Este relatório detalha a análise dos problemas reportados no sistema de pings e formulários do Projeto-TCC.

## 1. Problemas Identificados

### 1.1. O Sino (Notificação) não aparece
**Sintoma:** No momento programado para o ping, o ícone do sino não fica visível para o usuário clicar.
**Análise Técnica:**
- A visibilidade do sino (`isBellVisible`) depende da função `evaluateFullJourneySchedule` em `timeUtils.ts`.
- Atualmente, o sino só aparece se o ping estiver no estado `"active"` (janela de 25 minutos) **E** seu status for `"pending"`.
- **Fator Externo Sugerido:** Existe a possibilidade de um conflito visual ou "backdrop" invisível (decorrente de problemas de renderização de outros componentes) estar cobrindo o botão ou impedindo sua ativação. Isso coincide com relatos anteriores de problemas na renderização de telas modais.

### 1.2. Realce (Glow) do Próximo Ping antecipado
**Sintoma:** O "glow" (brilho) de destaque aparece no próximo ping imediatamente após o término do ping anterior.
**Análise Técnica:**
- O sistema de realce (`highlightedPing`) busca automaticamente o primeiro ping que não seja `"missed"`.
- Assim que um ping é respondido ou vence (20 min após o horário), o código pula para o próximo ping futuro e já aplica o realce.
- **Desejo do Usuário:** O realce deve ocorrer apenas 20 minutos após o horário do ping atual (ou seja, quando a janela de resposta do atual se fecha oficialmente).

### 1.3. O Formulário não "ativa" automaticamente
**Sintoma:** Ao chegar no horário programado, o formulário não abre automaticamente.
**Análise Técnica:**
- O sistema atual é passivo: ele espera que o usuário clique no sino para abrir o `InstrumentModal`.
- No `handleTimerEnd` em `DashboardPage.tsx`, o código apenas ativa o sino e envia uma notificação push, mas não inicia o fluxo do formulário.

---

## 2. Soluções Sugeridas

### Solução para o Sino e Realce (Timing)
- **Ajuste na Lógica de Destaque:** Alterar `evaluateFullJourneySchedule` ou a lógica no `DashboardPage` para que o `highlightedPing` só mude para o próximo ping **após** o fechamento oficial da janela do ping atual (T + 20 minutos), mesmo que o usuário já tenha respondido. Isso evita o "glow" prematuro no próximo ícone.
- **Robustez na Exibição do Sino:** Garantir que o estado `isBellVisible` seja sincronizado de forma mais agressiva com o timer de contagem regressiva.

### Solução para Ativação do Formulário
- **Abertura Automática:** Implementar a chamada de `startInstrumentFlow()` diretamente dentro de `handleTimerEnd` quando o timer chegar a zero (momento exato do ping) ou assim que o estado mudar para `"active"`. Isso fará com que o modal abra sozinho para o usuário.

### Solução de Prevenção de Erros de Estado
- **Validação de Status:** Revisar se o status `"pending"` está sendo resetado corretamente ou se pings antigos estão bloqueando a detecção de novos pings ativos.
