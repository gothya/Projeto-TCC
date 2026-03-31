# Fix: Botão "Próximo" invisível + retomada do formulário ao reabrir

## Contexto

Ao abrir o formulário de ping em telas pequenas (iPhone SE, Galaxy A-series etc.), o botão **Próximo** fica oculto abaixo da dobra da tela porque a pilha de cabeçalhos (`Modal` header + `InstrumentModal` header + sub-cabeçalho do `PANASComponent`) consome altura demais.

Além disso, ao fechar o modal (× ou clique fora) durante a resposta, `instrumentFlow` é zerado, e quando o usuário reabria o sino, o formulário recomeçava do passo 1 — mesmo com a lógica de resposta parcial no Firebase já existente no arquivo `DashboardPage.tsx`.

---

## Bug 1 — Botão "Próximo" oculto (responsividade)

### Diagnóstico

| Camada | Classe relevante | Problema |
|--------|-----------------|----------|
| `Modal.tsx` | `p-4` no backdrop | — |
| `InstrumentModal.tsx` | `h-[85vh]`, `p-4 sm:p-8` | Altura fixa em vh + padding excessivo |
| `PANASComponent.tsx` | `h-full flex flex-col` | O `flex-grow` da área de scroll empurra o footer para fora |
| `SAMComponent.tsx` | Igual ao acima | — |

O modal tem `h-[85vh]`, mas em celulares o viewport inclui a barra do navegador **e** a do sistema. Com padding e múltiplos cabeçalhos aninhados, o footer de navegação com o botão fica fora da área visível.

### Solução

#### [MODIFY] `src/components/modal/Modal.tsx`
- Trocar `p-4` do backdrop por `p-2 sm:p-4` (economiza 8px de cada lado em mobile via classe responsiva Tailwind).

#### [MODIFY] `src/components/modal/InstrumentModal.tsx`
- Trocar `h-[85vh]` por `h-[85svh]`.
  - **Por que `svh` e não `dvh`?** `svh` (small viewport height) tem suporte em Chrome 108+, Safari 15.4+, e em Android mais antigo que `dvh`. Usar `dvh` quebraria o layout em dispositivos Galaxy A-series com Android desatualizado. `svh` é o compromisso correto: altura conservadora que sempre funciona.
  - **Por que manter `h-` fixo e não trocar por `max-h-`?** Com `max-h`, o container não tem altura definida, então os filhos com `flex-grow` não conseguem calcular quanto espaço podem ocupar — o footer de navegação some para baixo da tela. `h-` fixo é necessário para o layout flex funcionar corretamente.
- Reduzir `p-4 sm:p-8` para `p-3 sm:p-6` no container interno.
- Adicionar `overflow-hidden` no container para que as bordas arredondadas recortem o conteúdo corretamente.

#### [MODIFY] `src/components/PANASComponent.tsx`
- O footer de navegação (`flex-shrink-0`) já existe e está correto.
- Reduzir heading interno (`text-xl → text-base sm:text-xl`) para poupar ~8px no mobile.
- Adicionar `pb-2` no footer para garantir que em dispositivos com barra home o botão não fique na beira.

#### [MODIFY] `src/components/SAMComponent.tsx`
- O círculo do SAM usa `w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72`. Reduzir **apenas o breakpoint mobile** para `w-36 h-36`, mantendo os demais: `w-36 h-36 sm:w-48 sm:h-48 md:w-60 md:h-60`.
  - A redução afeta apenas telas < 640px; em tablet/desktop o tamanho é preservado.
- Adicionar `pb-2` no footer.

---

## Bug 2 — Formulário reinicia ao fechar e reabrir no prazo

### Diagnóstico

Quando o usuário fecha o modal (`onCancel → setInstrumentFlow(null)`), o estado em memória é perdido. Ao clicar no sino novamente, `startInstrumentFlow()` cria um **novo** `InstrumentFlowState` sempre a partir do primeiro passo.

