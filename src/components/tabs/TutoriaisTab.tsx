import React, { useState, useRef } from "react";
import { PA_DICT, NA_DICT, EmotionEntry } from "@/src/constants/panasDict";

// ── Extensão de imagem ────────────────────────────────────────────────────────
const JPEG_STEPS = new Set([8, 9, 10, 11]);
function imgSrc(n: number) {
  return `/tutorial/screen-time/tela_${n}.${JPEG_STEPS.has(n) ? "jpeg" : "png"}`;
}

// ── Dados dos 12 passos ───────────────────────────────────────────────────────
const CAROUSEL_STEPS = [
  { n: 1, color: "#22d3ee", phase: 0, title: "Acesse o botão", caption: 'Na aba inicial, toque em "Lançar Tempo de Tela".' },
  { n: 2, color: "#22d3ee", phase: 0, title: "Leia o aviso", caption: "O modal explica o registro. Cada envio desbloqueia um novo dia." },
  { n: 3, color: "#22d3ee", phase: 0, title: "Adicionar rede", caption: 'Toque em "Adicionar Nova Rede Social" para começar.' },
  { n: 4, color: "#a78bfa", phase: 1, title: "Card de rede", caption: "Um card aparece. Clique nele para configurar o aplicativo." },
  { n: 5, color: "#a78bfa", phase: 1, title: "Escolha o app", caption: "Selecione TikTok, Instagram Reels ou YouTube Shorts." },
  { n: 6, color: "#a78bfa", phase: 1, title: "Digite o tempo", caption: "Informe quantos minutos você usou esse app hoje." },
  { n: 7, color: "#a78bfa", phase: 1, title: "Total no topo", caption: "A soma total aparece no topo — confira antes de confirmar." },
  { n: 8, color: "#fb923c", phase: 2, title: "Configurações", caption: 'Abra as "Configurações" do seu celular.' },
  { n: 9, color: "#fb923c", phase: 2, title: "Bem-estar digital", caption: '"Bem-estar digital" (Android) ou "Tempo de Tela" (iOS).' },
  { n: 11, color: "#fb923c", phase: 2, title: "Toque no gráfico", caption: "Toque no gráfico de barras para ver o detalhe por app." },
  { n: 10, color: "#fb923c", phase: 2, title: "Tempo exato", caption: "Veja o tempo real de cada app. Anote esse número." },
  { n: 12, color: "#fb923c", phase: 2, title: "Preencha com precisão", caption: "Volte ao app e registre o valor exato que consultou." },
];

const PHASE_LABELS = [
  { label: "Abrindo o formulário", color: "#22d3ee" },
  { label: "Adicionando suas redes", color: "#a78bfa" },
  { label: "Encontrando o dado real", color: "#fb923c" },
];

// ── Lightbox ──────────────────────────────────────────────────────────────────
const Lightbox: React.FC<{
  stepIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}> = ({ stepIndex, onClose, onPrev, onNext }) => {
  const step = CAROUSEL_STEPS[stepIndex];
  const touchStart = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStart.current - e.changedTouches[0].clientX;
    if (delta > 40 && stepIndex < CAROUSEL_STEPS.length - 1) onNext();
    if (delta < -40 && stepIndex > 0) onPrev();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Fechar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full text-white/70 hover:text-white"
        style={{ background: "rgba(255,255,255,0.1)" }}
      >
        ✕
      </button>

      {/* Seta esquerda */}
      {stepIndex > 0 && (
        <button
          onClick={e => { e.stopPropagation(); onPrev(); }}
          className="absolute left-3 z-10 p-3 rounded-full text-white/60 hover:text-white"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          ‹
        </button>
      )}

      {/* Imagem */}
      <div
        className="flex flex-col items-center gap-3 px-12"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={imgSrc(step.n)}
          alt={step.title}
          className="rounded-2xl object-contain shadow-2xl"
          style={{ maxHeight: "calc(100dvh - 140px)", maxWidth: "min(340px, calc(100vw - 96px))" }}
        />
        <div className="text-center">
          <p className="text-sm font-bold mb-0.5" style={{ color: step.color }}>{step.title}</p>
          <p className="text-xs text-white/55 max-w-xs">{step.caption}</p>
        </div>
        <p className="text-xs text-white/30">{step.n} / {CAROUSEL_STEPS.length}</p>
      </div>

      {/* Seta direita */}
      {stepIndex < CAROUSEL_STEPS.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNext(); }}
          className="absolute right-3 z-10 p-3 rounded-full text-white/60 hover:text-white"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          ›
        </button>
      )}
    </div>
  );
};

