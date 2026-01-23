import React, { useState, useEffect, useRef, useCallback } from "react";
import { GameState } from "../data/GameState";
import { InstrumentFlowState } from "../states/InstrumentFlowState";
import { InstrumentResponse } from "../data/InstrumentResponse";
import { MOCK_PLAYERS } from "../data/MockPlayers";
import { InstrumentModal } from "../modal/InstrumentModal";
import { RcleModal } from "../modal/RcleModal";
import { SociodemographicModal } from "../modal/SociodemographicModal";
import { PerformanceModal } from "../modal/PerformanceModal";
import { ProfileMenu } from "../menu/ProfileMenu";
import { UserIcon } from "../icons/UserIcon";
import { CountdownTimer } from "../CountdownTimer";
import { BellIcon } from "../icons/BellIcon";
import { Card } from "../Card";
import { PlexusFace } from "../PlexusFace";
import { EmotionExplorerBadge } from "../EmotionExplorerBadge";
import { CheckCircleIcon } from "../icons/CheckCircleIcon";
import { XCircleIcon } from "../icons/XCircleIcon";
import { StarIcon } from "../icons/StarIcon";
import { PodiumItem } from "../PodiumItem";

export const DashboardScreen: React.FC<{
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onLogout: () => void;
}> = ({ gameState, setGameState, onLogout }) => {
  const { user, pings } = gameState;
  const [highlightedPing, setHighlightedPing] = useState<{
    day: number;
    ping: number;
  } | null>(null);
  const [isRcleModalOpen, setIsRcleModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSociodemographicModalOpen, setIsSociodemographicModalOpen] =
    useState(false);
  const [instrumentFlow, setInstrumentFlow] =
    useState<InstrumentFlowState>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const findNextPendingPing = () => {
      for (let day = 0; day < pings.length; day++) {
        for (let ping = 0; ping < pings[day].statuses.length; ping++) {
          if (pings[day].statuses[ping] === "pending") {
            return { day, ping };
          }
        }
      }
      return null;
    };
    setHighlightedPing(findNextPendingPing());
  }, [pings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const startInstrumentFlow = useCallback(() => {
    if (!highlightedPing) return;
    const isEndOfDay = (highlightedPing.ping + 1) % 7 === 0;

    if (isEndOfDay) {
      setInstrumentFlow({
        ping: highlightedPing,
        type: "end_of_day",
        step: "panas_daily",
        data: {
          timestamp: new Date().toISOString(),
          pingDay: highlightedPing.day,
          pingIndex: highlightedPing.ping,
          type: "end_of_day",
        },
      });
    } else {
      setInstrumentFlow({
        ping: highlightedPing,
        type: "regular",
        step: "sam",
        data: {
          timestamp: new Date().toISOString(),
          pingDay: highlightedPing.day,
          pingIndex: highlightedPing.ping,
          type: "regular",
        },
      });
    }
  }, [highlightedPing]);

  const LEVEL_THRESHOLDS = [
    0, 160, 320, 480, 640, 800, 960, 1120, 1280, 1440, 1600, 1760, 1920, 2080,
    2240, 2400, 2560, 2720, 2880, 3040, 3200,
  ];

  const calculateLevel = (xp: number): number => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  };

  const handleInstrumentFlowFinish = (
    finalResponseData: InstrumentResponse
  ) => {
    if (!instrumentFlow) return;
    const { day, ping } = instrumentFlow.ping;

    setGameState((prev) => {
      const newPings = prev.pings.map((row) => [...row]);
      newPings[day][ping] = "completed";

      const newXp = newPings.flat().reduce((acc, status, index) => {
        if (status === "completed") {
          const isStar = (index + 1) % 7 === 0;
          return acc + (isStar ? 100 : 50);
        }
        return acc;
      }, 0);

      const newLevel = calculateLevel(newXp);

      return {
        ...prev,
        pings: newPings,
        responses: [...prev.responses, finalResponseData],
        user: {
          ...prev.user,
          points: newXp,
          level: newLevel,
        },
      };
    });
    setInstrumentFlow(null);
  };

  const handleInstrumentStep = (stepData: Partial<InstrumentResponse>) => {
    if (!instrumentFlow) return;

    const newData = { ...instrumentFlow.data, ...stepData };

    if (instrumentFlow.type === "regular") {
      if (instrumentFlow.step === "sam") {
        setInstrumentFlow({
          ...instrumentFlow,
          step: "feed_context",
          data: newData,
        });
      } else if (instrumentFlow.step === "feed_context") {
        setInstrumentFlow({
          ...instrumentFlow,
          step: "panas_contextual",
          data: newData,
        });
      } else if (instrumentFlow.step === "panas_contextual") {
        handleInstrumentFlowFinish(newData as InstrumentResponse);
      }
    } else {
      // end_of_day
      if (instrumentFlow.step === "panas_daily") {
        setInstrumentFlow({
          ...instrumentFlow,
          step: "end_of_day_log",
          data: newData,
        });
      } else if (instrumentFlow.step === "end_of_day_log") {
        handleInstrumentFlowFinish(newData as InstrumentResponse);
      }
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setGameState((prev) => ({
          ...prev,
          user: { ...prev.user, avatar: reader.result as string },
        }));
      };
      reader.readAsDataURL(file);
    }
    setIsProfileMenuOpen(false);
  };

  const handleRemoveAvatar = () => {
    setGameState((prev) => ({
      ...prev,
      user: { ...prev.user, avatar: null },
    }));
    setIsProfileMenuOpen(false);
  };

  const handleTimerEnd = useCallback(() => {
    if (highlightedPing && !instrumentFlow) {
      startInstrumentFlow();
    }
  }, [highlightedPing, instrumentFlow, startInstrumentFlow]);

  const notificationTimes = ["9h", "11h", "13h", "15h", "17h", "19h", "21h"];

  const completedPings = pings
    .flatMap(d => d.statuses)
    .filter((p, index) => (index + 1) % 7 !== 0 && p === "completed").length;
  const missedPings = pings
    .flatMap(d => d.statuses)
    .filter((p, index) => (index + 1) % 7 !== 0 && p === "missed").length;
  const completedStars = pings
    .flatMap(d => d.statuses)
    .filter((p, index) => (index + 1) % 7 === 0 && p === "completed").length;

  const { level, points: totalXp } = user;
  const currentLevelXpStart = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelXpTarget =
    LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

  const xpForThisLevel = nextLevelXpTarget - currentLevelXpStart;
  const xpIntoLevel = totalXp - currentLevelXpStart;

  const progressPercentage =
    xpForThisLevel > 0 && xpIntoLevel >= 0
      ? (xpIntoLevel / xpForThisLevel) * 100
      : 0;

  const pingIconClasses = "transition-transform duration-150 ease-in-out";

  const allPlayers = [
    ...MOCK_PLAYERS,
    { nickname: user.nickname, points: user.points },
  ].sort((a, b) => b.points - a.points);

  const topThree = allPlayers.slice(0, 3);
  const restOfPlayers = allPlayers.slice(3);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-fade-in">
      {instrumentFlow && (
        <InstrumentModal
          flow={instrumentFlow}
          onStep={handleInstrumentStep}
          onCancel={() => setInstrumentFlow(null)}
        />
      )}
      {isRcleModalOpen && (
        <RcleModal onClose={() => setIsRcleModalOpen(false)} />
      )}
      {isSociodemographicModalOpen && gameState.sociodemographicData && (
        <SociodemographicModal
          onClose={() => setIsSociodemographicModalOpen(false)}
          data={gameState.sociodemographicData}
        />
      )}
      {isPerformanceModalOpen && (
        <PerformanceModal
          onClose={() => setIsPerformanceModalOpen(false)}
          gameState={gameState}
        />
      )}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="relative group w-16 h-16 rounded-full bg-slate-800 border-2 border-cyan-400 flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-cyan-300 hover:shadow-glow-blue-sm"
              aria-label="Menu do perfil"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar do usuário"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-8 h-8 text-cyan-400" />
              )}
            </button>
            {isProfileMenuOpen && (
              <ProfileMenu
                onUpload={() => fileInputRef.current?.click()}
                onRemove={handleRemoveAvatar}
                onViewRcle={() => {
                  setIsRcleModalOpen(true);
                  setIsProfileMenuOpen(false);
                }}
                onViewPerformance={() => {
                  setIsPerformanceModalOpen(true);
                  setIsProfileMenuOpen(false);
                }}
                onViewData={() => {
                  setIsSociodemographicModalOpen(true);
                  setIsProfileMenuOpen(false);
                }}
                onLogout={onLogout}
                hasAvatar={!!user.avatar}
              />
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/png, image/jpeg"
            className="hidden"
          />
          <div>
            <h1 className="text-xl font-bold text-cyan-400">{user.nickname}</h1>
            <p className="text-gray-400">Nível {user.level} - Mente Curiosa</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <CountdownTimer onTimerEnd={handleTimerEnd} />
          <button
            className="p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={startInstrumentFlow}
            disabled={!highlightedPing || !!instrumentFlow}
            aria-label="Responder próximo ping"
          >
            <BellIcon className="w-6 h-6 text-cyan-400" />
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3">
          <Card>
            <div className="p-2 text-center">
              <h2 className="text-lg font-semibold text-cyan-400 mb-4">
                "Psylogos, uma inteligência buscando compreender o coração da
                Humanidade."
              </h2>
              <div className="w-64 h-64 mx-auto cursor-grab active:cursor-grabbing">
                <PlexusFace />
              </div>
            </div>
          </Card>
        </div>

        <Card className="md:col-span-2">
          <h3 className="card-title">XP / LVL</h3>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div
              className="bg-cyan-400 h-4 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-sm text-cyan-300">
            <span>Nível {level}</span>
            <span>
              {totalXp} / {nextLevelXpTarget} XP
            </span>
            <span>Nível {level + 1}</span>
          </div>
          <p className="text-center text-gray-400 text-xs mt-2">
            XP total acumulado / XP para próximo nível
          </p>
        </Card>

        <Card className="md:col-span-1">
          <h3 className="card-title">Badges</h3>
          <div className="flex justify-around items-center">
            <EmotionExplorerBadge className="w-16 h-16" unlocked={true} />
            <EmotionExplorerBadge className="w-16 h-16" />
            <EmotionExplorerBadge className="w-16 h-16" />
          </div>
        </Card>

        <div className="md:col-span-3">
          <Card>
            <h3 className="card-title text-center mb-4">Resumo da Semana</h3>
            <div className="flex justify-around items-start text-center">
              <div className="flex flex-col items-center space-y-2">
                <CheckCircleIcon className="w-10 h-10 text-green-400" />
                <h4 className="text-sm font-semibold text-gray-300">
                  Pings Respondidos
                </h4>
                <p className="text-2xl font-bold text-green-400">
                  {completedPings}
                  <span className="text-sm font-normal text-gray-500">/42</span>
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <XCircleIcon className="w-10 h-10 text-red-500" />
                <h4 className="text-sm font-semibold text-gray-300">
                  Pings Perdidos
                </h4>
                <p className="text-2xl font-bold text-red-500">
                  {missedPings}
                  <span className="text-sm font-normal text-gray-500">/13</span>
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <StarIcon className="w-10 h-10 text-yellow-400" />
                <h4 className="text-sm font-semibold text-gray-300">
                  Dias Completos
                </h4>
                <p className="text-2xl font-bold text-yellow-400">
                  {completedStars}
                  <span className="text-sm font-normal text-gray-500">/5</span>
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="md:col-span-1">
          <h3 className="card-title">Leaderboard</h3>
          <div className="flex justify-center items-end gap-2 mb-6">
            {topThree[1] && (
              <PodiumItem
                player={topThree[1]}
                rank={2}
                isCurrentUser={topThree[1].nickname === user.nickname}
              />
            )}
            {topThree[0] && (
              <PodiumItem
                player={topThree[0]}
                rank={1}
                isCurrentUser={topThree[0].nickname === user.nickname}
              />
            )}
            {topThree[2] && (
              <PodiumItem
                player={topThree[2]}
                rank={3}
                isCurrentUser={topThree[2].nickname === user.nickname}
              />
            )}
          </div>
          <ul className="space-y-2">
            {restOfPlayers.map((player, index) => {
              const isCurrentUser = player.nickname === user.nickname;
              const rank = index + 4;
              const userHighlight = isCurrentUser
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold"
                : "border-transparent";

              return (
                <li
                  key={player.nickname}
                  className={`flex items-center justify-between p-2 rounded-md border-l-4 transition-all ${userHighlight}`}
                >
                  <span className="flex items-center">
                    <span className="w-6 text-center text-gray-400 mr-2">
                      {rank}
                    </span>
                    {player.nickname}
                  </span>
                  <span className="font-mono">{player.points}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="md:col-span-2">
          <h3 className="card-title">Pings (Notificações)</h3>
          <div className="grid grid-cols-7 gap-y-3 items-center text-center">
            {notificationTimes.map((time) => (
              <div
                key={time}
                className="font-semibold text-sm text-cyan-300/80"
              >
                {time}
              </div>
            ))}
            {pings.map((day, dayIndex) => (
              <React.Fragment key={dayIndex}>
                {day.statuses.map((status, pingIndex) => {
                  const isLastColumn =
                    pingIndex === notificationTimes.length - 1;
                  const isHighlighted =
                    highlightedPing?.day === dayIndex &&
                    highlightedPing?.ping === pingIndex;

                  return (
                    <div
                      key={`${dayIndex}-${pingIndex}`}
                      className={`h-6 flex items-center justify-center relative`}
                    >
                      {isHighlighted && (
                        <div className="absolute inset-0 rounded-full bg-cyan-400/50 animate-ping-glow"></div>
                      )}
                      <div className="relative z-10">
                        {isLastColumn ? (
                          status === "completed" ? (
                            <StarIcon
                              className={`w-5 h-5 text-yellow-400 ${pingIconClasses}`}
                            />
                          ) : status === "missed" ? (
                            <div
                              className={`w-3 h-1 bg-gray-500 rounded-full ${pingIconClasses}`}
                            ></div>
                          ) : (
                            <StarIcon
                              className={`w-5 h-5 text-gray-700 ${pingIconClasses}`}
                            />
                          )
                        ) : status === "completed" ? (
                          <div
                            className={`w-4 h-4 rounded-full bg-green-400 ${pingIconClasses}`}
                          ></div>
                        ) : status === "missed" ? (
                          <div
                            className={`w-4 h-4 rounded-full bg-red-500 ${pingIconClasses}`}
                          ></div>
                        ) : (
                          <div
                            className={`w-4 h-4 rounded-full bg-gray-700 ${pingIconClasses}`}
                          ></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Progresso de 7 dias. Verde: Respondido, Vermelho: Perdido, Cinza:
            Pendente.
          </p>
        </Card>
      </main>
      {/* Fix: Removed non-standard 'jsx' and 'global' props from the style tag. Standard React does not support styled-jsx syntax without special configuration. A regular <style> tag will achieve the desired global styling. */}
      <style>{`
        .form-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          color: white;
          background-color: rgba(0, 255, 255, 0.05);
          border: 1px solid rgba(0, 255, 255, 0.2);
          border-radius: 0.375rem;
          transition: all 0.2s;
        }
        .form-input:focus {
          outline: none;
          border-color: rgba(0, 255, 255, 0.6);
          box-shadow: 0 0 8px rgba(0, 255, 255, 0.4), 0 0 3px rgba(0, 255, 255, 0.6);
        }
        textarea.form-input {
            min-height: 80px;
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slow-spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-fade-in-down { animation: fade-in-down 0.5s ease-out; }
        .animate-slow-spin-slow { animation: slow-spin-slow 20s linear infinite; }
      `}</style>
    </div>
  );
};
