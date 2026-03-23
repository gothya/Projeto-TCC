import React, { useEffect, useState } from "react";
import { GameState } from "@/src/components/data/GameState";
import { CountdownTimer } from "@/src/components/CountdownTimer";
import { StarIcon } from "@/src/components/icons/StarIcon";
import { UserIcon } from "@/src/components/icons/UserIcon";


const LEVEL_TITLES = [
  "Mente Curiosa", "Explorador", "Observador", "Investigador",
  "Analista", "Decifrador", "Estrategista", "Visionário",
  "Mestre", "Sábio", "Lenda",
];

const CrystalIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg viewBox="0 0 18 22" width="18" height="22" style={{ overflow: "visible" }}>
    <polygon
      points="9,1 17,6 17,16 9,21 1,16 1,6"
      fill={filled ? "rgba(34,211,238,0.12)" : "rgba(15,23,42,0.8)"}
      stroke={filled ? "#22d3ee" : "#1e293b"}
      strokeWidth="1.5"
      style={filled ? { filter: "drop-shadow(0 0 5px rgba(34,211,238,0.75))" } : {}}
    />
    {filled && (
      <>
        <polygon points="9,5 14,8 14,14 9,17 4,14 4,8" fill="rgba(34,211,238,0.28)" />
        <circle cx="9" cy="11" r="2" fill="#22d3ee" style={{ filter: "drop-shadow(0 0 4px #22d3ee)" }} />
      </>
    )}
  </svg>
);

// ── Tela de bloqueio pré-estudo ───────────────────────────────────────────────
const PreStudyLock: React.FC<{ firstPingDate: Date }> = ({ firstPingDate }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = firstPingDate.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("00:00:00"); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [firstPingDate]);

  const isToday = firstPingDate.toDateString() === new Date().toDateString();
  const dayLabel = isToday ? "hoje" : "amanhã";
  const dateStr = firstPingDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 rounded-2xl backdrop-blur-sm overflow-hidden"
      style={{ background: "rgba(5,10,25,0.88)", border: "1px solid rgba(34,211,238,0.15)" }}
    >
      <span className="text-5xl mb-5">🌌</span>
      <h2 className="text-lg font-bold text-white text-center mb-1">
        Sua aventura começa {dayLabel}
      </h2>
      <p className="text-cyan-400 font-semibold text-center mb-5 capitalize">{dateStr}</p>
      <p className="text-4xl font-mono font-bold text-white tracking-widest mb-3">{timeLeft}</p>
      <p className="text-xs text-slate-400 text-center leading-relaxed">
        Seu primeiro ping chegará às 9h.<br />Prepare-se, explorador.
      </p>
    </div>
  );
};

type Props = {
  participante: GameState;
  highlightedPing: { day: number; ping: number } | null;
  timerTargetDate: Date | null;
  timerLabel: string;
  isActiveWindow: boolean;
  onTimerEnd: () => void;
  onLogout: () => void;
  isReportAvailable: boolean;
  onOpenScreenTime: () => void;
  screenTimeCount: number;
  screenTimeToday: boolean;
  onNavigateToTutorial?: () => void;
  hasSeenTutorial?: boolean;
  isBeforeStudyStart: boolean;
  firstPingDate: Date | null;
};

