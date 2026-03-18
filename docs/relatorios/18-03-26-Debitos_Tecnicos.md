# 📋 Débitos Técnicos — Psylogos: Enigma da Mente

**Data:** 18 de Março de 2026  
**Última atualização:** 18/03/2026 às 02:58  
**Status geral:** 🔴 4 débitos críticos / 🟡 3 débitos médios abertos

---

## 🔴 Críticos (Risco de Dados / Funcionalidade Quebrada)

---

### DT-01 — Race Condition Silenciosa no `updateUser` (Perda de Dados)
**Severidade:** 🔴 Crítica  
**Relatório original:** `bugs/17-03-26-Investigacao_Dados_Deletados_do_Banco.md`  
**Status:** ❌ Não resolvido

**Descrição:**  
O hook `useParticipante` faz um único `getDoc` ao montar o componente, sem listener em tempo real. O `evaluateSchedule` roda a cada 5 segundos e chama `UserService.updateUser`, que **substitui o array `responses` inteiro** pelo estado local. Se o estado local estiver desatualizado (outra aba, outro dispositivo, script externo), respostas mais recentes são silenciosamente apagadas do Firestore.

**Causa:**
- `useParticipante.ts` sem `onSnapshot`
- `updateUser` em `UserService.ts`: `responses: state.responses` (substituição total do array)
- `evaluateSchedule` em `DashboardPage.tsx` aciona `updateUser` a cada 5s ao detectar pings perdidos

**Impacto confirmado:** Participantes JCS, Diamante, Thithi, Captão, Likert, bruninho, Luh R perderam respostas do dia 17/03/2026.

**Solução:**
1. `evaluateSchedule` atualizar APENAS `pings` — nunca enviar `responses`
2. `UserService.updateUser` usar `arrayUnion` para incrementar respostas em vez de substituir
3. Migrar `useParticipante` para `onSnapshot`

---

### DT-02 — Save Incremental de Pings Não Implementado
**Severidade:** 🔴 Crítica  
**Plano original:** `17-03-26-Plano_de_Implementacao_Save_Incremental_de_Pings.md`  
**Status:** ❌ Não resolvido (plano aprovado, código não escrito)

**Descrição:**  
Respostas de ping só são salvas no Firestore ao concluir **todos** os passos do formulário (`handleInstrumentFlowFinish`). Se o usuário fechar o modal em qualquer passo intermediário, todos os dados coletados até ali são perdidos. O formulário também reinicia do zero ao reabrir, sem memória do ponto onde parou.

**Solução planejada:**
- Salvar incrementalmente após cada passo com `isPartial: true` e `lastCompletedStep`
- Restaurar o flow ao reabrir o app se houver resposta parcial
- Modal de confirmação de sobrescrita se ping já foi completado

---

### DT-03 — Scripts Destrutivos na Raiz do Projeto
**Severidade:** 🔴 Crítica  
**Status:** ❌ Não resolvido

**Descrição:**  
Dois scripts na raiz do projeto podem destruir dados de produção se executados acidentalmente:

| Script | Risco |
|---|---|
| `injectData.ts` | Sobrescreve `responses[]` e `pings[]` inteiros do Captão com dados falsos |
| `deleteIniciantes.js` / `deleteIniciantes.cjs` | Deleta documentos inteiros de usuários com nickname "Iniciante" |

**Solução:**
- Mover para `scripts/dev-only/` com README de aviso
- Adicionar ao `.gitignore` se contiver dados sensíveis
- Nunca executar contra produção sem backup prévio

---

### DT-04 — `dailyScreenTimeLogs` Invisível para o Exportador Excel e `adminStats`
**Severidade:** 🔴 Crítica  
**Relatório original:** `18-03-26-Analise_TempoDeTela_Estrutura_vs_Exportacao.md`  
**Status:** ❌ Não resolvido

**Descrição:**  
O novo campo `dailyScreenTimeLogs[]` (gerado pelo botão "Lançar Tempo de Tela") **nunca é lido** por `excelExporter.ts` nem por `adminStats.ts`. O exportador só lê `InstrumentResponse.screenTimeLog`, que pertence ao modelo antigo (EOD ping). Todos os dados coletados pelo novo botão são invisíveis para análise.

**Solução:**
- Adicionar aba "Tempo de Tela (Diário)" em `buildWorkbook()` lendo `user.dailyScreenTimeLogs`
- Atualizar `adminStats.ts` para somar as duas fontes nas estatísticas gerais

---

## 🟡 Médios (UX / Feature Incompleta)

---

### DT-05 — Tempo de Tela: Modal sem Visão de 7 Dias e sem Opção "Não Usei"
**Severidade:** 🟡 Média  
**Plano original:** `implementation_plan_screentime.md` (artefatos)  
**Status:** ❌ Não resolvido (plano aprovado, código não escrito)

**Descrição:**  
O `ScreenTimeModal` atual sempre abre para "hoje" e não permite visualizar, editar ou preencher dias anteriores. Não há opção explícita de "Não assisti a redes sociais hoje" — participante que ficou sem uso não tem como registrar 0 minutos de forma semântica.

**Solução planejada:**
- Tela 1: timeline de 7 dias com status (preenchido ✅ / pendente ⚠️ / futuro 🔒)
- Tela 2: formulário do dia selecionado com opção "Não usei redes sociais hoje"
- XP dado apenas na primeira vez que um dia é preenchido

---

### DT-06 — Cadeados de Desbloqueio do Relatório Final Não Implementados
**Severidade:** 🟡 Média  
**Plano original:** `17-03-26-Desbloqueio_Formulario_TempoDeTela.md`  
**Status:** ❌ Não resolvido

**Descrição:**  
O botão "Meu Relatório" no `ProfileMenu` não tem a barreira de 3 dias de tempo de tela registrados. Os cadeados visuais com tooltip ("Faltam X dias para liberar") previstos para o `HomeTab` e para o botão do relatório ainda não foram implementados.

**Solução planejada:**
- 3 ícones de cadeado ao lado do botão "Lançar Tempo de Tela" no `HomeTab`
- Botão "Meu Relatório" bloqueado até `dailyScreenTimeLogs.length >= 3`
- Tooltip explicativo com contagem regressiva de dias

---

### DT-07 — `ReportGeneratorUtils` Usa Apenas `screenTimeLog` de Pings
**Severidade:** 🟡 Média  
**Status:** ❌ Não resolvido (derivado do DT-04)

**Descrição:**  
A seção de "Consumo de Vídeos Curtos" do PDF gerado para o participante pelo `ParticipantReportModal` também lê apenas `r.screenTimeLog` dentro de `InstrumentResponse`. Os dados em `dailyScreenTimeLogs` não entram no cálculo do relatório personalizado.

**Solução:** Atualizar `calculateReportStats` em `ReportGeneratorUtils.ts` para unir as duas fontes.

---

## ✅ Resolvidos (Arquivo)

| ID | Descrição | Resolução |
|---|---|---|
| DT-R01 | Nicknames "Iniciante" poluindo o banco | Script `deleteIniciantes.js` executado; diagnóstico documentado |
| DT-R02 | Discrepância participantes painel vs. Excel | Filtro `hasOnboarded` aplicado no painel admin |
| DT-R03 | Redesign de navegação por abas | Implementado — `HomeTab`, `SocialTab`, `ConquistasTab`, `BottomNav` |
| DT-R04 | Feature "Meu Relatório" | Implementada e integrada ao `ProfileMenu` e `DashboardPage` |
| DT-R05 | Sino e formulário não apareciam corretamente | Corrigido na refatoração da jornada de 7 dias |