A lógica de **restauração parcial** (linhas 417–441 de `DashboardPage.tsx`) já funciona para recarregamentos de página (via Firestore), mas só quando `step === "sam"` ou similar já foi concluído e salvo. Se o usuário estiver dentro do passo PANAS (sub-passo), não há como restaurar o `currentStep` interno do componente porque esse estado é local ao React.

### Solução

**Estratégia: guardar o `instrumentFlow` em memória** em vez de anulá-lo ao fechar. O modal simplesmente fecha (oculta), mas o estado permanece vivo. Ao clicar no sino novamente, o flow existente é reaberto no ponto exato onde estava.

#### [MODIFY] `src/components/modal/Modal.tsx`
- Adicionar prop opcional `onMinimize?: () => void`.
- Quando `onMinimize` está presente: **tanto o botão ×  quanto o clique no backdrop chamam `onMinimize`**.
  - UX consistente: fechar pelo × e fechar clicando fora têm o mesmo efeito.
  - Comportamento anterior (destruir o estado) não é mais exposto ao usuário do InstrumentModal.
- Quando `onMinimize` está ausente: × e backdrop chamam `onClose` (comportamento original preservado para todos os outros modais).
- **Outros modais não são afetados**: `onMinimize` é opcional. Nenhum outro modal (RCLE, Performance, ScreenTime etc.) passa essa prop, então seu comportamento não muda.

#### [MODIFY] `src/components/modal/InstrumentModal.tsx`
- Aceitar `onMinimize?: () => void` como prop.
- Passar `onMinimize` para o `<Modal>`.

#### [MODIFY] `src/pages/DashboardPage.tsx`

1. **Novo estado**: `isInstrumentModalVisible: boolean` (separado do `instrumentFlow`).

2. **Refatoração do `evaluateSchedule`**:
   - Mover a chamada `evaluateFullJourneySchedule(...)` para o **início da função** (antes dos guards), para que o resultado esteja disponível para os checks abaixo.
   - Substituir `if (instrumentFlow) return;` por lógica em dois casos:
     - Se `instrumentFlow && isInstrumentModalVisible` → o usuário está ativamente respondendo → retornar cedo (mesmo comportamento de antes).
     - Se `instrumentFlow && !isInstrumentModalVisible` → flow em memória, modal oculto → verificar se o ping do flow ainda está na janela ativa (`currentActivePing` ou `currentTimeWindowPing`). Se não estiver, limpar `instrumentFlow` (ping expirou) e continuar a avaliação normalmente. Se ainda estiver, retornar cedo.

3. **`startInstrumentFlow`**:
   - Verificar se já existe um `instrumentFlow` ativo para o **mesmo ping**. Se sim, apenas `setIsInstrumentModalVisible(true)` (reabrir sem criar novo flow).
   - Para novos flows: ao final, chamar `setIsInstrumentModalVisible(true)` junto com `setInstrumentFlow(...)`.

4. **`onCancel` do `InstrumentModal`**: chamar `setIsInstrumentModalVisible(false)` em vez de `setInstrumentFlow(null)`.

5. **`handleInstrumentFlowFinish`**: já chama `setInstrumentFlow(null)`, o que desmonta o modal — sem alteração necessária.

6. **Render do `InstrumentModal`**: montar apenas quando `instrumentFlow && isInstrumentModalVisible`.

7. **Bell disabled**: `bellDisabled={!highlightedPing || (!!instrumentFlow && isInstrumentModalVisible)}`. O sino volta a ficar clicável quando o modal está oculto.

8. **Restauração de resposta parcial** (efeito nas linhas 417–441): adicionar `setIsInstrumentModalVisible(true)` ao restaurar um flow parcial do Firestore.

9. **Listener de notificação** (`handleOpenIntent`): remover a guard `!instrumentFlow` — deixar `startInstrumentFlow()` tratar todos os casos.

