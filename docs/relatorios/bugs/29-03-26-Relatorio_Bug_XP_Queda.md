# Relatório de Bug: XP "Cai" de um Dia para o Outro e Ranking Global Quebrado

**Data Útima Atualização:** 31/03/2026
**Severidade:** 🔴 Crítica — afeta diretamente a percepção de progresso do participante, integridade da gamificação e funcionalidades do painel Admin.
**Status:** Solução Planejada — Aguardando aprovação para aplicar correções.

---

## 🔍 Descrição dos Sintomas

1. **Queda de XP do Participante:** Participantes relatam que sua pontuação de XP diminuiu drasticamente entre uma sessão e outra, perdendo milhares de pontos (especialmente os de Tempo de Tela) assim que concluem um novo ping.
2. **Discrepância no Ranking:** Na interface de um usuário, seu XP no ranking aparece em 800. Porém, no Painel do Pesquisador (Admin), os estatísticas computam que o usuário possui 1300 XP.
3. **Ranking Preso em Carregamento:** A tela de Ranking Global ("SocialTab") não exibe os jogadores e entra em "loop" de carregamento constante (`Carregando ranking...`), e quando aparece, dados parecem "zerados".
4. **Erro no Painel Admin:** Ao clicar no botão "Recalcular XP" no `AdminDashboardPage.tsx`, o sistema imediatamente lança um erro, impedindo o recálculo em massa do progresso dos pacientes.

---

## 🚨 Causa Raiz: Inconsistências de Arquitetura e Regras de Segurança

A investigação revelou múltiplos pontos de falha colaborando para estes cenários:

### 1. Incompatibilidade na Lógica de XP (A Causa da Queda de Pontos)
Havia **duas lógicas isoladas** sobrescrevendo a propriedade principal `participante.user.points`.
Ao concluir um instrumento, a função `handleInstrumentFlowFinish` sobrescrevia o XP recalculando do zero com base *apenas nos pings*, destruindo o acúmulo advindo de `dailyScreenTimeLogs`. Ao salvar Tela, `handleSaveScreenTime` fazia o inverso, atuando de maneira aditiva.

> **Nota:** Esta correção estrutural de lógica foi mapeada e abordada na unificação do `calculateTotalXp` dentro do escopo principal em desenvolvimentos recentes.

### 2. Sincronização Desconectada com a Coleção `leaderboard` (Discrepância 800 vs 1300)
Para otimizar leituras do Rank, a aplicação utiliza a coleção `leaderboard` paralelamente à coleção principal `participantes`. O painel do Administrador lê dados em `participantes`, enquanto os clientes leem `leaderboard`.
- **A falha:** O mecanismo de refatoração automática ("Recalcular XP" na página do Admin) **não foi programado para atualizar a coleção `leaderboard`**. Assim, o Admin corrigia e enxergava o XP real da conta (1300), enquanto o frontend dos usuários continuava carregando a réplica defasada na coleção do Rank (800).

### 3. Falha de Permissão do Administrador (Erro no Botão "Recalcular XP")
Quando o pesquisador clica em "Recalcular XP", ocorre uma iteração client-side passando por todos os participantes e invocando `updateDoc` do Firestore.  
O arquivo de regras (`firestore.rules`) apenas possuía:
```typescript
allow update, delete: if request.auth != null && request.auth.uid == userId;
```
Ou seja, o Administrador tem autorização (`request.auth.token.admin == true`) para **LÊR** os dados globais da pesquisa, mas **LHE FOI NEGADA A PERMISSÃO DE ESCRITA** em fichas alheias. O Firebase imediatamente bloqueia a primeira atualização da varredura, retornando erro na requisição e quebrando o recálculo.

### 4. O Loop de "Carregando Ranking" (Frontend Lidando Mal com Erros)
O loop eterno na aba *Ranking Global* decorre novamente do arquivo de regras (`firestore.rules`). Se as regras da coleção bloqueiam a leitura, o listener `onSnapshot` sofre um throw/catch e imediatamente esvazia os dados para um Array vazio `[]`, induzindo o frontend a se prender num estado eterno de `Carregando ranking...`. Adicionalmente, registros corrompidos/zerados permanecem sendo exibidos quando não bloqueados puramente porque o "Recálculo" falhou em corrigir essa tabela.

---

## 📐 Dinâmica do Bug do Ranking em Tabela

| Evento | Coleção `participantes` | Coleção `leaderboard` | Status Visível na Tela |
|:---|:---|:---|:---|
| Bug de perda de XP ocorre | XP cai (ex: 200) | XP cai (ex: 200) | Usuário vê 200, Admin vê 200 |
| Admin repara código de soma de XP | Continua 200 | Continua 200 | Usuário vê 200, Admin vê 200 |
| Admin aperta **"Recalcular XP"** | ❌ **Firestore DENIES Update** | ❌ **Nenhuma ação foi chamada** | Admin recebe "Erro" em sua tela |
| (Se Admin Bypassasse a Regra) | ✅ XP calculado certo (1300) | ❌ **Nenhuma ação seria chamada** | **Admin vê 1300, Usuário vê os velhos 200** |

---

## ✅ Direção e Próximos Passos do Bugfix

Para erradicar de vez a instabilidade na pontuação e progressão global:

1. **Atualizar `firestore.rules`:**
   Expandir os escopos de `update` de ambas as coleções (`participantes` e `leaderboard`) para acomodarem a cláusula `request.auth.token.admin == true`, assim os administradores poderão comandar reparos massivos em dados da pesquisa no backend.
   
2. **Atualizar a script `recalculateAllXp`:**
   Alterar este controlador no escopo do Admin para rodar os updates encadeados visando os documentos paralelos da coleção `leaderboard`.

3. **Deploy Obrigatório de Sec-Rules:**
   Toda essa estrutura não servirá sem despachar as novas regras de segurança local para o emulador/banco em nuvem com o comando:
   `firebase deploy --only firestore:rules`
