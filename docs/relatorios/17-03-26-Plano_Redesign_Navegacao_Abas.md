# Plano de Implementação — Redesign com Navegação por Abas

**Data:** 17 de março de 2026
**Branch:** form_do_participante

---

## Visão Geral

Substituir o layout atual do Dashboard por uma navegação em três abas com barra inferior fixa.

```
┌─────────────────────────────────┐
│                                 │
│         [conteúdo da aba]       │
│                                 │
│  [🔔 Bell + Timer flutuante]   │
├─────────────────────────────────┤
│  👥 Social │ 🏠 Início │ 🏆 Conquistas │
└─────────────────────────────────┘
```

---

## Arquivos a Criar

### 1. `src/components/navigation/BottomNav.tsx`
Barra de navegação fixa no rodapé. Três abas com ícones e labels. Estado ativo com glow cyan + animação de underline. O avatar do participante fica no centro como botão Início.

### 2. `src/components/tabs/HomeTab.tsx`
**Conteúdo:**
- Avatar centralizado (grande, com anel luminoso e nível sobreposto)
- Nickname + título de nível abaixo
- **Progresso do dia atual:** linha com os 7 pings do dia — verde (respondido), vermelho (perdido), cinza (pendente), **piscando** (próximo/ativo)
- **Barra de XP:** visual de quanto tem e quanto falta pro próximo nível
- Timer e bell flutuantes (preservados do Dashboard atual)

### 3. `src/components/tabs/SocialTab.tsx`
**Conteúdo:**
- Header estilizado "Ranking Global"
- Top 3 em destaque (podium — reutiliza `PodiumItem`)
- Lista do restante dos participantes
- **Rodapé fixo** mostrando a posição e XP do usuário logado, mesmo que não esteja entre os primeiros — sempre visível

### 4. `src/components/tabs/ConquistasTab.tsx`
**Conteúdo:**
- **Resumo da semana:** cards com pings respondidos, perdidos e taxa de resposta da semana atual
- **Histórico de pings:** grade 7×7 completa (o que está hoje no Dashboard)
- **Relatório:**
  - Se desbloqueado (≥50%): botão "Ver Meu Relatório" com glow
  - Se bloqueado: card com cadeado, mensagem explicativa e barra de progresso mostrando `X% de 50% concluídos`

---

## Arquivos a Modificar

### 5. `src/pages/DashboardPage.tsx`
- Adicionar estado `activeTab: "social" | "home" | "conquistas"`
- Remover o layout atual (header com ProfileMenu, leaderboard inline, ping grid inline)
- Renderizar `BottomNav` + a aba ativa via switch
- **Preservar:** todo o estado existente, modais, schedule evaluation, bell/timer (movidos para o `HomeTab`)
- O `ProfileMenu` (avatar, logout, etc.) migra para o `HomeTab` como botão de configurações discreto no canto superior

---

## Sequência de Implementação

| Passo | Arquivo | Ação |
|---|---|---|
| 1 | `BottomNav.tsx` | Criar — componente puro de navegação |
| 2 | `HomeTab.tsx` | Criar — view principal do participante |
| 3 | `SocialTab.tsx` | Criar — extraindo leaderboard do Dashboard |
| 4 | `ConquistasTab.tsx` | Criar — nova tela com histórico + relatório |
| 5 | `DashboardPage.tsx` | Modificar — orquestrar tudo com estado de aba |

---

## Riscos

- **Bell/Timer:** precisam continuar funcionando independente da aba ativa. Serão renderizados como overlay flutuante acima do conteúdo, abaixo do `BottomNav`, só quando `isBellVisible` for `true`
- **Modais existentes:** não mudam — continuam sendo abertos via callbacks passados às abas
- **`evaluateSchedule`:** não muda — continua rodando em background no `DashboardPage`

---

## Dados por Aba

| Aba | Props necessários |
|---|---|
| HomeTab | participante, highlightedPing, isBellVisible, timerTargetDate, timerLabel, isActiveWindow, startInstrumentFlow, onOpenMenu |
| SocialTab | leaderboardData, currentNickname |
| ConquistasTab | participante, isReportAvailable, onOpenReport, pings |
