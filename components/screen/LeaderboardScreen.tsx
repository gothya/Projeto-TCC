import React, { useState, useEffect } from "react";
import { User } from "../data/User";
import { GameState } from "../data/GameState";
import { PodiumItem } from "../PodiumItem";
import { Card } from "../Card";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../services/firebase";

interface LeaderboardScreenProps {
    user: User;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ user }) => {
    const [leaderboardData, setLeaderboardData] = useState<{ nickname: string, points: number, avatar?: string | null }[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Leaderboard Real-time
    useEffect(() => {
        // Limits the query to avoid loading too many users on large databases
        const q = query(collection(db, "users"), orderBy("user.points", "desc"), limit(50));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const players: { nickname: string, points: number, avatar?: string | null }[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data() as GameState;
                if (data.user) {
                    players.push({
                        nickname: data.user.nickname,
                        points: data.user.points || 0,
                        avatar: data.user.avatar,
                    });
                }
            });
            setLeaderboardData(players);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching leaderboard: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full pb-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    // Use real data, merge currentUser if not present? (simplification: if querying limits 50, user might not be there)
    // For the ranking, we will just display what's fetched.
    const allPlayers = leaderboardData.length > 0 ? leaderboardData : [{ nickname: user.nickname, points: user.points, avatar: user.avatar }];

    const topThree = allPlayers.slice(0, 3);
    const restOfPlayers = allPlayers.slice(3);

    // Ancoragem do usuário atual (se ele não estiver no top 50, mostraria na base de qualquer forma)
    const currentUserIndex = allPlayers.findIndex(p => p.nickname === user.nickname);
    const showAnchorUser = currentUserIndex >= 3 || currentUserIndex === -1;

    return (
        <div className="flex flex-col h-full animate-fade-in pb-24 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto relative">
            <div className="text-center mb-4 sm:mb-6 mt-2 sm:mt-4">
                <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">Ranking Global</h2>
                <p className="text-gray-400 text-[10px] sm:text-xs tracking-wider uppercase">Maiores Pontuadores</p>
            </div>

            <div className="flex justify-center items-end gap-1 mb-4 sm:mb-8 px-2 sm:px-4">
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

            <Card className="flex-1 overflow-hidden p-0 bg-slate-900/40 border-cyan-500/20 shadow-xl backdrop-blur-sm rounded-t-3xl border-t border-x mb-0">
                <div className="overflow-y-auto h-full px-4 py-4 space-y-2 pb-[100px]">
                    {restOfPlayers.map((player, index) => {
                        const isCurrentUser = player.nickname === user.nickname;
                        const rank = index + 4;
                        const userHighlight = isCurrentUser
                            ? "bg-cyan-500/20 border-cyan-400 text-white font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]"
                            : "border-transparent bg-slate-800/40 hover:bg-slate-700/60";

                        return (
                            <div
                                key={`${player.nickname}-${index}`}
                                className={`flex items-center justify-between p-2 sm:p-3 rounded-xl border transition-all ${userHighlight}`}
                            >
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <span className={`w-4 sm:w-6 text-center text-[10px] sm:text-sm font-black ${rank <= 10 ? "text-cyan-200" : "text-gray-500"}`}>
                                        #{rank}
                                    </span>
                                    {player.avatar ? (
                                        <img src={player.avatar} alt={player.nickname} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-cyan-500/50 object-cover" />
                                    ) : (
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-700 border border-slate-600 flex justify-center items-center">
                                            <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold">{player.nickname.substring(0, 2).toUpperCase()}</span>
                                        </div>
                                    )}
                                    <span className="truncate max-w-[100px] sm:max-w-[120px] text-xs sm:text-base">{player.nickname}</span>
                                </div>
                                <span className="font-mono text-cyan-400 text-[10px] sm:text-sm font-bold bg-slate-900/50 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md">
                                    {player.points} XP
                                </span>
                            </div>
                        );
                    })}

                    {restOfPlayers.length === 0 && (
                        <div className="text-center text-gray-500 text-sm py-8">
                            Poucos jogadores ainda. Convide amigos para participar!
                        </div>
                    )}
                </div>
            </Card>

            {/* Ancoragem do Usuário (Sticky Footer on Leaderboard) */}
            {showAnchorUser && (
                <div className="fixed bottom-[60px] sm:bottom-20 left-0 right-0 z-40 px-2 sm:px-4">
                    <div className="max-w-max mx-auto w-full max-w-lg md:max-w-2xl bg-slate-800/95 backdrop-blur-md border border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] rounded-2xl p-2 sm:p-3 flex items-center justify-between animate-fade-in-down">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="w-4 sm:w-6 text-center text-[10px] sm:text-sm font-black text-white">
                                #{currentUserIndex !== -1 ? currentUserIndex + 1 : "?"}
                            </span>
                            {user.avatar ? (
                                <img src={user.avatar} alt="You" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-cyan-400 object-cover" />
                            ) : (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-700 border-2 border-cyan-400 flex justify-center items-center">
                                    <span className="text-[10px] sm:text-xs text-cyan-400 font-bold">{user.nickname.substring(0, 2).toUpperCase()}</span>
                                </div>
                            )}
                            <div>
                                <span className="block text-white font-bold text-[10px] sm:text-sm leading-tight">Você</span>
                                <span className="block text-cyan-400 text-[8px] sm:text-[10px] uppercase font-bold tracking-wider">{user.nickname}</span>
                            </div>
                        </div>
                        <span className="font-mono text-cyan-200 text-xs sm:text-base font-black bg-slate-900 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-cyan-500/30">
                            {user.points} XP
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