// ── Tutorial Carousel ─────────────────────────────────────────────────────────
const TutorialCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStart = useRef(0);

  const step = CAROUSEL_STEPS[current];
  const phase = PHASE_LABELS[step.phase];
  const progress = ((current + 1) / CAROUSEL_STEPS.length) * 100;

  const prev = () => setCurrent(c => Math.max(0, c - 1));
  const next = () => setCurrent(c => Math.min(CAROUSEL_STEPS.length - 1, c + 1));

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStart.current - e.changedTouches[0].clientX;
    if (delta > 40) next();
    if (delta < -40) prev();
  };

  return (
    <div className="space-y-3">
      {/* Fase atual */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: phase.color }}>
          {phase.label}
        </span>
        <span className="text-[10px] text-slate-500">{current + 1} / {CAROUSEL_STEPS.length}</span>
      </div>

      {/* Barra de progresso */}
      <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, background: step.color }}
        />
      </div>

      {/* Imagem — clicável para ampliar */}
      <button
        className="w-full flex justify-center focus:outline-none"
        onClick={() => setLightboxIndex(current)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-label={`Ampliar tela ${step.n}`}
      >
        <div className="relative">
          <img
            src={imgSrc(step.n)}
            alt={step.title}
            className="rounded-2xl object-contain"
            style={{
              maxHeight: "18rem",
              maxWidth: "100%",
              border: `1px solid ${step.color}35`,
              boxShadow: `0 4px 20px ${step.color}20`,
            }}
          />
          {/* Hint de zoom */}
          <div
            className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
            style={{ background: "rgba(0,0,0,0.55)" }}
          >
            🔍 toque para ampliar
          </div>
        </div>
      </button>

      {/* Título e caption */}
      <div>
        <p className="text-sm font-bold mb-0.5" style={{ color: step.color }}>{step.title}</p>
        <p className="text-xs text-slate-400 leading-relaxed">{step.caption}</p>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-2">
        <button
          onClick={prev}
          disabled={current === 0}
          className="flex-1 py-2 rounded-lg text-xs font-bold transition-opacity disabled:opacity-30"
          style={{ background: "rgba(34,211,238,0.1)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.2)" }}
        >
          ← Anterior
        </button>
        <button
          onClick={next}
          disabled={current === CAROUSEL_STEPS.length - 1}
          className="flex-1 py-2 rounded-lg text-xs font-bold transition-opacity disabled:opacity-30"
          style={{ background: "rgba(34,211,238,0.15)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.3)" }}
        >
          Próximo →
        </button>
      </div>

      {/* Dots por fase */}
      <div className="flex justify-center gap-1.5 pt-1">
        {CAROUSEL_STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === current ? 16 : 6,
              height: 6,
              background: i === current ? s.color : "rgba(100,116,139,0.35)",
            }}
            aria-label={`Ir para passo ${s.n}`}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          stepIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex(i => (i !== null && i > 0 ? i - 1 : i))}
          onNext={() => setLightboxIndex(i => (i !== null && i < CAROUSEL_STEPS.length - 1 ? i + 1 : i))}
        />
      )}
    </div>
  );
};

