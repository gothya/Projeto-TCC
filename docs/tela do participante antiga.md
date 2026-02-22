# 📋 Relatório dos Elementos da Tela do Participante — `DashboardScreen`

---

## 🧭 Header (Cabeçalho)

| Elemento | Descrição | Fonte |
|---|---|---|
| **Avatar** | Foto circular (64×64px) com borda cyan. Se não houver foto, exibe ícone `UserIcon`. Clicável — abre o `ProfileMenu`. | `user.avatar` (string base64 ou null) |
| **Apelido (Nickname)** | Exibido em negrito/cyan abaixo do avatar. | `user.nickname` |
| **Título estático** | `"Nível X - Mente Curiosa"` — o título textual é **hardcoded** ("Mente Curiosa"), não vem do banco. | `user.level` (número) + texto fixo |
| **Botão "Ativar Notificações"** | Aparece somente se `Notification.permission === "default"`. | Estado do navegador |
| **Countdown Timer** | Contagem regressiva até o próximo ping. Ao zerar, abre o fluxo automaticamente. | Componente `CountdownTimer` |
| **Botão de sino (Bell)** | Abre o fluxo de resposta do ping pendente. Desabilitado se não houver ping pendente. | `highlightedPing` |

---

## 🤖 Card Principal — Psylogos

| Elemento | Descrição |
|---|---|
| **Citação** | Texto fixo: *"Psylogos, uma inteligência buscando compreender o coração da Humanidade."* |
| **PlexusFace** | Animação 3D interativa (rosto de partículas). Draggable (`cursor-grab`). Tamanho 256×256px. |

---

## 📊 Card XP / LVL

| Elemento | Descrição | Cálculo |
|---|---|---|
| **Barra de progresso** | Barra cyan preenchida horizontalmente. | `(xpIntoLevel / xpForThisLevel) * 100` % |
| **Nível atual** | Exibido à esquerda da barra. | `user.level` |
| **Nível próximo** | Exibido à direita da barra. | `user.level + 1` |
| **XP atual / XP alvo** | Exibido no centro. Formato: `totalXp / nextLevelXpTarget XP` | `user.points` vs threshold do próximo nível |
| **Legenda** | `"XP total acumulado / XP para próximo nível"` | — |

### Thresholds de nível (21 níveis, incremento fixo de 160 XP)
`0, 160, 320, 480, 640, 800, 960, 1120, 1280, 1440, 1600 … 3200`

### XP por ação
- Ping regular respondido → **+50 XP**
- Ping de fim de dia (estrela) respondido → **+100 XP**

---

## 🏅 Card Badges

| Elemento | Descrição |
|---|---|
| **EmotionExplorerBadge** | 3 slots de badges exibidos. Apenas o 1º está `unlocked=true` (hardcoded). Os demais aparecem como bloqueados. |

> ⚠️ Os badges são **visuais estáticos** — não há lógica de desbloqueio dinâmico atualmente. O tipo `Badge` existe (`id`, `name`, `description`, `unlocked`), mas não é usado para renderizar esses slots.

---

## 📅 Card Resumo da Semana

| Elemento | Ícone | Valor exibido | Denominador | Fonte |
|---|---|---|---|---|
| **Pings Respondidos** | ✅ Verde | `completedPings` | `/42` | Pings onde `status === "completed"` e `(index+1) % 7 !== 0` |
| **Pings Perdidos** | ❌ Vermelho | `missedPings` | `/13` | Pings onde `status === "missed"` e `(index+1) % 7 !== 0` |
| **Dias Completos** | ⭐ Amarelo | `completedStars` | `/5` | Pings onde `status === "completed"` e `(index+1) % 7 === 0` (último ping do dia) |

> **Estrutura dos pings:** 7 dias × 7 pings/dia = **49 pings totais**
> - **42** pings regulares (6/dia × 7 dias)
> - **7** estrelas de fim de dia (1/dia × 7 dias)
>
> ⚠️ Os denominadores `/42`, `/13` e `/5` são **hardcoded** no JSX (não calculados dinamicamente).

---

## 🏆 Card Leaderboard

| Elemento | Descrição |
|---|---|
| **Pódio (Top 3)** | Componente `PodiumItem` para 1º, 2º e 3º lugares, com destaque visual por rank. |
| **Lista (4º em diante)** | Lista com rank, nickname e pontos. Usuário atual destacado com borda cyan e fundo semitransparente. |
| **Dados** | Busca em tempo real do Firestore (`onSnapshot`), coleção `users`, ordenado por `user.points` desc. |

---

## 🔔 Card Pings (Grid de Notificações)

| Elemento | Descrição |
|---|---|
| **Horários** | Cabeçalho com 7 colunas: `9h, 11h, 13h, 15h, 17h, 19h, 21h` |
| **Grid de status** | Cada dia é uma linha, cada ping uma célula. |
| 🟢 Verde (círculo) | Ping regular `"completed"` |
| 🔴 Vermelho (círculo) | Ping regular `"missed"` |
| ⚫ Cinza (círculo) | Ping `"pending"` |
| ⭐ Amarelo (estrela) | Ping de fim de dia `"completed"` |
| `—` Traço cinza | Ping de fim de dia `"missed"` |
| ⬛ Estrela cinza | Ping de fim de dia `"pending"` |
| **Glow animado** | Efeito `animate-ping-glow` no ping atual pendente (o próximo a ser respondido). |

---

## 🪟 Modais Acessíveis

| Modal | Como abrir | Conteúdo |
|---|---|---|
| **ProfileMenu** | Clique no avatar | Opções: trocar foto, remover foto, ver RCLE, ver desempenho, ver dados sociodemográficos, logout |
| **InstrumentModal** | Ping pendente → botão sino ou timer zera | Fluxo: SAM → Contexto → PANAS (regular) ou PANAS → EndOfDay (fim de dia) |
| **RcleModal** | Menu do perfil | Visualização das respostas RCLE |
| **PerformanceModal** | Menu do perfil | Relatório de desempenho |
| **SociodemographicModal** | Menu do perfil | Dados sociodemográficos preenchidos no onboarding |

---

## 🗃️ Estrutura de Dados (`User`)

```typescript
type User = {
  nickname: string;               // Apelido do participante
  points: number;                 // XP total acumulado
  level: number;                  // Nível calculado
  responseRate: number;           // Taxa de resposta ⚠️ não exibida no dashboard
  currentStreak: number;          // Sequência atual  ⚠️ não exibida no dashboard
  completedDays: number;          // Dias completos   ⚠️ não exibida no dashboard
  avatar?: string | null;         // Base64 da foto
  tokenNotifications?: string | null; // Token FCM
}
```

> ⚠️ **Campos existentes mas NÃO exibidos no dashboard:** `responseRate`, `currentStreak` e `completedDays` estão no tipo `User` mas não aparecem na tela atualmente.
