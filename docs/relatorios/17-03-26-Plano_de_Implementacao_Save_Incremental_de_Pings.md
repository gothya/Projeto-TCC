# Plano de Implementação: Save Incremental de Respostas de Ping

**Data:** 2026-03-17  
**Contexto:** Correção do bug de perda de respostas de ping ao fechar o formulário antes de concluir todos os passos. Ver relatório de bug em `docs/relatorios/bugs/` para detalhes do diagnóstico.

---

Atualmente toda a resposta de um ping só é persistida no Firestore no **último passo** do formulário. Se o usuário fechar o modal antes disso, os dados são perdidos. A solução salva incrementalmente após cada passo, permitindo retomar de onde parou e pedindo confirmação ao tentar responder um ping já completado.

## Comportamentos Implementados

- **Save por passo:** Após cada passo do formulário, a resposta parcial é salva no Firestore com `isPartial: true`.
- **Retomada automática:** Ao reabrir o app/página com um ping ativo que foi interrompido, o formulário retoma do passo seguinte ao último concluído.
- **Confirmação de sobrescrita:** Se o usuário já completou totalmente um ping e tenta respondê-lo novamente, um modal de confirmação é exibido antes de iniciar o formulário.

---

## Arquivos a Modificar

---

### Tipos de Dados

#### [MODIFY] `src/components/data/InstrumentResponse.tsx`

Adicionar dois campos opcionais:
- `isPartial?: boolean` — `true` enquanto o formulário está em andamento, `false` ao finalizar
- `lastCompletedStep?: string` — nome do último passo concluído (ex: `"sam"`, `"feed_context"`)

---

### Serviço de Dados

#### [MODIFY] `src/service/user/UserService.ts`

Adicionar método `upsertResponse(state: GameState, newResponse: InstrumentResponse): Promise<void>`:
- Encontra no array `state.responses` uma entrada existente com mesmo `pingDay`, `pingIndex` e `isPartial: true`
- Se encontrar: substitui pelo `newResponse`
- Se não encontrar: concatena ao array
- Persiste apenas os campos `responses` e `pings` via `updateDoc`

---

### Lógica Principal

#### [MODIFY] `src/pages/DashboardPage.tsx`

**1. Estado novo:**
```ts
const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
```

**2. Helper `savePartialResponse`:**
Função interna que monta um `InstrumentResponse` parcial com `isPartial: true` e o `lastCompletedStep` atual, e chama `UserService.upsertResponse`.

**3. `handleInstrumentStep` — adicionar save incremental:**
Após atualizar `instrumentFlow.data` e antes de avançar para o próximo passo, chamar `savePartialResponse(newData, flow.step)`.

**4. `handleInstrumentFlowFinish` — marcar como não-parcial:**
Na montagem do `newState`, a nova resposta deve ter `isPartial: false`.

**5. `startInstrumentFlow` — verificação de status:**
- Se `previousStatus === "completed"` → setar `showOverwriteConfirm = true` e não iniciar o flow ainda
- Senão → iniciar normalmente

**6. `useEffect` de restauração (ao carregar o participante):**
- Após `participante` carregar, se `instrumentFlow === null` e `highlightedPing` está definido, procurar em `participante.responses` uma entrada com `pingDay === highlightedPing.day`, `pingIndex === highlightedPing.ping` e `isPartial === true`
- Se encontrar: reconstruir `instrumentFlow` definindo o próximo `step` com base em `lastCompletedStep` da resposta parcial encontrada
- Regra de mapeamento de `lastCompletedStep` → próximo step:
  - `"sam"` → `"feed_context"`
  - `"feed_context"` → `"panas_contextual"`
  - `"panas_daily"` → `"end_of_day_log"`

**7. UI de confirmação de sobrescrita:**
Inline no JSX, renderizar um modal de confirmação simples quando `showOverwriteConfirm === true`:
> "Você já respondeu este ping. Deseja substituir suas respostas?"  
> [Cancelar] [Confirmar]

Ao confirmar: chamar `startInstrumentFlow()` normalmente (o código existente já lida com a invalidação da resposta anterior).

---

## Plano de Verificação

### Manual (via App Rodando Localmente)

```powershell
npm run dev
```

**Teste 1 — Retomada de formulário parcialmente respondido:**
1. Abrir o app e aguardar um ping ativo (ou ajustar `studyStartDate` para simular)
2. Clicar no sino → formulário abre
3. Responder o **passo 1 (SAM)** e avançar
4. Sem responder o passo 2, fechar o modal (botão X ou backdrop)
5. Verificar no Firestore Console que o documento do participante tem uma entrada em `responses` com `isPartial: true` e `lastCompletedStep: "sam"`
6. Recarregar a página / fechar e reabrir o app
7. Clicar no sino → **o formulário deve abrir direto no passo 2 (FeedContext)**, não no passo 1

**Teste 2 — Confirmação de sobrescrita:**
1. Completar totalmente um ping (responder todos os 3 passos)
2. Verificar que o status no Firestore é `"completed"` e a resposta tem `isPartial: false`
3. Clicar no sino do mesmo ping novamente
4. **Um modal de confirmação deve aparecer** perguntando se deseja substituir
5. Clicar em "Cancelar" → formulário não abre
6. Clicar no sino novamente → clicar "Confirmar" → formulário inicia do passo 1
7. Verificar que ao finalizar, a resposta anterior tem `isValid: false` e a nova tem `isValid: true`

**Teste 3 — Save incremental confirmado:**
1. Abrir ping, responder passo 1, avançar para passo 2
2. Checar Firestore imediatamente → deve haver resposta parcial com `sam` preenchido
3. Responder passo 2, avançar para passo 3
4. Checar Firestore → `wasWatchingFeed` também preenchido
5. Completar passo 3 → `isPartial: false`