// ── Accordion primitivo ───────────────────────────────────────────────────────
const Accordion: React.FC<{
  title: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, icon, isOpen, onToggle, children }) => (
  <div
    className="rounded-xl overflow-hidden"
    style={{ border: "1px solid rgba(34,211,238,0.18)" }}
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-4 text-left transition-colors duration-200"
      style={{ background: isOpen ? "rgba(34,211,238,0.08)" : "rgba(15,23,42,0.6)" }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-bold text-cyan-300 tracking-wide">{title}</span>
      </div>
      <span
        className="text-cyan-400 font-bold text-lg transition-transform duration-300"
        style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
      >
        +
      </span>
    </button>

    <div
      style={{
        display: "grid",
        gridTemplateRows: isOpen ? "1fr" : "0fr",
        transition: "grid-template-rows 320ms ease",
      }}
    >
      <div style={{ overflow: "hidden" }}>
        <div className="px-4 pb-5 pt-3">{children}</div>
      </div>
    </div>
  </div>
);

// ── Componente de imagem SAM ──────────────────────────────────────────────────
const SamPreview: React.FC<{ dimension: "valencia" | "ativacao" | "dominancia"; value: number }> = ({ dimension, value }) => (
  <img
    src={`/${dimension}_${value}.png`}
    alt={`${dimension} nível ${value}`}
    className="w-20 h-20 object-contain"
  />
);

// ── Card de dimensão SAM ──────────────────────────────────────────────────────
const SamDimensionCard: React.FC<{
  title: string;
  dimension: "valencia" | "ativacao" | "dominancia";
  lowLabel: string;
  highLabel: string;
  color: string;
  desc: string;
}> = ({ title, dimension, lowLabel, highLabel, color, desc }) => (
  <div className="rounded-xl p-4" style={{ background: "rgba(15,23,42,0.7)", border: `1px solid ${color}30` }}>
    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color }}>{title}</p>
    <div className="flex items-end justify-around gap-1 mb-3">
      <div className="flex flex-col items-center gap-1.5">
        <SamPreview dimension={dimension} value={1} />
        <span className="text-xs text-slate-400 font-medium">{lowLabel}</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <SamPreview dimension={dimension} value={5} />
        <span className="text-xs text-slate-400 font-medium">Neutro</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <SamPreview dimension={dimension} value={9} />
        <span className="text-xs text-slate-400 font-medium">{highLabel}</span>
      </div>
    </div>
    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

// ── Linha de emoção no dicionário ─────────────────────────────────────────────
const EmotionRow: React.FC<{ entry: EmotionEntry; accentColor: string; oppositeColor: string }> = ({ entry, accentColor, oppositeColor }) => (
  <div
    className="grid gap-x-2 py-2 border-b last:border-0"
    style={{
      gridTemplateColumns: "1fr 2fr auto auto",
      borderColor: "rgba(100,116,139,0.15)",
    }}
  >
    <span className="text-xs font-bold" style={{ color: accentColor }}>{entry.word}</span>
    <span className="text-[11px] text-slate-400 leading-snug">{entry.context}</span>
    <span className="text-[10px] text-slate-500 text-center whitespace-nowrap">{entry.arousal}</span>
    <span className="text-[10px] font-semibold text-right whitespace-nowrap" style={{ color: oppositeColor }}>{entry.opposite}</span>
  </div>
);

// ── Dicionário de emoções PANAS ────────────────────────────────────────────────
const PanasDictionary: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(100,116,139,0.2)" }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
        style={{ background: "rgba(15,23,42,0.5)" }}
      >
        <span className="text-xs font-bold text-slate-300">📖 Ver guia das emoções</span>
        <span
          className="text-slate-500 text-sm font-bold transition-transform duration-300"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0)" }}
        >+</span>
      </button>

      {/* grid-template-rows para não desmontar o conteúdo */}
      <div style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 320ms ease",
      }}>
        <div style={{ overflow: "hidden" }}>
          <div className="px-3 pb-3 pt-2 space-y-3">
            {/* Cabeçalho da tabela */}
            <div
              className="grid gap-x-2 pb-1 border-b"
              style={{ gridTemplateColumns: "1fr 2fr auto auto", borderColor: "rgba(100,116,139,0.3)" }}
            >
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Emoção</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Contexto</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 text-center">Ativação</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Oposta</span>
            </div>

            {/* PA */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-400 mb-1">🔵 Afetos Positivos</p>
              {PA_DICT.map(e => <EmotionRow key={e.word} entry={e} accentColor="#22d3ee" oppositeColor="#f472b6" />)}
            </div>

            {/* NA */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-pink-400 mb-1">🔴 Afetos Negativos</p>
              {NA_DICT.map(e => <EmotionRow key={e.word} entry={e} accentColor="#f472b6" oppositeColor="#22d3ee" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── FAQ item ──────────────────────────────────────────────────────────────────
const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-0" style={{ borderColor: "rgba(34,211,238,0.1)" }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left py-3 flex items-start justify-between gap-3"
      >
        <span className="text-xs font-semibold text-cyan-200">{q}</span>
        <span
          className="text-cyan-500 flex-shrink-0 text-sm font-bold transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0)" }}
        >
          +
        </span>
      </button>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 250ms ease" }}>
        <div style={{ overflow: "hidden" }}>
          <p className="text-xs text-slate-400 leading-relaxed pb-3">{a}</p>
        </div>
      </div>
    </div>
  );
};

