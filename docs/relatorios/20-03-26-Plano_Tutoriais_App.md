# Área de Tutoriais no App — Plano de Implementação (Revisado)

Adicionar a aba **"Guia do Explorador"** ao app Psylogos com conteúdo didático em accordion, incluindo tutorial interativo de Tempo de Tela com carrossel de imagens.

---

## Ordem Final das Seções

| # | Título do Accordion | Ícone | Notas |
|---|---|---|---|
| 1 | O Formulário SAM | 🎭 | Sem numeração no título |
| 2 | O Formulário PANAS | 💬 | Sem numeração no título |
| 3 | Registro de Tempo de Tela | 📱 | **Novo** — carrossel de 12 imagens |
| 4 | Fluxo Diário | 🗓️ | Card de "Tempo de Tela" removido (agora é seção própria) |
| 5 | Dúvidas Frequentes | ❓ | Sem alterações |
| 6 | Revisitar o Início | 🚀 | Antigos "Primeiros Passos" — movido para o fim |

> **Decisão:** Sem numeração nos títulos (ex: "Passo 1 — O SAM" → "O Formulário SAM") para evitar inconsistência com materiais externos (landing page, WhatsApp).

> **Decisão:** "Primeiros Passos" não é removido — é movido para o final como referência, pois o participante pode querer revisitar (ex: como enviar avatar).

---

## Seção Nova: Registro de Tempo de Tela

### Componente interno: `TutorialCarousel`

Carrossel puro React + CSS, sem Framer Motion. Localizado dentro de `TutoriaisTab.tsx`.

**Funcionalidades obrigatórias:**
- Swipe horizontal via `onTouchStart` / `onTouchEnd` (delta mínimo: 40px)
- Botões `← Anterior` / `Próximo →` com estado desabilitado nas pontas
- Contador de posição: `3 / 12` com barra de progresso colorida por fase
- Toque na imagem → abre lightbox fullscreen (modal sobre a tela toda)
- Lightbox: botões `‹` `›` para navegar, `✕` para fechar, swipe também funciona
- `loading="lazy"` em todas as imagens exceto a atual e as adjacentes
- `max-h-72 object-contain` na imagem do carrossel para não transbordar

**Fases e cores:**

| Fase | Telas | Cor |
|---|---|---|
| Abrindo o formulário | 1–3 | cyan (#22d3ee) |
| Adicionando suas redes | 4–7 | roxo (#a78bfa) |
| Encontrando o dado real | 8–12 | laranja (#fb923c) |

**Dados dos passos:** Os textos dos 12 passos são os mesmos já definidos na landing page (`PsyTutorialMap.tsx`) — reutilizar o array de `title` + `caption`.

### Ativos de imagem

As imagens **já existem** em `public/tutorial/screen-time/` no projeto do App. Nenhuma cópia necessária.

```
tela_1.png  tela_2.png  tela_3.png  tela_4.png
tela_5.png  tela_6.png  tela_7.png  tela_8.jpeg
tela_9.jpeg tela_10.jpeg tela_11.jpeg tela_12.png
```

---

## Mudanças em TutoriaisTab.tsx

### 1. Remover numeração dos títulos
```diff
- "Passo 2 — O Formulário SAM"
+ "O Formulário SAM"
- "Passo 3 — O Formulário PANAS"
+ "O Formulário PANAS"
- "Passo 4 — Fluxo Diário"
+ "Fluxo Diário"
```

### 2. Remover card duplicado de Tempo de Tela
O bloco dentro de "Fluxo Diário" que começa com `<p>Tempo de Tela</p>` deve ser removido — o assunto agora tem seção própria.

### 3. Adicionar accordion "Registro de Tempo de Tela"
Inserido entre PANAS e Fluxo Diário. Contém o `TutorialCarousel` com as 12 imagens.

### 4. Mover "Primeiros Passos" para o fim
Renomear para "Revisitar o Início" e posicionar após FAQ.

### 5. Componente TutorialCarousel (esboço)
```tsx
const STEPS = [ /* 12 passos com img, title, caption, color */ ]

function TutorialCarousel() {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  // Swipe
  const touchStart = useRef(0)
  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    const delta = touchStart.current - e.changedTouches[0].clientX
    if (delta > 40) next()
    if (delta < -40) prev()
  }

  const phase = STEPS[current].phase // 0, 1 ou 2
  const progress = ((current + 1) / STEPS.length) * 100

  return (
    <>
      {/* Barra de progresso por fase */}
      {/* Imagem clicável */}
      {/* Controles Anterior / N de 12 / Próximo */}
      {/* Lightbox condicional */}
    </>
  )
}
```

---

## Plano de Verificação

1. **Ativos:** `public/tutorial/screen-time/` contém as 12 telas ✅ (já confirmado)
2. **Ordem:** SAM → PANAS → Tempo de Tela → Fluxo → FAQ → Revisitar o Início
3. **Carrossel:** Clicar Próximo até 12/12 sem erros; swipe horizontal funciona
4. **Lightbox:** Toque na imagem → abre modal; setas e swipe navegam; ✕ fecha
5. **Overflow:** Imagem não ultrapassa a altura da tela em nenhum passo
6. **Duplicação:** Confirmar que o card de Tempo de Tela sumiu do Fluxo Diário

---

*Revisado: Março 2026*
