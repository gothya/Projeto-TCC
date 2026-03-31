# Planejamento: Avaliação de Reação (Desfecho da Jornada)

Este documento detalha o planejamento para a implementação da funcionalidade de **Avaliação de Reação**, que bloqueará a tela inicial (Home) após o término da jornada do usuário (`isJourneyComplete === true`) e informará que o ciclo de pesquisa finalizou.

## 1. Proposta de Campos e Temática (Instituto Ark e Psylogos)
A avaliação deve imergir o usuário na lore do aplicativo: **O Psylogos é uma Inteligência Artificial criada para tentar entender o coração humano**. O participante atua como um Pesquisador em Potencial do Instituto ARC (Advanced Research on Consciousness).

### Título Sugerido: *Deixe sua mensagem para o Psylogos*
*Mensagem de introdução:* "Sua jornada terminou, mas ainda há uma última coisa. Queremos saber como foi a sua experiência. E talvez sua mensagem inspire outras pessoas!"

*Ação (Destaque):* Botão brilhante escrito **"✦ Deixar impressão"** ao final do formulário.

Os campos abaixo formam a avaliação. **Todos os campos de texto são opcionais**, sendo apenas a nota geral obrigatória.

1. **A Experiência Geral (Nível de Sincronização)**
   - *Tipo:* 5 botões com emoji + label (😞 Muito ruim → 🤩 Excelente)
   - *Pergunta:* "Como você avalia sua experiência geral?"
   - *Obrigatório:* Sim.

2. **Pontos Altos**
   - *Tipo:* Textarea
   - *Pergunta:* "O que você mais curtiu na jornada?"
   - *Obrigatório:* Não.

3. **Falhas na Matrix**
   - *Tipo:* Textarea
   - *Pergunta:* "Teve algo que não gostou ou não entendeu?"
   - *Obrigatório:* Não.

4. **Geração de Ideias**
   - *Tipo:* Textarea
   - *Pergunta:* "Se pudesse mudar algo para os próximos pesquisadores, o que seria?"
   - *Obrigatório:* Não.

5. **Espaço Aberto**
   - *Tipo:* Textarea
   - *Pergunta:* "Quer deixar mais alguma mensagem para a equipe do Instituto ARC?"
   - *Obrigatório:* Não.

---

## 2. Decisões de Implementação

### Trigger de exibição
- Condição: `result.isJourneyComplete === true` (já computado por `evaluateFullJourneySchedule`)
- **Não há anchor de 9h** — o bloqueio ocorre assim que todos os pings expirarem (completos ou perdidos)
- `isAfterStudyEnd` é um estado em `DashboardPage`, setado dentro de `evaluateSchedule` — segue o mesmo padrão de `isBeforeStudyStart`

### Persistência de "já respondeu"
- Campo `reactionEvaluationDone?: boolean` adicionado ao tipo `GameState`
- `saveReactionEvaluation()` em `UserService`:
  1. Salva os dados em `reactionEvaluations/{firebaseId}` (coleção própria)
  2. Atualiza `reactionEvaluationDone: true` no doc de `participantes/{firebaseId}`
- Sem Zod — validação simples: `if (!rating) return`
- Sem localStorage — persiste em Firestore, sobrevive a reinstalação

### Fluxo de tela
- `PostStudyLockScreen` é overlay absoluto (mesmo padrão do `PreStudyLock`)
- Se `!reactionEvaluationDone`: exibe lore + formulário
- Se `reactionEvaluationDone`: exibe tela de agradecimento permanente ("Mensagem recebida.")
- Após submit bem-sucedido: chama `onReactionDone()` no pai → `updateParticipante({ reactionEvaluationDone: true })`

### Prevenção de duplo envio
- Firestore: flag `reactionEvaluationDone` no doc do participante (lido no boot)
- UI: botão desabilitado durante `loading`
- Sem query extra — flag já vem no participante carregado

### Validação de rating
- `if (!rating) { setError("Selecione uma nota para continuar."); return; }`

---

## 3. Alterações no Código

### Tipos
- **[MODIFY]** `src/components/data/GameState.tsx` — adicionar `reactionEvaluationDone?: boolean`

### Serviço
- **[MODIFY]** `src/service/user/UserService.ts` — adicionar `saveReactionEvaluation(firebaseId, data)`
  - `setDoc` em `reactionEvaluations/{firebaseId}`
  - `updateDoc` em `participantes/{firebaseId}` com `{ reactionEvaluationDone: true }`

### Componentes novos
- **[NEW]** `src/components/screen/PostStudyLockScreen.tsx`
  - Props: `firebaseId`, `alreadyDone`, `onSubmitDone`
  - `alreadyDone=true` → `<ThankYouScreen />`
  - `alreadyDone=false` → lore + formulário

### Componentes modificados
- **[MODIFY]** `src/pages/DashboardPage.tsx`
  - `const [isAfterStudyEnd, setIsAfterStudyEnd] = useState(false);`
  - Em `evaluateSchedule`, no bloco `result.isJourneyComplete`: `setIsAfterStudyEnd(true);`
  - `onReactionDone`: `updateParticipante({ ...participante, reactionEvaluationDone: true })`
  - Passar `isAfterStudyEnd` e `onReactionDone` para `<HomeTab>`

- **[MODIFY]** `src/components/tabs/HomeTab.tsx`
  - Adicionar `isAfterStudyEnd: boolean` e `onReactionDone: () => void` a `Props`
  - Renderizar `<PostStudyLockScreen>` quando `isAfterStudyEnd`

---

## 4. Plano de Verificação (Testes Manuais)
1. Alterar pings de um usuário de teste para simular conclusão (todos "completed"/"missed").
2. Checar que `PostStudyLockScreen` aparece imediatamente (sem esperar 9h).
3. Submeter sem rating — confirmar mensagem de erro.
4. Submeter apenas com rating — confirmar gravação em Firestore.
5. Recarregar app — confirmar que tela de agradecimento aparece (flag lida do Firestore).
6. Confirmar que `reactionEvaluations/{uid}` existe com os campos corretos.
