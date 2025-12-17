import React from "react";
import { TrophyIcon } from "./icons/TrophyIcon";

export const PodiumItem: React.FC<{
  player: { nickname: string; points: number };
  rank: number;
  isCurrentUser: boolean;
}> = ({ player, rank, isCurrentUser }) => {
  const rankStyles: {
    [key: number]: {
      height: string;
      bg: string;
      border: string;
      text: string;
      shadow: string;
    };
  } = {
    1: {
      height: "h-32",
      bg: "bg-yellow-500/20",
      border: "border-yellow-400",
      text: "text-yellow-300",
      shadow: "shadow-yellow-400/50",
    },
    2: {
      height: "h-28",
      bg: "bg-gray-400/20",
      border: "border-gray-400",
      text: "text-gray-300",
      shadow: "shadow-gray-400/30",
    },
    3: {
      height: "h-24",
      bg: "bg-orange-500/20",
      border: "border-orange-400",
      text: "text-orange-300",
      shadow: "shadow-orange-400/40",
    },
  };

  const style = rankStyles[rank];
  const userHighlight = isCurrentUser
    ? "!border-cyan-400 !bg-cyan-500/30 shadow-glow-blue"
    : "";

  return (
    <div
      className={`flex flex-col items-center justify-end text-center p-2 w-1/3 rounded-t-lg transition-all ${style.height} ${style.bg} ${style.border} ${userHighlight} border-b-0`}
    >
      <TrophyIcon rank={rank} className="w-6 h-6 mb-1" />
      <span className={`font-bold text-sm truncate w-full ${style.text}`}>
        {player.nickname}
      </span>
      <span className={`font-mono text-xs ${style.text}`}>{player.points}</span>
    </div>
  );
};
