import React from "react";
import { TrophyIcon } from "./icons/TrophyIcon";

export const PodiumItem: React.FC<{
  player: { nickname: string; points: number; avatar?: string | null };
  rank: number;
  isCurrentUser: boolean;
}> = ({ player, rank, isCurrentUser }) => {
  const rankStyles: {
    [key: number]: {
      height: string;
      bg: string;
      border: string;
      text: string;
      accent: string;
      glow: string;
    };
  } = {
    1: {
      height: "h-36 sm:h-44",
      bg: "bg-gradient-to-b from-yellow-500/30 to-yellow-900/10",
      border: "border-yellow-400/50",
      text: "text-yellow-400",
      accent: "bg-yellow-400",
      glow: "shadow-[0_0_20px_rgba(250,204,21,0.3)]",
    },
    2: {
      height: "h-28 sm:h-36",
      bg: "bg-gradient-to-b from-gray-400/20 to-gray-800/10",
      border: "border-gray-400/30",
      text: "text-gray-300",
      accent: "bg-gray-400",
      glow: "shadow-[0_0_15px_rgba(156,163,175,0.2)]",
    },
    3: {
      height: "h-24 sm:h-32",
      bg: "bg-gradient-to-b from-orange-500/20 to-orange-900/10",
      border: "border-orange-500/30",
      text: "text-orange-400",
      accent: "bg-orange-500",
      glow: "shadow-[0_0_15px_rgba(249,115,22,0.2)]",
    },
  };

  const style = rankStyles[rank];
  const userHighlight = isCurrentUser
    ? "!border-cyan-400/60 !from-cyan-500/20 !to-cyan-900/10 shadow-[0_0_25px_rgba(34,211,238,0.3)]"
    : "";

  return (
    <div className="flex flex-col items-center w-1/3 min-w-0">
      {/* Avatar Section */}
      <div className={`relative mb-2 transition-transform duration-500 hover:scale-110 ${rank === 1 ? 'scale-110' : ''}`}>
        <div className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 ${isCurrentUser ? 'border-cyan-400 glow-blue' : style.border} p-0.5 bg-slate-800 shadow-xl`}>
          {player.avatar ? (
            <img src={player.avatar} alt={player.nickname} className="w-full h-full object-cover rounded-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-700 text-gray-400 font-bold text-xs sm:text-sm">
              {player.nickname.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full ${style.accent} flex items-center justify-center border-2 border-slate-900 shadow-lg`}>
          <span className="text-slate-900 text-[10px] sm:text-xs font-black">{rank}</span>
        </div>
      </div>

      {/* Podium Block */}
      <div
        className={`w-full flex flex-col items-center justify-start pt-3 px-1 sm:px-2 rounded-t-2xl border-t border-x transition-all duration-700 ${style.height} ${style.bg} ${style.border} ${style.glow} ${userHighlight} relative overflow-hidden`}
      >
        <TrophyIcon rank={rank} className={`w-5 h-5 sm:w-7 sm:h-7 mb-1 sm:mb-2 ${style.text} drop-shadow-[0_0_5px_currentColor]`} />

        <span className={`font-bold text-[10px] sm:text-sm truncate w-full text-center ${isCurrentUser ? 'text-white' : 'text-gray-200'} leading-tight`}>
          {player.nickname}
        </span>

        <div className="flex items-center gap-0.5 mt-1">
          <span className={`font-mono text-[9px] sm:text-xs font-black ${style.text}`}>
            {player.points}
          </span>
          <span className="text-[7px] sm:text-[9px] text-gray-500 font-bold uppercase tracking-tighter">XP</span>
        </div>

        {/* Shine effect */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent skew-y-12 transform -translate-y-full group-hover:translate-y-full transition-transform duration-1000"></div>
      </div>
    </div>
  );
};