export const HomeTab: React.FC<Props> = ({
  participante,
  highlightedPing,
  timerTargetDate,
  timerLabel,
  isActiveWindow,
  onTimerEnd,
  onLogout,
  isReportAvailable,
  onOpenScreenTime,
  screenTimeCount,
  screenTimeToday,
  onNavigateToTutorial,
  hasSeenTutorial,
  isBeforeStudyStart,
  firstPingDate,
}) => {
  const { user, pings } = participante;
  const level = user?.level ?? 1;
  const totalXp = user?.points ?? 0;
  const currentLevelStart = (level - 1) * 160;
  const xpIntoLevel = totalXp - currentLevelStart;
  const xpPct = (xpIntoLevel / 160) * 100;
  const levelTitle = LEVEL_TITLES[Math.min(Math.floor((level - 1) / 2), LEVEL_TITLES.length - 1)];

  // Determine current day's pings
  const currentDayIndex = highlightedPing?.day
    ?? (pings ?? []).reduce((last, day, idx) =>
        day.statuses.some(s => s !== "pending") ? idx : last, 0);
  const todayStatuses = pings?.[currentDayIndex]?.statuses ?? [];
  const notificationTimes = ["9h", "11h", "13h", "15h", "17h", "19h", "21h"];

  return (
    <div className={`relative min-h-full px-4 pt-6 pb-4 flex flex-col items-center${isBeforeStudyStart ? " overflow-hidden" : ""}`}>
      {isBeforeStudyStart && firstPingDate && (
        <PreStudyLock firstPingDate={firstPingDate} />
      )}

      {/* Avatar hero */}
      <div className="relative mb-4 mt-2">
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(34,211,238,0.2) 0%, transparent 70%)",
            transform: "scale(1.4)",
          }}
        />
        {/* Avatar */}
        <div
          className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-cyan-400 flex items-center justify-center bg-slate-800"
          style={{ boxShadow: "0 0 24px rgba(34,211,238,0.5), 0 0 48px rgba(34,211,238,0.15)" }}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-16 h-16 text-cyan-400" />
          )}
        </div>
        {/* Level badge */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold text-slate-900 bg-cyan-400 whitespace-nowrap"
          style={{ boxShadow: "0 0 10px rgba(34,211,238,0.6)" }}
        >
          Nível {level}
        </div>
      </div>

      {/* Nickname + title */}
      <h1 className="text-xl font-bold text-white mt-4">{user?.nickname ?? "—"}</h1>
      <p className="text-sm text-cyan-400/70 mb-6">{levelTitle}</p>

      {/* Timer */}
      {timerTargetDate && (
        <div className="mb-5 w-full max-w-xs flex justify-center">
          <CountdownTimer
            targetDate={timerTargetDate}
            label={timerLabel}
            onTimerEnd={onTimerEnd}
            isActiveWindow={isActiveWindow}
          />
        </div>
      )}

      {/* Today's ping progress */}
      <div
        className="w-full max-w-sm rounded-2xl p-4 mb-5"
        style={{
          background: "rgba(15,23,42,0.7)",
          border: "1px solid rgba(34,211,238,0.12)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
            Progresso do Dia {currentDayIndex + 1}
          </h3>
          <span className="text-xs text-slate-400">
            {todayStatuses.filter(s => s === "completed").length}/7
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {notificationTimes.map((time, pingIdx) => {
            const status = todayStatuses[pingIdx] ?? "pending";
            const isHighlighted =
              highlightedPing?.day === currentDayIndex &&
              highlightedPing?.ping === pingIdx;
            const isLast = pingIdx === 6;

            return (
              <div key={pingIdx} className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-slate-500">{time}</span>
                <div className="relative flex items-center justify-center w-7 h-7">
                  {isHighlighted && (
                    <span className="absolute inset-0 rounded-full bg-cyan-400/40 animate-ping" />
                  )}
                  {isLast ? (
                    <StarIcon
                      className={`w-5 h-5 relative z-10 ${
                        status === "completed" ? "text-yellow-400" :
                        status === "missed"    ? "text-red-500/50" :
                                                 "text-slate-700"
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-4 h-4 rounded-full relative z-10 ${
                        status === "completed" ? "bg-green-400" :
                        status === "missed"    ? "bg-red-500" :
                                                 "bg-slate-700"
                      }`}
                      style={
                        isHighlighted
                          ? { boxShadow: "0 0 8px rgba(34,211,238,0.8)" }
                          : {}
                      }
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botão Tempo de Tela + cristais de desbloqueio */}
      <div className="w-full max-w-sm mb-3">
        <button
          onClick={onOpenScreenTime}
          className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl text-sm font-semibold transition-all duration-300 active:scale-95"
          style={screenTimeToday ? {
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.22)",
            backdropFilter: "blur(8px)",
          } : {
            background: "rgba(15,23,42,0.7)",
            border: "1px solid rgba(34,211,238,0.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span className={screenTimeToday ? "text-green-400" : "text-cyan-300"} style={{ fontSize: "1.1rem" }}>
            {screenTimeToday ? "✓" : "⏱"}
          </span>
          <span className={screenTimeToday ? "text-green-300" : "text-cyan-300"}>
            {screenTimeToday ? "Registrado hoje" : "Lançar Tempo de Tela"}
          </span>
          {/* Cristais de progresso */}
          <div className="ml-auto flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <CrystalIcon key={i} filled={screenTimeCount > i} />
            ))}
            <span className="text-[11px] text-slate-400 ml-1">{screenTimeCount}/7</span>
          </div>
        </button>
        {/* Texto de status inline — visível em mobile sem hover */}
        <p
          className="text-[10px] text-center mt-1.5 transition-colors duration-500"
          style={{ color: screenTimeCount >= 3 ? "rgba(34,211,238,0.65)" : "rgba(100,116,139,0.75)" }}
        >
          {screenTimeCount >= 3
            ? "✦ Relatório desbloqueado"
            : `${screenTimeCount}/3 dias · faltam ${3 - screenTimeCount} para liberar o relatório`}
        </p>
      </div>

      {/* Hint: Guia do Explorador — aparece enquanto não visitado */}
      {!hasSeenTutorial && onNavigateToTutorial && (
        <button
          onClick={onNavigateToTutorial}
          className="w-full max-w-sm flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-opacity duration-300 mb-1"
          style={{
            background: "rgba(34,211,238,0.07)",
            border: "1px solid rgba(34,211,238,0.25)",
          }}
        >
          <span className="text-2xl flex-shrink-0">📖</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-cyan-300">Novo por aqui?</p>
            <p className="text-[11px] text-slate-400 truncate">Veja o Guia do Explorador →</p>
          </div>
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.8)" }}
          />
        </button>
      )}

      {/* XP Bar */}
      <div
        className="w-full max-w-sm rounded-2xl p-4"
        style={{
          background: "rgba(15,23,42,0.7)",
          border: "1px solid rgba(34,211,238,0.12)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
            Experiência
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {totalXp} / {level * 160} XP
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-700/60 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${xpPct}%`,
              background: "linear-gradient(90deg, #06b6d4, #22d3ee)",
              boxShadow: "0 0 8px rgba(34,211,238,0.6)",
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-slate-500">
          <span>Nível {level}</span>
          <span>{Math.round(xpPct)}% concluído</span>
          <span>Nível {level + 1}</span>
        </div>
      </div>
    </div>
  );
};
