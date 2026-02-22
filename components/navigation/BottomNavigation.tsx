import React from "react";
import { HomeIcon } from "../icons/HomeIcon";
import { TrophyNavIcon } from "../icons/TrophyNavIcon";
import { ChartIcon } from "../icons/ChartIcon";

export type TabType = "home" | "achievements" | "leaderboard";

interface BottomNavigationProps {
    currentTab: TabType;
    onChangeTab: (tab: TabType) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
    currentTab,
    onChangeTab,
}) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-cyan-500/30 pb-safe pt-1 sm:pt-2 px-2 sm:px-4 shadow-lg z-50">
            <div className="max-w-md mx-auto flex justify-between items-center h-14 sm:h-16 relative">

                {/* Achievements Tab */}
                <button
                    onClick={() => onChangeTab("achievements")}
                    className={`flex flex-col items-center justify-center w-14 sm:w-16 h-full transition-all duration-300 ${currentTab === "achievements" ? "text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" : "text-gray-500 hover:text-cyan-200"
                        }`}
                    aria-label="Conquistas"
                >
                    <TrophyNavIcon className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
                    <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-wider">Troféus</span>
                </button>

                {/* Home Tab (Central and Larger) */}
                <button
                    onClick={() => onChangeTab("home")}
                    className={`flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full transition-all duration-300 -mt-6 sm:-mt-8 border-4 border-slate-900 ${currentTab === "home"
                        ? "bg-cyan-500 text-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.5)] scale-105"
                        : "bg-slate-800 text-cyan-400 hover:bg-slate-700"
                        }`}
                    aria-label="Início"
                >
                    <HomeIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>

                {/* Leaderboard Tab */}
                <button
                    onClick={() => onChangeTab("leaderboard")}
                    className={`flex flex-col items-center justify-center w-14 sm:w-16 h-full transition-all duration-300 ${currentTab === "leaderboard" ? "text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" : "text-gray-500 hover:text-cyan-200"
                        }`}
                    aria-label="Leaderboard"
                >
                    <ChartIcon className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
                    <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-wider">Social</span>
                </button>

            </div>
        </nav>
    );
};
