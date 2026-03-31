# Relatório de Bug: XP "Cai" de um Dia para o Outro e Ranking Global Quebrado

**Data Útima Atualização:** 31/03/2026
**Severidade:** 🔴 Crítica — afeta diretamente a percepção de progresso do participante, integridade da gamificação e funcionalidades do painel Admin.
**Status:** ✅ Corrigido no código — pendente deploy das `firestore.rules` em produção.

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

## ✅ Correções Aplicadas

### 1. Unificação do cálculo de XP — `DashboardPage.tsx`
Criada função `calculateTotalXp(pings, screenTimeLogs)` como única fonte de verdade:
```ts
XP Total = reduce(pings.statuses == "completed") + uniqueDays × 500
```
`uniqueDays` usa `Set` para deduplicar datas — alinhado com a lógica do Admin. Ambos os handlers (`handleInstrumentFlowFinish` e `handleSaveScreenTime`) agora chamam esta função.

### 2. Sincronização do leaderboard — `UserService.ts`
`saveDailyScreenTimeLogs` passou a atualizar `leaderboard/{uid}.points` via `Promise.all`, igualando o comportamento de `updateUser`.

### 3. Permissão de escrita do Admin — `firestore.rules`
Adicionada cláusula `request.auth.token.admin == true` nos escopos de `update` de `participantes` e `write` de `leaderboard`.

### 4. `recalculateAllXp` corrigido — `AdminDashboardPage.tsx`
Duas correções:
- **Leaderboard sempre sincronizado:** o `setDoc` no leaderboard agora roda incondicionalmente, independente de `participantes` precisar ou não de atualização. Resolve o caso em que `participantes` já estava correto mas o leaderboard ainda estava defasado.
- **Breakdown de XP no card Progresso:** o painel Admin agora exibe pings regulares, pings estrela e dias de tempo de tela separadamente, com comparação entre o XP salvo no banco e o XP calculado ao vivo — borda vermelha sinaliza dados corrompidos automaticamente.

---

## ⏳ Pendências

1. **Deploy das rules em produção:**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Rodar "Recalcular XP" no painel Admin uma vez** após o deploy para corrigir todos os documentos com dados corrompidos do período anterior ao fix.

---

## 📌 Atualização (31/03): Detalhamento Visível do XP — ✅ Implementado

O card **🏆 Progresso** no painel do pesquisador foi expandido para exibir o breakdown completo das fontes de XP de cada participante, calculado ao vivo a partir dos dados brutos (`pings.statuses` e `dailyScreenTimeLogs`):

- **Pings regulares** (índices 0–5 com status `completed`): quantidade × 50 XP
- **Pings estrela** (índice 6 com status `completed`): quantidade × 100 XP
- **Tempo de tela** (dias únicos registrados): dias × 500 XP

O card exibe dois totais lado a lado: **XP salvo no banco** (`user.points`) e **XP calculado agora**. Se divergirem, a borda fica vermelha e aparece o aviso *"⚠ Dados corrompidos — use 'Recalcular XP' para corrigir"*, permitindo ao pesquisador identificar participantes com dados inconsistentes sem precisar inspecionar o Firestore manualmente.
