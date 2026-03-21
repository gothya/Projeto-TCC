import React, { useState } from "react";

// ── Accordion primitivo com animação grid-template-rows ──────────────────────
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

    {/* Animação correta: grid-template-rows 0fr → 1fr */}
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

// ── Componente de imagem SAM ─────────────────────────────────────────────────
const SamPreview: React.FC<{ dimension: "valencia" | "ativacao" | "dominancia"; value: number }> = ({ dimension, value }) => (
  <img
    src={`/${dimension}_${value}.png`}
    alt={`${dimension} nível ${value}`}
    className="w-20 h-20 object-contain"
  />
);

// ── Card de etapa (onboarding) ───────────────────────────────────────────────
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

// ── Card de dimensão SAM ─────────────────────────────────────────────────────
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

// ── FAQ item ─────────────────────────────────────────────────────────────────
const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-0" style={{ borderColor: "rgba(34,211,238,0.1)" }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left py-3 flex items-start justify-between gap-3"
      >
        <span className="text-xs font-semibold text-cyan-200">{q}</span>
        <span className="text-cyan-500 flex-shrink-0 text-sm font-bold transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0)" }}>
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

// ── Pill de fluxo ────────────────────────────────────────────────────────────
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

// ── Componente principal ─────────────────────────────────────────────────────
export const TutoriaisTab: React.FC = () => {
  const [openSection, setOpenSection] = useState<number | null>(0);

  const toggle = (idx: number) => setOpenSection(prev => prev === idx ? null : idx);

  return (
    <div className="px-4 pt-6 pb-4 space-y-3">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-cyan-300 tracking-wide">📖 Guia do Explorador</h2>
        <p className="text-xs text-slate-400 mt-1">Tudo o que você precisa saber para navegar a jornada.</p>
      </div>

      {/* ── Seção 1: Primeiros Passos ── */}
      <Accordion icon="🚀" title="Passo 1 — Primeiros Passos" isOpen={openSection === 0} onToggle={() => toggle(0)}>
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

      {/* ── Seção 2: O SAM ── */}
      <Accordion icon="🎭" title="Passo 2 — O Formulário SAM" isOpen={openSection === 1} onToggle={() => toggle(1)}>
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
              <strong>Dica:</strong> não pense muito — responda com o que sente <em>agora</em>, no momento exato. A primeira impressão é a mais precisa para esse instrumento.
            </p>
          </div>
        </div>
      </Accordion>

      {/* ── Seção 3: O PANAS ── */}
      <Accordion icon="💬" title="Passo 3 — O Formulário PANAS" isOpen={openSection === 2} onToggle={() => toggle(2)}>
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            O <strong className="text-cyan-300">PANAS</strong> avalia a intensidade de 20 estados emocionais — 10 positivos e 10 negativos — que você sentiu ao longo do dia.
          </p>

          {/* Escala visual 1-5 */}
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

          {/* Dois tipos de ping */}
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

      {/* ── Seção 4: Fluxo Diário ── */}
      <Accordion icon="🗓️" title="Passo 4 — Fluxo Diário" isOpen={openSection === 3} onToggle={() => toggle(3)}>
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
              Cada ping fica disponível por <strong className="text-slate-300">25 minutos</strong> — 5 minutos antes do horário marcado e 20 minutos depois. Após esse tempo, ele é marcado como perdido e não pode mais ser respondido. O sino na tela avisa enquanto o ping está ativo.
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
                As notificações do app podem passar despercebidas. Para garantir o mínimo de <strong className="text-slate-300">21 pings em 7 dias</strong>, você precisa responder ao menos <strong className="text-slate-300">3 por dia</strong>. Configure 3 alarmes fixos — por exemplo às <strong className="text-slate-300">10h, 14h e 18h</strong> — para lembrar de abrir o app e verificar se há um ping ativo.
              </p>
            </div>
          </div>

          <div
            className="rounded-lg p-3"
            style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(244,114,182,0.15)" }}
          >
            <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-2">Tempo de Tela</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              No botão <strong className="text-slate-300">"Lançar Tempo de Tela"</strong> na tela inicial, você registra quanto tempo usou TikTok, Reels, Shorts e outras plataformas de vídeos curtos no dia. Faça isso diariamente para liberar o relatório.
            </p>
          </div>
        </div>
      </Accordion>

      {/* ── Seção 5: Perguntas Frequentes ── */}
      <Accordion icon="❓" title="Dúvidas Frequentes" isOpen={openSection === 4} onToggle={() => toggle(4)}>
        <div>
          <FaqItem
            q="Posso responder um ping com atraso?"
            a="Não. Cada ping fica disponível por 25 minutos (5 antes e 20 depois do horário marcado). Após isso, ele expira — isso é intencional para capturar o estado emocional do momento."
          />
          <FaqItem
            q="O que acontece se perder muitos pings?"
            a="Você perde XP e pode não atingir o mínimo de 21 pings para desbloquear o relatório final. O mínimo é 3 pings por dia durante os 7 dias. Crie alarmes fixos no celular (ex: 10h, 14h e 18h) para não perder a janela de 25 minutos."
          />
          <FaqItem
            q="Meus dados estão seguros?"
            a="Sim. Todos os dados são armazenados de forma segura em um banco de dados e identificados apenas pelo seu apelido. O nome real, contatos ou outras informações pessoais não são coletados pelo app. Após o término do estudo, o único dados sensível (e-mail) que permite sua jornada no app, será apagado do banco de dados, deixando você anônimo."
          />
          <FaqItem
            q="Por que preciso registrar o tempo de tela?"
            a="O consumo de vídeos curtos (TikTok, Reels, Shorts) é a chamada 'variável independente' do estudo, ou seja, informação principal que precisamos ter pra correlacionar com suas emoções. Você precisa registrar ao menos 3 dias de tempo de tela para liberar seu relatório de jornada."
          />
          <FaqItem
            q="O que é o relatório final?"
            a="Após completar pelo menos 21 pings e 3 dias de registro de tela, um relatório com suas médias de bem-estar emocional (SAM, PANAS) e consumo de vídeos curtos é desbloqueado na aba Feitos. DICA: Aproveite o ping de final de dia (às 21h) para registrar o tempo de tela do dia inteiro."
          />
          <FaqItem
            q="Tenho alguma dúvida que não está aqui — o que faço?"
            a="Entre em contato com a equipe de pesquisa pelo e-mail: thiagosfcarneiro@sempreceub.com ou dionne.correa@ceub.edu.br. 
            Também informado no Termo de Consentimento que você assinou antes de começar o estudo. É possível acessá-lo clicando no menu superior esquerdo e em seguida clicar em 'ver termos'"
          />
        </div>
      </Accordion>
    </div>
  );
};
