import React from "react";
import { GameState } from "../data/GameState";
import { Card } from "../Card";
import { CheckCircleIcon } from "../icons/CheckCircleIcon";
import { XCircleIcon } from "../icons/XCircleIcon";
import { StarIcon } from "../icons/StarIcon";
import { EmotionExplorerBadge } from "../EmotionExplorerBadge";

interface AchievementsScreenProps {
    gameState: GameState;
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({
    gameState,
}) => {
    const { pings, user } = gameState;

    // Cálculos do Resumo da Semana
    const completedPings = pings
        .flatMap(d => d.statuses)
        .filter((p, index) => (index + 1) % 7 !== 0 && p === "completed").length;
    // Threshold hardcoded ou total perdido
    const missedPings = pings
        .flatMap(d => d.statuses)
        .filter((p, index) => (index + 1) % 7 !== 0 && p === "missed").length;
    const completedStars = pings
        .flatMap(d => d.statuses)
        .filter((p, index) => (index + 1) % 7 === 0 && p === "completed").length;

    const pingIconClasses = "transition-transform duration-150 ease-in-out";
    const isReportUnlocked = completedPings >= 21; // Condição de desbloqueio exemplo: 21 pings

    return (
        <div className="flex flex-col h-full animate-fade-in pb-20 max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {/* Resumo da Semana */}
            <Card>
                <h3 className="card-title text-center mb-4 sm:mb-6 md:mb-8 md:text-xl lg:text-2xl">Resumo da Semana</h3>
                <div className="flex justify-around items-start text-center">
                    <div className="flex flex-col items-center space-y-1 sm:space-y-2 md:space-y-4">
                        <CheckCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 text-green-400" />
                        <h4 className="text-[10px] sm:text-sm md:text-base lg:text-lg font-semibold text-gray-300">
                            Respondidos
                        </h4>
                        <div className="relative flex items-baseline">
                            <span className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-green-400">{completedPings}</span>
                            <span className="text-[10px] sm:text-sm md:text-base font-normal text-gray-500 ml-1">/42</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center space-y-1 sm:space-y-2 md:space-y-4">
                        <XCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 text-red-500" />
                        <h4 className="text-[10px] sm:text-sm md:text-base lg:text-lg font-semibold text-gray-300">
                            Perdidos
                        </h4>
                        <div className="relative flex items-baseline">
                            <span className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-red-500">{missedPings}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center space-y-1 sm:space-y-2 md:space-y-4">
                        <StarIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 text-yellow-400" />
                        <h4 className="text-[10px] sm:text-sm md:text-base lg:text-lg font-semibold text-gray-300">
                            Fechados
                        </h4>
                        <div className="relative flex items-baseline">
                            <span className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-yellow-400">{completedStars}</span>
                            <span className="text-[10px] sm:text-sm md:text-base font-normal text-gray-500 ml-1">/7</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Grid Histórico 7x7 */}
            <Card>
                <h3 className="card-title">Histórico de Pings</h3>
                <div className="grid grid-cols-7 gap-y-2 gap-x-1 sm:gap-y-4 items-center text-center mt-2 sm:mt-4">
                    {["9h", "11h", "13h", "15h", "17h", "19h", "21h"].map((time, i) => (
                        <div
                            key={time}
                            className={`font-semibold text-[9px] sm:text-xs text-cyan-300/80 uppercase ${i === 6 ? "text-yellow-400/80" : ""}`}
                        >
                            {time}
                        </div>
                    ))}
                    {pings.map((day, dayIndex) => (
                        <React.Fragment key={dayIndex}>
                            {day.statuses.map((status, pingIndex) => {
                                const isLastColumn = pingIndex === 6;

                                return (
                                    <div
                                        key={`${dayIndex}-${pingIndex}`}
                                        className={`h-6 sm:h-8 flex items-center justify-center relative`}
                                    >
                                        <div className="relative z-10">
                                            {isLastColumn ? (
                                                status === "completed" ? (
                                                    <StarIcon
                                                        className={`w-4 h-4 sm:w-6 sm:h-6 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.6)] ${pingIconClasses}`}
                                                    />
                                                ) : status === "missed" ? (
                                                    <div
                                                        className={`w-3 h-1 sm:w-4 sm:h-1.5 bg-gray-600 rounded-full ${pingIconClasses}`}
                                                    ></div>
                                                ) : (
                                                    <StarIcon
                                                        className={`w-4 h-4 sm:w-6 sm:h-6 text-gray-700 opacity-50 ${pingIconClasses}`}
                                                    />
                                                )
                                            ) : status === "completed" ? (
                                                <div
                                                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.6)] ${pingIconClasses}`}
                                                ></div>
                                            ) : status === "missed" ? (
                                                <div
                                                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500/80 ${pingIconClasses}`}
                                                ></div>
                                            ) : (
                                                <div
                                                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-slate-800 border border-slate-700 shadow-inner ${pingIconClasses}`}
                                                ></div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
                <p className="text-[8px] sm:text-[10px] text-gray-500 mt-4 sm:mt-6 text-center uppercase tracking-widest break-words overflow-hidden">
                    LINHAS = DIAS | COLUNAS = HORÁRIOS
                </p>
            </Card>

            {/* Badges */}
            <Card>
                <h3 className="card-title md:text-xl lg:text-2xl">Coleção de Badges</h3>
                <div className="flex justify-around items-center mt-2 sm:mt-4 md:mt-8 bg-slate-800/50 p-4 sm:p-6 md:p-10 rounded-2xl border border-white/5">
                    <EmotionExplorerBadge className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 transform hover:scale-110 transition-transform cursor-pointer drop-shadow-lg" unlocked={true} />
                    <EmotionExplorerBadge className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 opacity-40 grayscale transform hover:scale-105 transition-transform cursor-pointer" />
                    <EmotionExplorerBadge className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 opacity-40 grayscale transform hover:scale-105 transition-transform cursor-pointer" />
                </div>
                <p className="text-center text-[10px] sm:text-xs md:text-sm text-gray-500 mt-2 sm:mt-4 md:mt-6">2 badges ocultos. Continue engajando para desbloqueá-los!</p>
            </Card>

            {/* Área Bloqueada: Relatório de Participação */}
            <div className="relative mt-2 sm:mt-4">
                <div className={`transition-all duration-700 ${!isReportUnlocked ? "blur-sm pointer-events-none opacity-50" : ""}`}>
                    <Card className="border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                        <h3 className="card-title text-cyan-400 md:text-xl lg:text-2xl">Relatório</h3>
                        <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-900/50 rounded-xl mt-2 sm:mt-4 md:mt-8 border border-cyan-500/10">
                            <div className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 drop-shadow-sm mb-1 sm:mb-2">
                                {Math.round(user.responseRate * 100) || 0}%
                            </div>
                            <p className="text-[10px] sm:text-sm md:text-base lg:text-lg text-center text-cyan-200 uppercase tracking-widest font-bold">Taxa de Resposta Global</p>

                            <div className="w-full mt-6 space-y-3">
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Valência Média (SAM)</span>
                                    <span className="text-white">Aguardando dados...</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 h-full w-1/2 opacity-50"></div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Lock Overlay */}
                {!isReportUnlocked && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-[2px] rounded-2xl border border-slate-700">
                        <div className="bg-slate-800 p-4 rounded-full border-2 border-slate-600 mb-4 shadow-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-400">
                                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h4 className="text-white font-bold text-lg tracking-wide">Relatório Bloqueado</h4>
                        <p className="text-gray-400 text-sm mt-2 max-w-[200px] text-center">
                            Desbloqueie ao completar 21 pings respondidos na semana.
                        </p>
                        <div className="mt-4 w-48 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                            <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${Math.min(100, (completedPings / 21) * 100)}%` }}></div>
                        </div>
                        <span className="text-xs text-cyan-400 mt-2 font-mono">{completedPings} / 21</span>
                    </div>
                )}
            </div>
        </div>
    );
};
