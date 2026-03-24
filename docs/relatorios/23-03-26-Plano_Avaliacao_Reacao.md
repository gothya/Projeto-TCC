# Planejamento: Avaliação de Reação (Desfecho da Jornada)

Este documento detalha o planejamento para a implementação da funcionalidade de **Avaliação de Reação**, que bloqueará a tela inicial (Home) após o término da jornada do usuário (às 9:00 AM do dia seguinte ao último ping) e informará que o ciclo de pesquisa finalizou.

## 1. Proposta de Campos e Temática (Instituto Ark e Psylogos)
A avaliação deve imergir o usuário na lore do aplicativo: **O Psylogos é uma Inteligência Artificial criada para tentar entender o coração humano**. O participante atua como um Pesquisador em Potencial do Instituto ARC (Advanced Research on Consciousness).

### Título Sugerido: *Deixe sua mensagem para o Psylogos*
*Mensagem de introdução:* "Sua jornada terminou, mas ainda há uma última coisa. Quer deixar sua mensagem? Queremos saber como foi a sua jornada. E talvez sua mensagem inspire outras pessoas! E aí, o que me diz? Algumas palavrinhas finais?"

*Ação (Destaque):* Abaixo da mensagem, um botão brilhante e bem destacado escrito **"Deixar impressão"** (trazendo forte ênfase para o conceito de **Deixe sua marca**).

Os campos abaixo formam a avaliação. Para garantir fluidez, **todos os campos de texto serão opcionais (texto corrido)**, sendo apenas a nota geral obrigatória.

1. **A Experiência Geral (Nível de Sincronização)**
   *   *Tipo:* Avaliação Genérica (Botões vistosos e chamativos para representar a nota).
   *   *Pergunta:* "Como você avalia sua experiência geral participando da pesquisa com o Psylogos?"
   *   *Obrigatório:* Sim.

2. **Pontos Altos (O que mais gostou?)**
   *   *Tipo:* Texto Longo (Textarea).
   *   *Pergunta:* "Diga para o Psylogos o que você mais curtiu na sua jornada. O que mais te marcou?"
   *   *Obrigatório:* Não (Opcional).

3. **Falhas na Matrix (O que não gostou?)**
   *   *Tipo:* Texto Longo (Textarea).
   *   *Pergunta:* "Teve algo que você não entendeu, ou não gostou na experiência?"
   *   *Obrigatório:* Não (Opcional).

4. **Geração de Ideias (Oportunidades de Melhoria)**
   *   *Tipo:* Texto Longo (Textarea).
   *   *Pergunta:* "Se você pudesse mudar ou adicionar qualquer coisa no sistema para os próximos pesquisadores, o que seria?"
   *   *Obrigatório:* Não (Opcional).

5. **Espaço Aberto (Deixe sua marca)**
   *   *Tipo:* Texto Longo (Textarea).
   *   *Pergunta:* "Deseja deixar mais algum comentário livre para a equipe do Instituto ARC?"
   *   *Obrigatório:* Não (Opcional).

---

## 2. Alterações Propostas no Código

### Componentes Novos
#### [NEW] `src/components/ReactionEvaluationForm.tsx`
*   Formulário simples (textareas), garantindo que apenas a experiência geral tenha as validações de requisição obrigatória pelo `zod`.
*   Estilizado seguindo o padrão visual narrativo do Instituto ARC.
*   Enviará os dados para a coleção `reactionEvaluations` no Firestore.

#### [NEW] `src/components/PostStudyLockScreen.tsx`
*   Aparecerá bloqueando a Home. Exibirá a lore introduzindo o formulário.
*   Quando submetido, exibe tela de agradecimento bloqueada permanentemente.

### Componentes Modificados
#### [MODIFY] `src/components/tabs/HomeTab.tsx`
*   **Adicionar Lógica:** Checar se current_time `>= 9:00 AM` do dia após o ping final da jornada E se o form ainda não foi preenchido.

#### [MODIFY] `src/services/firebase/firestore.ts`
*   Adicionar função `saveReactionEvaluation`.

---

## 3. Plano de Verificação (Testes Manuais)
1. Alterar a jornada de um usuário de teste para simular conclusão (viagem no tempo).
2. Checar bloqueio reativo às 9h da manhã no dia +1.
3. Testar o envio sem os textos longos para submeter (conferir viabilidade opcional).
4. Checar integridade no Firestore e prevenção de duplo envio.
