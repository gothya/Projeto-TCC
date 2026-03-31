# Plano de Alteração: Feedback Visual do Botão de Ping

## Objetivo
Mudar dinamicamente a aparência e o texto do botão de resposta ao ping para "Dados coletados!" após o participante ter enviado suas respostas. A funcionalidade de sobrescrita (re-resposta) já existe e continuará funcionando, mas a apresentação visual deixará claro que os dados do momento ativo já foram salvos.

## Arquivos Afetados

### 1. `src/components/navigation/BottomNav.tsx`
- **Modificações**:
  - Adicionar o prop `isPingCompleted?: boolean`.
  - Mudar a composição visual do botão `isBellVisible` com base no `isPingCompleted`:
    - **Pendente**: `bg-cyan-400` com texto "Responder Ping".
    - **Concluído**: `bg-green-500` (ou verde condizente com o tema "completed" dos componentes de jornada) com texto "Dados coletados!" e, idealmente, parando a animação `animate-ping` e/ou adicionando um ícone estático de *check*.

### 2. `src/pages/DashboardPage.tsx`
- **Modificações**:
  - Obter o estado global do ping atual que está em `highlightedPing`.
  - Checar: `const isPingCompleted = highlightedPing ? participante?.pings[highlightedPing.day]?.statuses[highlightedPing.ping] === "completed" : false;`
  - Passar esse status para o `BottomNav` na prop `isPingCompleted`.

## Passo a Passo da Implementação
1. Modificar a interface do `BottomNav` exportando a prop nova.
2. Criar condicional de renderização do botão no `BottomNav`, mudando as classes CSS (`bg-green-400 text-slate-900 font-bold shadow-lg` etc.) em caso positivo.
3. Obter e passar essa informação calculada no render principal do `DashboardPage.tsx`.
