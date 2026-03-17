---
name: frontend-design-psylogos
description: >
  Skill for implementing and improving the visual design system of the Psylogos: Enigma da Mente
  application. Covers component patterns, color tokens, animation conventions, and UI best practices
  for the app's dark/neon sci-fi aesthetic with React, TypeScript, and Tailwind CSS.
---

# Frontend Design Skill — Psylogos: Enigma da Mente

## Overview

This skill provides guidelines and patterns for creating, refactoring, and improving UI components in the **Psylogos** research app. The app uses a **dark sci-fi / cyberpunk aesthetic** with neon cyan accents, glassmorphism panels, and subtle animations.

---

## Tech Stack

| Technology     | Details                                         |
|----------------|-------------------------------------------------|
| Framework      | React 19 + TypeScript                           |
| Bundler        | Vite 6                                          |
| Styling        | Tailwind CSS (via class names in TSX)           |
| Routing        | React Router v7                                 |
| Icons          | Custom SVG components in `src/components/icons` |
| Animations     | Tailwind `animate-*` + inline `transition-*`    |

---

## Design Language

### Color Palette (Tokens)

Always use these Tailwind tokens. **Never use raw hex values** inside component files.

| Role             | Tailwind Class               | Usage                                  |
|------------------|------------------------------|----------------------------------------|
| Background       | `bg-brand-dark`, `bg-slate-950` | Page backgrounds                    |
| Panel            | `bg-slate-900/50`            | Cards, modals, containers              |
| Border           | `border-cyan-400/20`         | All panels and cards                  |
| Primary Accent   | `text-cyan-400`, `bg-cyan-400` | Titles, CTA buttons, active states  |
| Secondary Accent | `text-violet-400`            | XP, achievements, secondary info      |
| Success          | `text-green-400`             | Completed pings, success states       |
| Error / Danger   | `text-red-400`               | Missed pings, error states             |
| Muted Text       | `text-gray-400`, `text-gray-500` | Subtitles, descriptions           |
| White Text       | `text-white`                 | Primary readable text                  |

### Glow Effects

Use these custom Tailwind classes (defined in the project) for luminous effects:

- `shadow-glow-blue` — cyan glow on cards and buttons
- `shadow-glow-blue-sm` — subtle glow for focused inputs
- `shadow-glow-violet` — violet glow for XP/level elements

---

## Component Patterns

### Standard Panel / Card

```tsx
<div className="w-full p-6 space-y-4 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue">
  <h2 className="text-xl font-bold text-cyan-400">Título</h2>
  <p className="text-gray-400">Descrição</p>
</div>
```

### Primary CTA Button

```tsx
<button
  onClick={handler}
  className="w-full px-6 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all duration-300 shadow-glow-blue disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
>
  Ação Principal
</button>
```

### Ghost / Secondary Button

```tsx
<button
  onClick={handler}
  className="px-4 py-2 text-cyan-400 border border-cyan-400/50 rounded-lg hover:bg-cyan-400/10 transition-all duration-200"
>
  Ação Secundária
</button>
```

### Danger Button

```tsx
<button
  onClick={handler}
  className="px-4 py-2 text-red-400 border border-red-400/50 rounded-lg hover:bg-red-400/10 transition-all duration-200"
>
  Deletar
</button>
```

### Text Input

```tsx
<input
  type="text"
  placeholder="Placeholder"
  className="w-full px-4 py-2 text-white bg-transparent border-b-2 border-cyan-400 focus:outline-none focus:border-cyan-300 focus:shadow-glow-blue-sm transition-all"
/>
```

### Status Badge

```tsx
// Completed
<span className="px-2 py-0.5 text-xs font-bold rounded-full bg-green-900/50 text-green-300 border border-green-500/30">
  Concluído
</span>

// Missed
<span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-900/50 text-red-300 border border-red-500/30">
  Perdido
</span>

// Pending
<span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-700/50 text-gray-400 border border-slate-600/30">
  Pendente
</span>
```

---

## Animation Conventions

Use Tailwind utilities for animations. Avoid raw CSS unless strictly necessary.

| Effect              | Class                                          |
|---------------------|------------------------------------------------|
| Fade in on mount    | `animate-fade-in`                              |
| Pulse (loading)     | `animate-pulse`                                |
| Hover lift          | `hover:-translate-y-1 transition-transform`    |
| Hover glow          | `hover:shadow-glow-blue transition-shadow`     |
| Smooth color change | `transition-colors duration-200`               |
| Scale on click      | `active:scale-95 transition-transform`         |

---

## Layout Patterns

### Full-page centered layout (used in auth/onboarding pages)

```tsx
<div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
  {/* Content */}
</div>
```

### Dashboard grid (2-column on desktop)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Cards */}
</div>
```

---

## File Structure Conventions

When creating new UI components, follow this structure:

```
src/
  components/
    screen/       # Full-screen views (composed of sub-components)
    modal/        # Modal overlays
    icons/        # SVG icon components
    form/         # Form-specific UI elements
    menu/         # Navigation and menu elements
    states/       # Empty/loading/error state components
```

- **Screens** (`*Screen.tsx`) are full-page compositions used by Pages.
- **Pages** (`src/pages/*Page.tsx`) handle routing, state fetching, and business logic only.
- **Components** are purely presentational and receive all data via props.

---

## Do's and Don'ts

### Do ✅
- Use `backdrop-blur-md` on overlapping panels for depth
- Add `transition-all duration-300` to interactive elements
- Use semantic HTML (`<button>`, `<label>`, `<section>`, `<article>`)
- Define components **outside** the parent component render function
- Use `text-center` for headings in centered layouts

### Don't ❌
- Define React components inside another component's function body (anti-pattern, causes re-renders)
- Use hardcoded hex colors (e.g., `style={{ color: '#06b6d4' }}`) when a Tailwind class exists
- Mix `style={{}}` props with Tailwind classes unless absolutely necessary (e.g., dynamic values)
- Create new icon components — reuse existing ones in `src/components/icons/`
- Add Tailwind classes not already in use without first checking `tailwind.config.ts` for custom tokens

---

## Accessibility Checklist

Before finalizing a new component:
- [ ] All buttons have descriptive `aria-label` if they lack visible text
- [ ] Color contrast meets WCAG AA (cyan-400 on slate-950 passes)
- [ ] Focus states are visible (`focus:outline-none focus:ring-2 focus:ring-cyan-400`)
- [ ] Interactive elements are keyboard-navigable
- [ ] Images have `alt` attributes
