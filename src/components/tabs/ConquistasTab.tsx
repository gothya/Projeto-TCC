import React from "react";
import { GameState } from "@/src/components/data/GameState";
import { REPORT_UNLOCK_THRESHOLD } from "@/src/utils/ReportGeneratorUtils";
import { StarIcon } from "@/src/components/icons/StarIcon";
import { CheckCircleIcon } from "@/src/components/icons/CheckCircleIcon";
import { XCircleIcon } from "@/src/components/icons/XCircleIcon";

const LockIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ReportIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

type Props = {
  participante: GameState;
  isReportAvailable: boolean;
  onOpenReport: () => void;
  screenTimeCount: number;
};

const ScreenTimeLocks: React.FC<{ screenTimeCount: number }> = ({ screenTimeCount }) => (
  <div className="flex items-center gap-2 mb-3">
    {[0, 1, 2].map((i) => {
      const unlocked = screenTimeCount > i;
      const daysLeft = Math.max(0, 3 - screenTimeCount);
      const tooltip = unlocked
        ? `Dia ${i + 1} de tempo de tela registrado ✓`
        : `Registre o tempo de tela por mais ${daysLeft} dia${daysLeft !== 1 ? "s" : ""} para liberar o relatório`;
      return (
        <div key={i} className="relative group">
          <span
            className="text-xl leading-none transition-all duration-300 cursor-default"
            style={unlocked
              ? { filter: "drop-shadow(0 0 5px rgba(34,211,238,0.9))" }
              : { opacity: 0.3 }
            }
          >
            {unlocked ? "🔓" : "🔒"}
          </span>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 text-[11px] text-white bg-slate-900 border border-slate-700 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg"
            style={{ minWidth: "max-content" }}>
            {tooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
          </div>
        </div>
      );
    })}
    <span className="text-[10px] text-slate-500 ml-1">
      {screenTimeCount >= 3 ? "Tempo de tela completo" : `${screenTimeCount}/3 dias registrados`}
    </span>
  </div>
);

export const ConquistasTab: React.FC<Props> = ({ participante, isReportAvailable, onOpenReport, screenTimeCount }) => {
  const pings = participante?.pings ?? [];
  const notificationTimes = ["9h", "11h", "13h", "15h", "17h", "19h", "21h"];

  const allStatuses = pings.flatMap(d => d.statuses);
  const completed = allStatuses.filter(s => s === "completed").length;

  const completedRegular = pings.flatMap(d => d.statuses)
    .filter((s, i) => (i + 1) % 7 !== 0 && s === "completed").length;
  const missedRegular = pings.flatMap(d => d.statuses)
    .filter((s, i) => (i + 1) % 7 !== 0 && s === "missed").length;
  const completedStars = pings.flatMap(d => d.statuses)
    .filter((s, i) => (i + 1) % 7 === 0 && s === "completed").length;

  // Progress toward fixed 24-ping threshold
  const unlockProgress = Math.min(100, (completed / REPORT_UNLOCK_THRESHOLD) * 100);
  const pingsToUnlock = Math.max(0, REPORT_UNLOCK_THRESHOLD - completed);

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">

      {/* Section: Resumo */}
      <section>
        <h2 className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.25em] mb-3">
          Resumo da Jornada
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: <CheckCircleIcon className="w-7 h-7 text-green-400" />,
              label: "Respondidos",
              value: completedRegular,
              total: 42,
              color: "text-green-400",
              border: "border-green-500/20",
            },
            {
              icon: <XCircleIcon className="w-7 h-7 text-red-400" />,
              label: "Perdidos",
              value: missedRegular,
              total: 42,
              color: "text-red-400",
              border: "border-red-500/20",
            },
            {
              icon: <StarIcon className="w-7 h-7 text-yellow-400" />,
              label: "Dias Completos",
              value: completedStars,
              total: 7,
              color: "text-yellow-400",
              border: "border-yellow-500/20",
            },
          ].map(({ icon, label, value, total, color, border }) => (
            <div
              key={label}
              className={`rounded-2xl p-3 flex flex-col items-center gap-1.5 border ${border}`}
              style={{ background: "rgba(15,23,42,0.7)", backdropFilter: "blur(8px)" }}
            >
              {icon}
              <p className={`text-xl font-bold ${color}`}>
                {value}
                <span className="text-xs font-normal text-slate-500">/{total}</span>
              </p>
              <p className="text-[10px] text-slate-400 text-center leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Relatório */}
      <section>
        <h2 className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.25em] mb-3">
          Meu Relatório
        </h2>

        <ScreenTimeLocks screenTimeCount={screenTimeCount} />

        {isReportAvailable ? (
          /* Desbloqueado */
          <button
            onClick={onOpenReport}
            className="w-full rounded-2xl p-5 flex items-center gap-4 text-left transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(34,211,238,0.05))",
              border: "1px solid rgba(34,211,238,0.4)",
              boxShadow: "0 0 24px rgba(34,211,238,0.12)",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-cyan-400"
              style={{ boxShadow: "0 0 16px rgba(34,211,238,0.5)" }}
            >
              <ReportIcon />
            </div>
            <div>
              <p className="font-bold text-white">Ver Meu Relatório</p>
              <p className="text-xs text-cyan-400/70 mt-0.5">
                Análise completa da sua jornada · {completed} pings respondidos
              </p>
            </div>
            <svg className="w-5 h-5 text-cyan-400 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          /* Bloqueado */
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(15,23,42,0.7)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-700 text-slate-400">
                <LockIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-300">Relatório Bloqueado</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Responda a pelo menos <strong className="text-slate-300">{REPORT_UNLOCK_THRESHOLD} pings</strong> para desbloquear seu relatório personalizado.
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[10px] mb-1.5">
                <span className="text-slate-400">Progresso para desbloqueio</span>
                <span className="text-slate-300 font-mono font-bold">{completed} / {REPORT_UNLOCK_THRESHOLD}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-700/60 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${unlockProgress}%`,
                    background: "linear-gradient(90deg, #475569, #94a3b8)",
                  }}
                />
              </div>
              {pingsToUnlock > 0 && (
                <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                  Faltam ~{pingsToUnlock} resposta{pingsToUnlock !== 1 ? "s" : ""} para desbloquear
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Section: Histórico de Pings */}
      <section>
        <h2 className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.25em] mb-3">
          Histórico de Pings
        </h2>
        <div
          className="rounded-2xl p-4"
          style={{
            background: "rgba(15,23,42,0.7)",
            border: "1px solid rgba(34,211,238,0.08)",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Header */}
          <div className="grid grid-cols-7 gap-y-2 text-center mb-3">
            {notificationTimes.map(t => (
              <span key={t} className="text-[9px] font-semibold text-cyan-400/60">{t}</span>
            ))}
          </div>

          {/* Days */}
          <div className="space-y-2">
            {pings.map((day, dayIdx) => (
              <div key={dayIdx} className="grid grid-cols-7 gap-1 items-center">
                {(day.statuses ?? []).map((status, pingIdx) => {
                  const isLast = pingIdx === 6;
                  return (
                    <div key={pingIdx} className="flex items-center justify-center h-6">
                      {isLast ? (
                        <StarIcon
                          className={`w-4 h-4 ${
                            status === "completed" ? "text-yellow-400" :
                            status === "missed"    ? "text-red-500/40" :
                                                     "text-slate-700"
                          }`}
                        />
                      ) : (
                        <div
                          className={`w-3.5 h-3.5 rounded-full ${
                            status === "completed" ? "bg-green-400" :
                            status === "missed"    ? "bg-red-500" :
                                                     "bg-slate-700"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-slate-700/40">
            {[
              { color: "bg-green-400", label: "Respondido" },
              { color: "bg-red-500",   label: "Perdido" },
              { color: "bg-slate-700", label: "Pendente" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-[10px] text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