> **⚠️ Comportamento ao expirar com modal oculto**: o `evaluateSchedule` roda a cada 5 segundos. Quando detecta que o ping do flow não está mais ativo, limpa `instrumentFlow`. Como `isInstrumentModalVisible` é `false`, não há nada visível para fechar — o estado some silenciosamente. O sino desaparece normalmente via `setIsBellVisible(false)`.
>
> **⚠️ Comportamento ao expirar com modal aberto**: o guard `if (instrumentFlow && isInstrumentModalVisible) return` impede qualquer mudança de estado enquanto o usuário está respondendo. O ping **não** é marcado como missed enquanto o modal estiver aberto. Ao concluir (ou fechar sem concluir), o `evaluateSchedule` roda e trata o ping conforme o estado real.

---

## Arquivos alterados

| Arquivo | Bug | Tipo |
|---------|-----|------|
| `src/components/modal/Modal.tsx` | 1 + 2 | MODIFY |
| `src/components/modal/InstrumentModal.tsx` | 1 + 2 | MODIFY |
| `src/components/PANASComponent.tsx` | 1 | MODIFY |
| `src/components/SAMComponent.tsx` | 1 | MODIFY |
| `src/pages/DashboardPage.tsx` | 2 | MODIFY |

---

## Plano de Verificação

> Não existem testes automatizados no projeto. A verificação é manual.

### Pré-requisito
```powershell
cd c:\dev\Projeto-TCC
npm run dev
```
Acesse `http://localhost:5173` no Chrome DevTools com Device Toolbar ativada.

### Teste 1 — Botão visível em telas pequenas
1. No DevTools, selecione **iPhone SE** (375 × 667) ou um perfil com 667px de altura.
2. Faça login como um participante com ping ativo.
3. Clique no sino → o modal do formulário abre.
4. ✅ **Esperado**: o botão "Próximo" (ou "Concluir") deve estar visível sem precisar rolar.
5. Repita para **Galaxy A51/71** (412 × 914) e **iPhone 12 Pro** (390 × 844).

### Teste 2 — Retomada do formulário após fechar
1. Com ping ativo, clique no sino → modal abre no Passo 1 (SAM).
2. Responda o **SAM** (selecione um valor de 1–9 e clique "Próximo").
3. No Passo 2 (Contexto de Feed), **feche** o modal clicando no ×.
4. ✅ **Esperado**: modal fecha (dashboard visível), sino permanece ativo e clicável.
5. Clique no sino novamente.
6. ✅ **Esperado**: modal reabre diretamente no **Passo 2 (Contexto de Feed)**, não no início.
7. No PANAS (Passo 3), avance até o sub-passo 2 de 4, feche e reabra.
8. ✅ **Esperado**: modal reabre no sub-passo 2 do PANAS.
9. Repita o Teste 2 clicando no **backdrop** (área escura fora do modal) em vez do ×.
10. ✅ **Esperado**: comportamento idêntico ao fechar pelo ×.

### Teste 3 — Ping expirado limpa o estado
> **Como simular sem esperar 25 min**: no arquivo `src/utils/timeUtils.ts`, localize a constante de duração da janela (ex.: `WINDOW_MINUTES = 25`) e troque temporariamente por `1`. Salve, aguarde ~1 min com o modal fechado (minimizado), e observe.
1. Com o formulário parcialmente preenchido (modal aberto no passo 2), feche o modal clicando no ×.
2. Aguarde a janela expirar (1 min com a constante alterada para teste).
3. ✅ **Esperado**: o sino desaparece automaticamente; o `instrumentFlow` é limpo pelo `evaluateSchedule`.
4. ✅ **Esperado**: clicar no sino após a reabertura (se houver outro ping) cria um novo flow do zero.
5. Reverta a constante para `25` após o teste.

### Teste 4 — Outros modais não afetados
1. Abra o modal RCLE, o modal de Desempenho e o modal de Tempo de Tela.
2. ✅ **Esperado**: o × e o clique fora continuam fechando esses modais normalmente (sem minimizar).
