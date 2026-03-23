# Plano: Tela de Bloqueio Pré-Estudo + Menu Global

## Escopo

1. **Lock screen pré-estudo:** quando nenhum ping foi ainda recebido (cadastro no dia anterior), exibir sobreposição bloqueante na aba "Início" com data/hora do primeiro ping e countdown regressivo.
2. **Menu superior global:** mover o hambúrguer + `ProfileMenu` para fora de `HomeTab`, presente em todas as abas, com click-outside funcionando corretamente.

---

## Análise do Código Atual

### Problema 1 — Lock Screen
- `studyStartDate` no `GameState` é um ISO string da data de cadastro.
- `getJourneyStartDate(studyStartDate)` em `timeUtils.ts` retorna `Date` com hora 9h correta (sem ajuste necessário).
- **Condição de bloqueio:** `new Date() < firstPingDate` — onde `firstPingDate` é o retorno de `getJourneyStartDate`.
- `isBeforeStudyStart` deve ser um **state** atualizado dentro do `evaluateSchedule` (que roda a cada 5s), **não** um `useMemo`. Se fosse `useMemo`, só recalcularia quando `studyStartDate` mudasse — o overlay nunca desapareceria automaticamente às 9h.

### Problema 2 — Menu Global
- `profileMenuRef` está declarado em `DashboardPage` mas **não é passado** para o elemento que contém o botão hambúrguer (que está em `HomeTab`). O click-outside detecta cliques em `DashboardPage` mas nunca encontra o botão — menu nunca fecha ao clicar fora.
- Solução: mover botão + `ProfileMenu` para `DashboardPage`, num `<div ref={profileMenuRef}>` fixo acima da área scrollável. Assim o listener já existente (linha 213–224) funciona sem alteração.

---

## Arquivos a Modificar

| # | Arquivo | Ação |
|---|---------|------|
| 1 | `src/pages/DashboardPage.tsx` | Adicionar `isBeforeStudyStart` state + `firstPingDate`; mover menu global; remover 9 props de menu do `<HomeTab>`; passar `isBeforeStudyStart` e `firstPingDate` |
| 2 | `src/components/tabs/HomeTab.tsx` | Remover `MenuIcon`, `ProfileMenu`, `menuRef` e 9 props de menu; adicionar `isBeforeStudyStart` + `firstPingDate`; adicionar `PreStudyLock` com countdown |

> `ProfileMenu.tsx` — sem alterações.

### Props removidas de HomeTab (9 ao total)
`isProfileMenuOpen`, `onToggleProfileMenu`, `onCloseProfileMenu`, `onUpload`, `onRemove`, `onViewRcle`, `onViewPerformance`, `onViewData`, `onDownloadReport`

---

## Detalhamento

### DashboardPage.tsx

**A. Novos states:**
```ts
const [isBeforeStudyStart, setIsBeforeStudyStart] = useState(false);
const [firstPingDate, setFirstPingDate] = useState<Date | null>(null);
```

**B. Atualizar dentro de `evaluateSchedule` (antes de qualquer return):**
```ts
const fp = getJourneyStartDate(participante.studyStartDate);
setFirstPingDate(fp);
setIsBeforeStudyStart(new Date() < fp);
```

**C. Barra de menu global (acima do scroll, dentro do `profileMenuRef`):**
```tsx
<div ref={profileMenuRef} className="relative flex-shrink-0 px-4 pt-3 pb-1 flex items-center">
  <button onClick={() => setIsProfileMenuOpen(prev => !prev)} aria-label="Menu">
    <MenuIcon />
  </button>
  {isProfileMenuOpen && (
    <ProfileMenu onUpload={...} onRemove={...} ... />
  )}
</div>
```

**D. Remover as 9 props de menu do `<HomeTab>`; adicionar:**
```tsx
isBeforeStudyStart={isBeforeStudyStart}
firstPingDate={firstPingDate}
```

---

### HomeTab.tsx

**A. Remover:**
- Import de `ProfileMenu`
- `MenuIcon` (constante local)
- `menuRef` (useRef)
- 9 props do tipo `Props` + destructuring
- Bloco JSX do menu (linhas 111–135)

**B. Adicionar ao tipo `Props`:**
```ts
isBeforeStudyStart: boolean;
firstPingDate: Date | null;
```

**C. Componente `PreStudyLock` com countdown:**
```tsx
const PreStudyLock: React.FC<{ firstPingDate: Date }> = ({ firstPingDate }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = firstPingDate.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("00:00:00"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [firstPingDate]);

  // Texto dinâmico: "hoje" se for o mesmo dia, "amanhã" se for dia seguinte
  const isToday = firstPingDate.toDateString() === new Date().toDateString();
  const dayLabel = isToday ? "hoje" : "amanhã";
  const dateStr = firstPingDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6
                    rounded-2xl backdrop-blur-sm overflow-hidden"
         style={{ background: "rgba(5,10,25,0.88)", border: "1px solid rgba(34,211,238,0.15)" }}>
      <span className="text-4xl mb-4">🌌</span>
      <h2 className="text-lg font-bold text-white text-center mb-1">
        Sua aventura começa {dayLabel}
      </h2>
      <p className="text-cyan-400 font-semibold text-center mb-3 capitalize">{dateStr}</p>
      <p className="text-3xl font-mono font-bold text-white mb-2">{timeLeft}</p>
      <p className="text-[12px] text-slate-400 text-center">
        Seu primeiro ping chegará às 9h. Prepare-se, explorador.
      </p>
    </div>
  );
};
```

**D. Wrapper com `position: relative` e `overflow: hidden` enquanto bloqueado:**
```tsx
<div className={`relative min-h-full px-4 pt-6 pb-4 flex flex-col items-center ${isBeforeStudyStart ? "overflow-hidden" : ""}`}>
  {isBeforeStudyStart && firstPingDate && <PreStudyLock firstPingDate={firstPingDate} />}
  {/* conteúdo normal */}
</div>
```

---

## Checklist de Verificação

- [ ] Menu hambúrguer aparece em **todas as abas**
- [ ] Menu fecha ao clicar **fora** em todas as abas (click-outside já conectado)
- [ ] Overlay aparece apenas quando `new Date() < firstPingDate`
- [ ] Countdown decrementando a cada 1s
- [ ] Texto "hoje" ou "amanhã" dinâmico conforme hora do cadastro
- [ ] Às 9h do primeiro ping, overlay some automaticamente (via `evaluateSchedule`)
- [ ] Scroll bloqueado durante overlay (`overflow-hidden`)
- [ ] TypeScript sem erros nas 9 props removidas de `HomeTab`

---

*Revisado: Março 2026*