// ── Pill de fluxo ─────────────────────────────────────────────────────────────
const FlowPill: React.FC<{ label: string; sub?: string; color?: string }> = ({ label, sub, color = "#22d3ee" }) => (
  <div className="flex flex-col items-center gap-0.5">
    <div
      className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-900 text-center"
      style={{ background: color, whiteSpace: "nowrap" }}
    >
      {label}
    </div>
    {sub && <span className="text-[10px] text-slate-500">{sub}</span>}
  </div>
);

const FlowArrow = () => (
  <span className="text-slate-600 text-lg font-bold flex-shrink-0">→</span>
);

// ── Card de etapa (onboarding) ────────────────────────────────────────────────
const StepCard: React.FC<{ step: number; title: string; desc: string; isLast?: boolean }> = ({ step, title, desc, isLast }) => (
  <div className="flex items-start gap-2">
    <div className="flex flex-col items-center">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-slate-900 flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #22d3ee, #818cf8)" }}
      >
        {step}
      </div>
      {!isLast && <div className="w-0.5 flex-1 mt-1" style={{ background: "rgba(34,211,238,0.2)", minHeight: "2rem" }} />}
    </div>
    <div className="pb-4">
      <p className="text-sm font-semibold text-cyan-200 mb-0.5">{title}</p>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────
export const TutoriaisTab: React.FC = () => {
  const [openSection, setOpenSection] = useState<number | null>(null);
  const toggle = (idx: number) => setOpenSection(prev => prev === idx ? null : idx);

  return (
    <div className="px-4 pt-6 pb-4 space-y-3">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-cyan-300 tracking-wide">📖 Guia do Explorador</h2>
        <p className="text-xs text-slate-400 mt-1">Tudo o que você precisa saber para navegar a jornada.</p>
      </div>

      {/* ── 1: O SAM ── */}
      <Accordion icon="🎭" title="O Formulário SAM" isOpen={openSection === 0} onToggle={() => toggle(0)}>
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            O <strong className="text-cyan-300">SAM (Self-Assessment Manikin)</strong> é um instrumento visual para medir como você está se sentindo agora em 3 dimensões. Cada escala vai de 1 a 9.
          </p>
          <div className="space-y-3">
            <SamDimensionCard
              title="Valência — Prazer"
              dimension="valencia"
              lowLabel="Desprazer"
              highLabel="Prazer"
              color="#22d3ee"
              desc="Mede o quão agradável ou desagradável você está se sentindo. 1 = muito mal, 9 = muito bem."
            />
            <SamDimensionCard
              title="Ativação — Alerta"
              dimension="ativacao"
              lowLabel="Calmo"
              highLabel="Agitado"
              color="#818cf8"
              desc="Mede o seu nível de energia e agitação. 1 = sonolento/relaxado, 9 = energizado/excitado."
            />
            <SamDimensionCard
              title="Dominância — Controle"
              dimension="dominancia"
              lowLabel="Sem controle"
              highLabel="No controle"
              color="#f472b6"
              desc="Mede o quanto você sente que está no controle da situação. 1 = controlado pelos eventos, 9 = no comando."
            />
          </div>
          <div
            className="rounded-lg p-3 flex gap-2"
            style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.2)" }}
          >
            <span className="text-base">💡</span>
            <p className="text-xs text-cyan-200 leading-relaxed">
              <strong>Dica:</strong> não pense muito — responda com o que sente <em>agora</em>, no momento exato. A primeira impressão é a mais precisa.
            </p>
          </div>
        </div>
      </Accordion>

      {/* ── 2: O PANAS ── */}
      <Accordion icon="💬" title="O Formulário PANAS" isOpen={openSection === 1} onToggle={() => toggle(1)}>
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            O <strong className="text-cyan-300">PANAS</strong> avalia a intensidade de 20 estados emocionais — 10 positivos e 10 negativos — que você sentiu ao longo do dia.
          </p>
          <div className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(129,140,248,0.2)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-2">Escala de resposta</p>
            <div className="flex justify-between gap-1">
              {[
                { v: 1, label: "Nada" },
                { v: 2, label: "Um pouco" },
                { v: 3, label: "Moderado" },
                { v: 4, label: "Bastante" },
                { v: 5, label: "Extremamente" },
              ].map(({ v, label }) => (
                <div key={v} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="w-full flex items-center justify-center rounded-lg py-1.5 text-xs font-bold text-slate-900"
                    style={{ background: `rgba(129,140,248,${0.3 + v * 0.14})` }}
                  >
                    {v}
                  </div>
                  <span className="text-[9px] text-slate-500 text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(34,211,238,0.2)" }}>
              <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1.5">Pings diurnos</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Das 9h às 19h, você avalia como está sentindo <em>naquele momento</em>.
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(244,114,182,0.2)" }}>
              <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-1.5">Ping das 21h ⭐</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Avalia o dia <em>inteiro</em> — como você se sentiu desde que acordou. Vale mais XP.
              </p>
            </div>
          </div>
          <PanasDictionary />
          <div
            className="rounded-lg p-3 flex gap-2"
            style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.2)" }}
          >
            <span className="text-base">💡</span>
            <p className="text-xs text-cyan-200 leading-relaxed">
              Tente ser honesto sobre o que sentiu — não há respostas certas ou erradas. Os dados só têm valor científico se refletirem sua experiência real.
            </p>
          </div>
        </div>
      </Accordion>

      {/* ── 3: Tempo de Tela ── */}
      <Accordion icon="📱" title="Registro de Tempo de Tela" isOpen={openSection === 2} onToggle={() => toggle(2)}>
        <div className="space-y-3">
          <p className="text-xs text-slate-400 leading-relaxed">
            Todo dia, registre quantos minutos você usou TikTok, Reels, Shorts e similares. Siga as telas abaixo — toque em qualquer imagem para ampliar.
          </p>
          <TutorialCarousel />
        </div>
      </Accordion>

      {/* ── 4: Fluxo Diário ── */}
      <Accordion icon="🗓️" title="Fluxo Diário" isOpen={openSection === 3} onToggle={() => toggle(3)}>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 mb-2">Pings das 9h às 19h</p>
            <div className="flex flex-wrap items-center gap-2">
              <FlowPill label="🔔 Notificação" sub="a cada ~2h" />
              <FlowArrow />
              <FlowPill label="SAM" sub="~1 min" color="#818cf8" />
              <FlowArrow />
              <FlowPill label="PANAS" sub="~3 min" color="#a78bfa" />
              <FlowArrow />
              <FlowPill label="✅ XP ganho" color="#4ade80" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-pink-500 mb-2">Ping das 21h — Estrela ⭐</p>
            <div className="flex flex-wrap items-center gap-2">
              <FlowPill label="🔔 21h" />
              <FlowArrow />
              <FlowPill label="SAM + PANAS" sub="dia inteiro" color="#f472b6" />
              <FlowArrow />
              <FlowPill label="Tempo de Tela" sub="plataformas" color="#f97316" />
              <FlowArrow />
              <FlowPill label="⭐ XP bônus" color="#fbbf24" />
            </div>
          </div>
          <div
            className="rounded-lg p-3"
            style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(34,211,238,0.15)" }}
          >
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2">Janela de resposta</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cada ping fica disponível por <strong className="text-slate-300">25 minutos</strong> — 5 minutos antes do horário marcado e 20 minutos depois. Após esse tempo, ele é marcado como perdido. O sino na tela avisa enquanto o ping está ativo.
            </p>
          </div>
          <div
            className="rounded-lg p-3 flex gap-3"
            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.35)" }}
          >
            <span className="text-xl flex-shrink-0">⏰</span>
            <div>
              <p className="text-xs font-bold text-yellow-300 mb-1">Dica: crie 3 alarmes no seu celular</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                As notificações podem passar despercebidas. Para garantir o mínimo de <strong className="text-slate-300">21 pings em 7 dias</strong>, responda ao menos <strong className="text-slate-300">3 por dia</strong>. Configure alarmes fixos — por exemplo às <strong className="text-slate-300">11h, 15h e 19h</strong>.
              </p>
            </div>
          </div>
        </div>
      </Accordion>

      {/* ── 5: FAQ ── */}
      <Accordion icon="❓" title="Dúvidas Frequentes" isOpen={openSection === 4} onToggle={() => toggle(4)}>
        <div>
          <FaqItem
            q="Posso responder um ping com atraso?"
            a="Não. Cada ping fica disponível por 25 minutos (5 antes e 20 depois do horário marcado). Após isso, ele expira — isso é intencional para capturar o estado emocional do momento."
          />
          <FaqItem
            q="O que acontece se perder muitos pings?"
            a="Você perde XP e pode não atingir o mínimo de 21 pings para desbloquear o relatório final. O mínimo é 3 pings por dia durante os 7 dias. Crie alarmes fixos no celular (ex: 11h, 15h e 19h) para não perder a janela de 25 minutos."
          />
          <FaqItem
            q="Meus dados estão seguros?"
            a="Sim. Todos os dados são armazenados de forma segura e identificados apenas pelo seu apelido. Nome real, contatos ou outras informações pessoais não são coletados. Após o término do estudo, o único dado sensível (e-mail) será apagado, deixando você anônimo."
          />
          <FaqItem
            q="Por que preciso registrar o tempo de tela?"
            a="O consumo de vídeos curtos (TikTok, Reels, Shorts) é a variável principal do estudo — precisamos correlacioná-la com suas emoções. Você precisa registrar ao menos 3 dias para liberar seu relatório."
          />
          <FaqItem
            q="O que é o relatório final?"
            a="Após completar pelo menos 21 pings e 3 dias de registro de tela, um relatório com suas médias de bem-estar emocional (SAM, PANAS) e consumo de vídeos curtos é desbloqueado na aba Feitos."
          />
          <FaqItem
            q="Tenho uma dúvida que não está aqui — o que faço?"
            a="Entre em contato com a equipe pelo e-mail: thiagosfcarneiro@sempreceub.com ou dionne.correa@ceub.edu.br. Você também pode acessar o Termo de Consentimento no menu superior esquerdo → 'Ver termos'."
          />
        </div>
      </Accordion>

      {/* ── 6: Revisitar o Início ── */}
      <Accordion icon="🚀" title="Revisitar o Início" isOpen={openSection === 5} onToggle={() => toggle(5)}>
        <div className="space-y-0">
          <StepCard step={1} title="Crie seu Registro"
            desc="Na primeira tela, você preenche o RCLE — um formulário de perfil com dados sociodemográficos usados na pesquisa." />
          <StepCard step={2} title="Escolha seu Apelido"
            desc="Seu apelido identifica você no ranking social. Escolha algo que te represente — ele aparece para os outros participantes." />
          <StepCard step={3} title="Personalize seu Perfil"
            desc="Você pode enviar uma foto de avatar. O seu nível e XP ficam visíveis na tela inicial conforme você avança na jornada." />
          <StepCard step={4} title="Início da Jornada" isLast
            desc="Assim que o pesquisador liberar seu acesso, os pings começam a chegar. Cada ping respondido dá XP e cristais." />
        </div>
      </Accordion>

      {/* ── Botão landing page ── */}
      <a
        href="https://psylogos.lovable.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-opacity active:opacity-70"
        style={{
          background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(129,140,248,0.15))",
          border: "1px solid rgba(34,211,238,0.3)",
          color: "#22d3ee",
        }}
      >
        🌐 Acessar o site do Psylogos
      </a>
    </div>
  );
};
