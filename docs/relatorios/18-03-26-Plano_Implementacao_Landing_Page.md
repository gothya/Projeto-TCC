# Plano de Implementação — Landing Page Psylogos

**Data:** 18 de março de 2026
**Baseado em:** Relatório de Melhorias `18-03-26-Relatorio_Melhorias_Landing_Page.md`

---

## Avaliação Crítica: GSAP vs. Framer Motion

**Veredicto: GSAP é tecnicamente plausível, mas desnecessário e contraproducente neste projeto.**

A proposta pede GSAP + ScrollTrigger para:
1. Parallax de fundo a 30% da velocidade do scroll
2. `fade-in` + `slide-up` nos textos ao entrarem na viewport

**O projeto já tem Framer Motion 12 instalado**, que resolve exatamente esses dois casos com APIs nativas para React:

| Recurso desejado | Framer Motion | GSAP + ScrollTrigger |
|---|---|---|
| Parallax (useScroll + useTransform) | Nativo, 0 bytes extras | +47KB ao bundle |
| Fade-in / slide-up ao entrar na viewport | `whileInView` já usado no projeto | Exige `useEffect` + `kill()` manual |
| Integração com React | Primeira classe | Imperativo, requer ref management |
| Conflito com bug de scroll duplo | Nenhum | **Alto risco** |

O bug #3 do relatório (containers com `overflow-y: scroll` aninhados) ainda não foi corrigido. Adicionar o ScrollTrigger do GSAP nesse estado **provavelmente vai quebrar o scroll** porque ele calcula posições baseadas no `document.scrollTop`, não em elementos filhos.

**Decisão:** Implementar os mesmos efeitos usando Framer Motion. O resultado visual é idêntico.

---

## Fase 1 — Correções Urgentes

> Baixo risco, alto impacto. Pode ser feito imediatamente.

### 1.1 Correções Textuais

| De (Incorreto) | Para (Correto) | Arquivo |
|---|---|---|
| "Sua mente reage..." | "Seu coração reage aos algoritmos" | `PsyHero.tsx` |
| "Relatório psicológico personalisado" | "Relatório de Jornada Personalizado" | `PsyGamification.tsx` |
| "Cadeado + 3 dias de dados" | "21 respostas válidas e 2700XP" | `PsyGamification.tsx` |
| "Thiago - Pesquisador principal" | "Thiago - Pesquisador" | `PsyAuthority.tsx` |
| "TCLE" (todas ocorrências) | "RCLE" | `PsyAuthority.tsx`, `PsyFooter.tsx` |

**CTA do botão topo** (`PsyHero.tsx`): Atualizar copy para:
> *"participe de uma jornada de 7 dias de autodescoberta científica e vamos descobrir se as redes sociais têm algo a nos ensinar sobre as nossas emoções"*

### 1.2 Redirecionamento dos Botões CTA

- Botão hero (`PsyHero.tsx`) → `https://projeto-tcc-pi.vercel.app/dashboard`
- Botão CTA final (`PsyCTA.tsx`) → `https://projeto-tcc-pi.vercel.app/dashboard`

---

## Fase 2 — Bug de Scroll (Pré-requisito para Animações)

> **Bloqueante.** Deve ser resolvido antes de qualquer animação nova de scroll.

**Problema:** Containers com `h-screen` + `overflow-hidden` aninhados criam múltiplos contextos de scroll. O navegador fica confuso sobre qual container rolar.

**Arquivos:** `Index.tsx`, `App.tsx`

**Solução:**
- Remover `h-screen` + `overflow-hidden` / `overflow-y-auto` de containers macro
- Garantir que apenas o `body` (ou um único wrapper raiz) tenha o controle de scroll
- Validar em mobile e desktop após a mudança

---

## Fase 3 — Parallax + Fade-in com Framer Motion

> Depende da Fase 2 estar concluída.

### 3.1 Parallax de Fundo (equivalente ao efeito GSAP solicitado)

```tsx
import { useScroll, useTransform, motion } from "framer-motion";

// Dentro do componente:
const { scrollY } = useScroll();
const bgY = useTransform(scrollY, [0, 1000], [0, 300]); // 30% da velocidade

// No JSX:
<div style={{ position: "relative", overflow: "hidden" }}>
  <motion.div
    style={{ y: bgY, backgroundImage: "url(...)" }}
    className="absolute inset-0 bg-cover bg-center scale-110"
  />
  {/* conteúdo sobreposto */}
</div>
```

### 3.2 Fade-in + Slide-up (equivalente ao ScrollTrigger solicitado)

```tsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>
  {/* texto da seção */}
</motion.div>
```

Padronizar esse padrão em todas as seções novas.

---

## Fase 4 — Melhorias de Design

### 4.1 Navbar com Highlight de Seção Ativa

- Usar `IntersectionObserver` para detectar qual seção está visível
- Armazenar ID da seção ativa em `useState`
- Aplicar classe de destaque no item de menu correspondente

### 4.2 Hero com Vídeo de Fundo — `PsyHero.tsx`

```tsx
<video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
  <source src="/videos/hero-bg.mp4" type="video/mp4" />
</video>
<div className="absolute inset-0 bg-black/60" /> {/* overlay de legibilidade */}
```

- Fallback: imagem estática se vídeo não carregar (`<ImageWithFallback>`)

### 4.3 Arte do Coração

- Headline: "Pronto para decifrar o enigma do seu coração?"
- Inserir imagem do coração com iluminação quente contrastando com fundo azul frio

---

## Fase 5 — Novas Seções

### 5.1 Seção "A História de Psylogos" → `PsyStory.tsx`

Bloco narrativo sobre a origem do personagem PS e do Instituto ARC. Estrutura:
- Layout alternado texto / visual (sci-fi)
- Inicialmente apenas estrutura + design reservado (sem texto final)
- Conectar em `Index.tsx`

### 5.2 Seção "Como Responder" (Tutoriais) → `PsyTutorials.tsx`

Fluxograma visual do processo:
```
RCLE → Apelido Anônimo → Sociodemográfico → Dashboard
  └─ Notificação (9h–19h) → SAM → PANAS → [retorna ao dia]
  └─ Relatório Noturno (21h) → PANAS completo → Fechamento
```

Cards explicativos para cada instrumento (SAM, PANAS) com visuais.

### 5.3 Revisão dos Cards de Instrumentos — `PsyResearch.tsx`

- Modernizar layout dos cards CORE/SAM/PANAS/Tempo de Tela
- Melhorar hierarquia visual para facilitar compreensão cognitiva

---

## Fase 6 — WhatsApp e Limpeza Visual

### 6.1 CTA de Lembretes via WhatsApp

- Novo bloco em `PsyCTA.tsx` ou seção própria
- Botão: `http://wa.me/5561992360330`
- Copy: convite para receber lembretes dos horários de resposta

### 6.2 Unificar Contato/Suporte — `PsyFooter.tsx`

- Redirecionar toda menção de "suporte" para o mesmo WhatsApp

### 6.3 Remover Selos Redundantes

- Manter garantias de anonimato/ética em **um único local central**
- Remover ocorrências duplicadas nas demais seções

---

## Ordem de Execução

```
Fase 1  →  Fase 2  →  Fase 4.2 (video hero)
                   →  Fase 3 (parallax + fade)
                   →  Fase 4.1 (navbar)
                   →  Fase 4.3 (coração)
                   →  Fase 5 (novas seções)
                   →  Fase 6 (WhatsApp + limpeza)
```

> A **Fase 2 é bloqueante** para toda animação de scroll. Sem ela, qualquer parallax se comporta de forma imprevisível.
