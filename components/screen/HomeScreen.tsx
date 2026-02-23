import React, { useRef } from "react";
import { GameState } from "../data/GameState";
import { UserIcon } from "../icons/UserIcon";
import { BellIcon } from "../icons/BellIcon";
import { StarIcon } from "../icons/StarIcon";
import { PlexusFace } from "../PlexusFace";

interface HomeScreenProps {
    gameState: GameState;
    highlightedPing: { day: number; ping: number } | null;
    instrumentFlow: any;
    startInstrumentFlow: () => void;
    onAvatarClick: () => void;
    notificationPermission: string;
    requestNotificationPermission: () => void;
    LEVEL_THRESHOLDS: number[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
    gameState,
    highlightedPing,
    instrumentFlow,
    startInstrumentFlow,
    onAvatarClick,
    notificationPermission,
    requestNotificationPermission,
    LEVEL_THRESHOLDS,
}) => {
    const { user, pings } = gameState;
    const { level, points: totalXp, currentStreak = 0 } = user;

    const currentLevelXpStart = LEVEL_THRESHOLDS[level - 1] ?? 0;
    const nextLevelXpTarget =
        LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

    const xpForThisLevel = nextLevelXpTarget - currentLevelXpStart;
    const xpIntoLevel = totalXp - currentLevelXpStart;

    const progressPercentage =
        xpForThisLevel > 0 && xpIntoLevel >= 0
            ? (xpIntoLevel / xpForThisLevel) * 100
            : 0;

    // Obter pings de hoje (assumindo que "hoje" é o dia do highlightedPing, ou apenas o primeiro dia com pending)
    const todayIndex = highlightedPing ? highlightedPing.day : Math.max(0, pings.findIndex(day => day.statuses.includes("pending")));
    const validTodayIndex = todayIndex >= 0 && todayIndex < 7 ? todayIndex : 0;

    const todayPings = pings[validTodayIndex]?.statuses || Array(7).fill("pending");

    return (
        <div className="flex flex-col h-full animate-fade-in relative max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
            {/* Background Plexus */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none flex items-center justify-center">
                <div className="w-full aspect-square max-w-[400px] md:max-w-[600px] lg:max-w-[800px]">
                    <PlexusFace />
                </div>
            </div>

            {/* Header Actions (Top Right) & User Info (Top Left) */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 flex flex-col items-start gap-0.5">
                <p className="text-cyan-400 font-mono font-bold tracking-widest uppercase text-sm md:text-lg lg:text-xl drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                    Nível {user.level}
                </p>
                <p className="text-gray-300 font-mono font-medium text-[10px] md:text-xs lg:text-sm tracking-wider uppercase opacity-80">
                    Mente Curiosa
                </p>
            </div>
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex flex-col items-end gap-1 sm:gap-2">
                {notificationPermission === "default" && (
                    <button
                        onClick={requestNotificationPermission}
                        className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 px-2 py-1 flex-shrink-0 rounded hover:bg-cyan-500/30 transition-colors"
                    >
                        Ativar Notificações
                    </button>
                )}
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        className="p-2 sm:p-3 rounded-full bg-slate-800/80 border border-cyan-500/30 hover:bg-slate-700/80 hover:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg backdrop-blur-sm"
                        onClick={startInstrumentFlow}
                        disabled={!highlightedPing || !!instrumentFlow}
                        aria-label="Responder próximo ping"
                    >
                        <BellIcon className="w-6 h-6 text-cyan-400" />
                        {highlightedPing && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center z-10 pt-20 pb-4 sm:pt-24 sm:pb-8">
                {/* Central Avatar */}
                <button
                    onClick={onAvatarClick}
                    className="relative group w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full bg-slate-800 border-4 md:border-8 border-cyan-400 flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-cyan-200 hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] mb-4 sm:mb-6 md:mb-10"
                    aria-label="Menu do perfil"
                >
                    {user.avatar ? (
                        <img
                            src={user.avatar}
                            alt="Avatar do usuário"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <UserIcon className="w-24 h-24 md:w-40 md:h-40 lg:w-56 lg:h-56 text-cyan-400" />
                    )}
                </button>

                <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-10 md:mb-16 drop-shadow-md">
                    {user.nickname}
                </h1>

                {/* HUD Diário: Pings de Hoje */}
                <div className="w-full px-4 sm:px-6 md:px-10 lg:px-16 mb-2 sm:mb-4 md:mb-6">
                    <div className="flex justify-between items-end px-2 mb-2">
                        <h3 className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-400 uppercase tracking-widest leading-none">Progresso de Hoje</h3>
                        <div className="flex items-center gap-1">
                            <span className="text-sm sm:text-base leading-none">🔥</span>
                            <span className="text-orange-400 font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-wider leading-none">
                                Sequência: {currentStreak}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900/60 backdrop-blur-md p-2 sm:p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 shadow-xl">
                        {todayPings.map((status, index) => {
                            const isHighlighted = highlightedPing?.day === validTodayIndex && highlightedPing?.ping === index;
                            const isStar = index === 6;

                            return (
                                <div key={index} className="relative flex flex-col items-center">
                                    {isHighlighted && (
                                        <div className="absolute inset-0 rounded-full bg-cyan-400/40 animate-ping" style={{ transform: "scale(1.5)" }}></div>
                                    )}
                                    {isStar ? (
                                        status === "completed" ? (
                                            <StarIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                                        ) : status === "missed" ? (
                                            <div className="w-3 h-1 sm:w-4 sm:h-1 md:w-6 md:h-1.5 bg-gray-600 rounded-full my-2 sm:my-3 md:my-4"></div>
                                        ) : (
                                            <StarIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-700" />
                                        )
                                    ) : status === "completed" ? (
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 rounded-full bg-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                                    ) : status === "missed" ? (
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 rounded-full bg-red-500 shadow-inner"></div>
                                    ) : (
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 rounded-full bg-gray-700 border border-gray-600"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* XP Progress Only */}
                <div className="w-full px-4 sm:px-6 md:px-10 lg:px-16 mt-auto">
                    <div className="bg-slate-900/80 backdrop-blur-md p-3 sm:p-5 md:p-8 rounded-2xl md:rounded-3xl border border-cyan-500/20 shadow-xl">
                        <div className="flex justify-between items-end mb-2 sm:mb-3 md:mb-5">
                            <span className="text-gray-400 uppercase font-bold text-[10px] md:text-sm tracking-widest">Experiência</span>
                            <span className="text-cyan-300 font-mono text-xs md:text-sm lg:text-base font-bold">
                                {totalXp} XP
                            </span>
                        </div>

                        <div className="w-full bg-gray-800 rounded-full h-3 md:h-5 overflow-hidden border border-gray-700 shadow-inner">
                            <div
                                className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full transition-all duration-1000 ease-out relative"
                                style={{ width: `${progressPercentage}%` }}
                            >
                                <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 blur-md"></div>
                            </div>
                        </div>

                        <div className="flex justify-between mt-2 md:mt-4 text-[10px] md:text-xs lg:text-sm text-gray-500 uppercase font-bold tracking-wider">
                            <span>Nível {level}</span>
                            <span>Alvo: {nextLevelXpTarget} XP</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
