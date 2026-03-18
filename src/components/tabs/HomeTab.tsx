import React, { useRef } from "react";
import { GameState } from "@/src/components/data/GameState";
import { CountdownTimer } from "@/src/components/CountdownTimer";
import { ProfileMenu } from "@/src/components/menu/ProfileMenu";
import { StarIcon } from "@/src/components/icons/StarIcon";
import { UserIcon } from "@/src/components/icons/UserIcon";

const LEVEL_THRESHOLDS = [
  0, 160, 320, 480, 640, 800, 960, 1120, 1280, 1440,
  1600, 1760, 1920, 2080, 2240, 2400, 2560, 2720, 2880, 3040, 3200,
];

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

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

type Props = {
  participante: GameState;
  highlightedPing: { day: number; ping: number } | null;
  timerTargetDate: Date | null;
  timerLabel: string;
  isActiveWindow: boolean;
  onTimerEnd: () => void;
  isProfileMenuOpen: boolean;
  onToggleProfileMenu: () => void;
  onCloseProfileMenu: () => void;
  onUpload: () => void;
  onRemove: () => void;
  onViewRcle: () => void;
  onViewPerformance: () => void;
  onViewData: () => void;
  onLogout: () => void;
  isReportAvailable: boolean;
  onDownloadReport: () => void;
  onOpenScreenTime: () => void;
  screenTimeCount: number;
  screenTimeToday: boolean;
  isAdmin?: boolean;
  onNavigateAdmin?: () => void;
};

export const HomeTab: React.FC<Props> = ({
  participante,
  highlightedPing,
  timerTargetDate,
  timerLabel,
  isActiveWindow,
  onTimerEnd,
  isProfileMenuOpen,
  onToggleProfileMenu,
  onCloseProfileMenu,
  onUpload,
  onRemove,
  onViewRcle,
  onViewPerformance,
  onViewData,
  onLogout,
  isReportAvailable,
  onDownloadReport,
  onOpenScreenTime,
  screenTimeCount,
  screenTimeToday,
  isAdmin,
  onNavigateAdmin,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, pings } = participante;
  const level = user?.level ?? 1;
  const totalXp = user?.points ?? 0;
  const currentLevelStart = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelTarget = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const xpIntoLevel = totalXp - currentLevelStart;
  const xpForLevel = nextLevelTarget - currentLevelStart;
  const xpPct = xpForLevel > 0 ? Math.min(100, (xpIntoLevel / xpForLevel) * 100) : 0;
  const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  // Determine current day's pings
  const currentDayIndex = highlightedPing?.day
    ?? (pings ?? []).reduce((last, day, idx) =>
        day.statuses.some(s => s !== "pending") ? idx : last, 0);
  const todayStatuses = pings?.[currentDayIndex]?.statuses ?? [];
  const notificationTimes = ["9h", "11h", "13h", "15h", "17h", "19h", "21h"];

  return (
    <div className="min-h-full px-4 pt-6 pb-4 flex flex-col items-center">

      {/* Menu button */}
      <div className="w-full flex justify-start mb-2 relative" ref={menuRef}>
        <button
          onClick={onToggleProfileMenu}
          className="p-2 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
          aria-label="Menu"
        >
          <MenuIcon />
        </button>
        {isProfileMenuOpen && (
          <ProfileMenu
            onUpload={onUpload}
            onRemove={onRemove}
            onViewRcle={onViewRcle}
            onViewPerformance={onViewPerformance}
            onViewData={onViewData}
            onLogout={onLogout}
            hasAvatar={!!user?.avatar}
            isReportAvailable={isReportAvailable}
            onDownloadReport={onDownloadReport}
            isAdmin={isAdmin}
            onNavigateAdmin={onNavigateAdmin}
          />
        )}
      </div>

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
            {totalXp} / {nextLevelTarget} XP
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
