# Área de Tutoriais no App — Plano de Implementação

Adicionar uma aba **"Tutoriais"** ao app Psylogos, com conteúdo didático e interativo inspirado na seção [`PsyTutorials.tsx`](file:///c:/dev/Psylogos-landing-page-website-template/src/components/PsyTutorials.tsx) da landing page, adaptado ao visual dark/neon do app.

---

## Proposta Visual

A aba terá **4 blocos temáticos** exibidos em formato de **accordion expansível**. Cada bloco tem um header neon clicável que abre/fecha o conteúdo com uma animação suave. Isso mantém a tela limpa e deixa o participante explorar no seu ritmo.

```
┌─────────────────────────────────────┐
│ 📖 Guia do Explorador               │  ← título da aba
├─────────────────────────────────────┤
│ ▶ Passo 1 — Primeiro Acesso     [+] │  ← accordion fechado
├─────────────────────────────────────┤
│ ▼ Passo 2 — O SAM               [-] │  ← accordion aberto
│   ┌──────────┬──────────┬─────────┐ │
│   │ Valência │ Ativação │Dominânc.│ │
│   └──────────┴──────────┴─────────┘ │
│   "Dica: não pense muito..."        │
├─────────────────────────────────────┤
│ ▶ Passo 3 — O PANAS             [+] │
├─────────────────────────────────────┤
│ ▶ Fluxo Diário Resumido         [+] │
└─────────────────────────────────────┘
```

---

## Mudanças Propostas

### Navigation Layer

#### [MODIFY] [BottomNav.tsx](file:///c:/dev/Projeto-TCC/src/components/navigation/BottomNav.tsx)

- Adicionar `"tutoriais"` ao tipo `Tab`
- Adicionar ícone de livro/lâmpada (SVG inline, sem dependências)
- Inserir o tab `{ id: "tutoriais", label: "Guia", icon: <BookIcon /> }` no array `tabs`
- Posição: entre `"home"` e `"conquistas"` (ou como 4º tab — a decidir na revisão)

> [!IMPORTANT]
> O `BottomNav` atualmente tem 3 tabs em layout `justify-around`. Com 4 tabs, o espaçamento diminui mas ainda funciona bem em mobile (cada botão ~85px de largura em 375px). Podemos manter `justify-around` ou ajustar para `justify-between`.

---

### Tab Component

#### [NEW] [TutoriaisTab.tsx](file:///c:/dev/Projeto-TCC/src/components/tabs/TutoriaisTab.tsx)

Componente puro React + Tailwind, **sem framer-motion** (não é dependência do app). Animações via CSS transition.

**Estrutura interna:**

```tsx
// Accordion com estado local por seção
const [openSection, setOpenSection] = useState<number | null>(0);

// 4 seções:

// ── Seção 1: Onboarding (4 cards em linha com seta) ──
// RCLE → Apelido → Perfil → Dashboard
// Adaptação do onboardingSteps da landing page

// ── Seção 2: SAM ──
// Explicação + 3 cards: Valência, Ativação, Dominância
// Escala visual 1–9 por card
// "Dica: não pense muito — seja fiel ao que sente agora."

// ── Seção 3: PANAS ──
// Dois cards: Notificações diurnas (9–19h) x Relatório noturno (21h)
// Escala visual 1–5 (Nada → Extremamente) — igual à landing

// ── Seção 4: Fluxo Diário ──
// Pills conectadas: Notificação → SAM → PANAS (5min) → Continua
//                   21h → PANAS (dia todo) → Relatório noturno
```

**Decisão de design:**
- Accordion com apenas **uma seção aberta por vez** (`openSection` = índice único)
- Header de cada seção: fundo `rgba(34,211,238,0.06)`, borda neon, ícone à esquerda, `+/-` à direita
- Conteúdo expandido: transição de altura com `max-height` via CSS (padrão do projeto)
- Paleta: cyan-400 (primário), purple-400 (secundário), pink-400 (acento) — igual à landing

---

### Dashboard Wiring

#### [MODIFY] [DashboardPage.tsx](file:///c:/dev/Projeto-TCC/src/pages/DashboardPage.tsx)

- Importar `TutoriaisTab`
- Adicionar `"tutoriais"` ao tipo do state `activeTab`
- Adicionar bloco de renderização condicional:
  ```tsx
  {activeTab === "tutoriais" && (
    <TutoriaisTab />
  )}
  ```
- O `TutoriaisTab` **não precisa de props** — é conteúdo estático.

---

## Plano de Verificação

### Testes Manuais

1. **Rodar o dev server:**
   ```bash
   cd c:\dev\Projeto-TCC
   npm run dev
   ```
2. Abrir o app no navegador em `http://localhost:5173` e fazer login com uma conta de participante.
3. Verificar que a **aba "Guia"** aparece na `BottomNav` com ícone e label corretos.
4. Clicar na aba — verificar que a `TutoriaisTab` é renderizada.
5. Testar cada accordion:
   - Clicar em "Passo 1 — Primeiro Acesso" → conteúdo expande com animação.
   - Clicar no mesmo → fecha.
   - Abrir "Passo 2 — O SAM" → "Passo 1" fecha automaticamente (só uma seção aberta).
   - Repetir para seções 3 e 4.
6. **Responsividade:** Redimensionar a janela para 375px de largura (modo mobile) e verificar:
   - Os cards da seção 1 ficam empilhados verticalmente (não quebram o layout).
   - Os 3 cards do SAM ficam em coluna única.
   - Os 2 cards do PANAS ficam em coluna única.
   - A escala 1–5 do PANAS cabe horizontalmente.
7. **Navegação:** Navegar para outras abas (Home, Social, Conquistas) e voltar — verificar que o estado do accordion é resetado (ou mantido, a decidir).
8. **BottomNav com 4 tabs:** Verificar que os 4 botões cabem na barra sem overflow em 375px de largura.

### Testes Automatizados

Não há testes automatizados no projeto. Esta feature é puramente visual/estática — o risco de regressão é baixo.

---

*Branch: `Tutoriais` — Março 2026*
