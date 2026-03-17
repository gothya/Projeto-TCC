import React from "react";
import { PodiumItem } from "@/src/components/PodiumItem";

type Player = { nickname: string; points: number };

type Props = {
  leaderboardData: Player[];
  currentNickname: string | undefined;
};

export const SocialTab: React.FC<Props> = ({ leaderboardData, currentNickname }) => {
  const players = leaderboardData.length > 0 ? leaderboardData : [];
  const topThree = players.slice(0, 3);
  const rest = players.slice(3);

  const currentUserRank = players.findIndex(p => p.nickname === currentNickname) + 1;
  const currentUserData = players.find(p => p.nickname === currentNickname);
  const currentUserInTop3 = currentUserRank > 0 && currentUserRank <= 3;

  return (
    <div className="min-h-full flex flex-col pb-4">
      {/* Header */}
      <div
        className="px-6 pt-8 pb-6 text-center"
        style={{
          background: "linear-gradient(180deg, rgba(6,182,212,0.08) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(34,211,238,0.08)",
        }}
      >
        <p className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-[0.3em] mb-1">
          Enigma de Psylogos
        </p>
        <h1 className="text-2xl font-bold text-white">Ranking Global</h1>
        <p className="text-xs text-slate-500 mt-1">{players.length} participantes</p>
      </div>

      {/* Podium */}
      {topThree.length > 0 && (
        <div className="flex justify-center items-end gap-3 px-6 py-6">
          {topThree[1] && (
            <PodiumItem
              player={topThree[1]}
              rank={2}
              isCurrentUser={topThree[1].nickname === currentNickname}
            />
          )}
          {topThree[0] && (
            <PodiumItem
              player={topThree[0]}
              rank={1}
              isCurrentUser={topThree[0].nickname === currentNickname}
            />
          )}
          {topThree[2] && (
            <PodiumItem
              player={topThree[2]}
              rank={3}
              isCurrentUser={topThree[2].nickname === currentNickname}
            />
          )}
        </div>
      )}

      {/* Rest of players */}
      {rest.length > 0 && (
        <div className="flex-1 px-4 space-y-2 pb-4">
          {rest.map((player, idx) => {
            const rank = idx + 4;
            const isMe = player.nickname === currentNickname;
            return (
              <div
                key={`${player.nickname}-${idx}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={
                  isMe
                    ? {
                        background: "rgba(34,211,238,0.1)",
                        border: "1px solid rgba(34,211,238,0.4)",
                        boxShadow: "0 0 12px rgba(34,211,238,0.15)",
                      }
                    : {
                        background: "rgba(15,23,42,0.5)",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }
                }
              >
                <span className="w-7 text-center text-sm font-bold text-slate-500">
                  {rank}
                </span>
                <span className={`flex-1 text-sm font-medium ${isMe ? "text-cyan-300" : "text-slate-300"}`}>
                  {player.nickname}
                  {isMe && (
                    <span className="ml-2 text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">
                      você
                    </span>
                  )}
                </span>
                <span className={`text-sm font-mono font-bold ${isMe ? "text-cyan-400" : "text-slate-400"}`}>
                  {player.points} XP
                </span>
              </div>
            );
          })}
        </div>
      )}

      {players.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          Carregando ranking...
        </div>
      )}

      {/* Sticky footer — usuário atual fora do top 3 */}
      {currentUserData && !currentUserInTop3 && (
        <div
          className="sticky bottom-0 mx-4 mb-2 rounded-2xl px-5 py-3 flex items-center gap-3"
          style={{
            background: "rgba(6,182,212,0.12)",
            border: "1px solid rgba(34,211,238,0.35)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 -4px 24px rgba(34,211,238,0.1)",
          }}
        >
          <div className="flex flex-col">
            <span className="text-[10px] text-cyan-400/70 uppercase tracking-wider">Sua posição</span>
            <span className="text-lg font-bold text-white">#{currentUserRank}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-cyan-300">{currentUserData.nickname}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">XP</span>
            <p className="text-sm font-mono font-bold text-cyan-400">{currentUserData.points}</p>
          </div>
        </div>
      )}
    </div>
  );
};
