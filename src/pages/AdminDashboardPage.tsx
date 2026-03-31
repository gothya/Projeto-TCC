
import { GameState } from "@/src/components/data/GameState";
import { exportToExcel } from "@/src/utils/excelExporter";
import { POSITIVE_ITEMS, NEGATIVE_ITEMS } from "@/src/constants/panas";
import {
    calculateDetailedStatsForUser,
    calculateGlobalAverageStats,
    calculateGlobalPingStats,
    calculateParticipantSummary,
} from "@/src/utils/adminStats";
import { BellIcon } from "@/src/components/icons/BellIcon";
import { ChartBarIcon } from "@/src/components/icons/ChartBarIcon";
import { CheckCircleIcon } from "@/src/components/icons/CheckCircleIcon";
import { ChevronDownIcon } from "@/src/components/icons/ChevronDownIcon";
import { DocumentTextIcon } from "@/src/components/icons/DocumentTextIcon";
import { MagnifyingGlassIcon } from "@/src/components/icons/MagnifyingGlassIcon";
import { UserIcon } from "@/src/components/icons/UserIcon";
import { auth, db } from "@/src/services/firebase";
import { collection, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const AdminDashboardPage: React.FC<{
    
}> = () => {
    const [toast, setToast] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    // All users fetched from Firestore
    const [allUsers, setAllUsers] = useState<GameState[]>([]);
    const [loading, setLoading] = useState(true);

    // Selected User State (for granular view)
    const [selectedUser, setSelectedUser] = useState<GameState | null>(null);
    const [selectedResponseIndex, setSelectedResponseIndex] = useState<number | null>(null); // Unused now


    // Fetch all users on mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "participantes"));
                const usersData: GameState[] = [];
                querySnapshot.forEach((doc) => {
                    // We assume the doc data matches GameState structure
                    const data = doc.data() as GameState;
                    // Normalize: responses may be an object instead of array for some users
                    if (!Array.isArray(data.responses)) {
                        data.responses = [];
                    }
                    usersData.push(data);
                });
                setAllUsers(usersData);
            } catch (error) {
                console.error("Error fetching users:", error);
                setToast("Erro ao carregar dados dos usuários.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        // Reset selection logic handled elsewhere or default to 0
    }, [selectedUser]);

    // Handle Search
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState<GameState[]>([]);

    // Filter users when search term changes
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredUsers(allUsers);
        } else {
            const filtered = allUsers.filter(u =>
                u.user.nickname.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    }, [searchTerm, allUsers]);

    const handleSelectUser = (user: GameState) => {
        setSelectedUser(user);
        setSearchTerm(user.user.nickname);
        setIsDropdownOpen(false);
    };


    // --- CALCULATION LOGIC ---

    const activeUsersCount = allUsers.filter(u => u.hasOnboarded).length;

    // --- RECALCULATE XP LOGIC ---
    const [recalculating, setRecalculating] = useState(false);

    const recalculateAllXp = async () => {
        setRecalculating(true);
        let updated = 0;
        try {
            for (const participant of allUsers) {
                if (!participant.firebaseId) continue;

                const xpFromPings = (participant.pings ?? []).reduce((acc, dayObj) =>
                    acc + (dayObj.statuses ?? []).reduce((dayAcc, status, pingIndex) => {
                        if (status === "completed") return dayAcc + (pingIndex === 6 ? 100 : 50);
                        return dayAcc;
                    }, 0), 0);

                const uniqueDays = new Set((participant.dailyScreenTimeLogs ?? []).map(l => l.date)).size;
                const totalXp = xpFromPings + uniqueDays * 500;
                const newLevel = Math.floor(totalXp / 160) + 1;

                if (participant.user.points !== totalXp || participant.user.level !== newLevel) {
                    const participanteRef = doc(db, "participantes", participant.firebaseId);
                    const leaderboardRef = doc(db, "leaderboard", participant.firebaseId);
                    await Promise.all([
                        updateDoc(participanteRef, {
                            "user.points": totalXp,
                            "user.level": newLevel,
                        }),
                        setDoc(leaderboardRef, { points: totalXp }, { merge: true }),
                    ]);
                    updated++;
                }
            }
            setToast(`✓ ${updated} participante(s) atualizados.`);
        } catch (e) {
            setToast("Erro ao recalcular XP.");
        } finally {
            setRecalculating(false);
            setTimeout(() => setToast(null), 4000);
        }
    };

    // --- EXCEL EXPORT LOGIC ---
    const downloadExcel = () => {
        const result = exportToExcel(allUsers);
        setToast(result.message);
        setTimeout(() => setToast(null), 3000);
    };


    const { totalIssued, totalAnswered, rate: globalResponseRate } = calculateGlobalPingStats(allUsers);


    // Stats for the SELECTED USER (or global if we wanted to aggregate all, but usually detail is per user)
    // The requirements imply browsing a "User's" history.
    // We can calculate "Global Averages" (All users) vs "Selected User Averages".

    const globalStats = calculateGlobalAverageStats(allUsers);

    const selectedUserStats = selectedUser ? calculateDetailedStatsForUser(selectedUser) : null;

    const userSummary = selectedUser ? calculateParticipantSummary(selectedUser) : null;

    // --- THERMOMETER COMPONENT ---
    const ScreenTimeThermometer = ({ minutes }: { minutes: number }) => {
        // Thresholds:
        // Global Avg: 143 mins
        // National Avg: 229 mins
        // Cold: <= 50% of 143 => 71.5 mins

        let colorClass = "text-blue-400"; // Default Cold
        let label = null;
        let icon = "❄️"; // Cold

        if (minutes > 71) {
            colorClass = "text-orange-400"; // Warm/Normal
            icon = "🌡️";
        }

        if (minutes >= 143) {
            colorClass = "text-red-400"; // Hot
            icon = "🔥";
            label = "Acima da média global";
        }

        if (minutes >= 229) {
            colorClass = "text-red-600 animate-pulse"; // Boiling
            icon = "🌋";
            label = "Acima da média nacional";
        }

        return (
            <div className="flex flex-col items-end">
                <div className={`text-3xl font-bold flex items-center gap-2 ${colorClass}`}>
                    <span>{Math.floor(minutes / 60)}h {minutes % 60}m</span>
                    <span className="text-2xl">{icon}</span>
                </div>
                {label && (
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 ${minutes >= 229 ? 'bg-red-900/50 text-red-200 border border-red-500/50' : 'bg-red-900/30 text-red-300 border border-red-500/30'}`}>
                        {label}
                    </span>
                )}
            </div>
        );
    };

    // --- NEW: FULL HISTORY CONSTRUCTION (Completed + Missed) ---
    const getFullHistory = (user: GameState) => {
        const history: {
            label: string;
            dateLabel: string;
            status: "completed" | "missed";
            timestamp?: string; // Real timestamp if completed, or scheduled date if missed
            responseIndex?: number; // Index in user.responses if completed
            data?: any; // The response object itself
        }[] = [];

        // Iterate through pings structure
        const NOTIFICATION_TIMES = ["9h", "11h", "13h", "15h", "17h", "19h", "21h"];

        // We need to map responses to day/ping to know *which* response corresponds to which slot?
        // Actually user.responses has pingDay/pingIndex.
        // Efficient way: Create a map of responses.
        const responseMap = new Map<string, { r: any, index: number }>();
        user.responses.forEach((r, idx) => {
            responseMap.set(`${r.pingDay}-${r.pingIndex}`, { r, index: idx });
        });

        (user.pings || []).forEach((dayObj, dayIdx) => {
            dayObj.statuses.forEach((status, pingIdx) => {
                if (status === "completed" || status === "missed") {
                    const key = `${dayIdx}-${pingIdx}`;
                    const respEntry = responseMap.get(key);

                    // Determine Date/Time Label
                    let dateStr = "";
                    if (respEntry) {
                        dateStr = new Date(respEntry.r.timestamp).toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                    } else {
                        // Estimate date? We don't have start date in GameState usually (it's implicit 7 days).
                        // Or we just show "Ping Perdido".
                        // Let's just show "Dia X (Hora)"
                        dateStr = "Não respondido";
                    }

                    history.push({
                        label: `Dia ${dayIdx + 1} (${NOTIFICATION_TIMES[pingIdx]})`,
                        dateLabel: dateStr,
                        status: status as "completed" | "missed",
                        responseIndex: respEntry?.index,
                        data: respEntry?.r
                    });
                }
            });
        });

        // Sort by "recency" -> Actually the pings loop is Day 0->6. So it's chronological.
        // We want reverse chronological (newest first).
        return history.reverse();
    };

    const historyItems = selectedUser ? getFullHistory(selectedUser) : [];

    // Selected History Item logic
    // We use selectedResponseIndex to store the index in *historyItems* array now?
    // Or kept it as response index?
    // Better: Store index of *historyItems*.
    const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number>(0);

    useEffect(() => {
        if (selectedUser) setSelectedHistoryIndex(0); // Reset to newest on user change
    }, [selectedUser]);

    const selectedItem = (selectedUser && historyItems.length > 0) ? historyItems[selectedHistoryIndex] : null;
    const selectedResponse = selectedItem?.data; // Compatible with existing code expecting 'selectedResponse'


    const [isSendingPing, setIsSendingPing] = useState(false);

    const triggerPing = async () => {

        if (!auth.currentUser) {
            setToast("Erro: Você precisa estar logado.");
            return;
        }

        if (!confirm("Tem certeza que deseja enviar uma notificação para TODOS os usuários?")) {
            return;
        }

        setIsSendingPing(true);
        setToast("Enviando comando para o servidor...");

        try {
            const token = await auth.currentUser.getIdToken();

            const response = await fetch('/api/send-broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: "Hora do Ping! 🔔",
                    body: "Acesse o app para registrar como você está se sentindo agora."
                })
            });

            const data = await response.json();

            if (response.ok) {
                setToast(`Sucesso! Enviado para ${data.sentCount} dispositivos.`);
            } else {
                throw new Error(data.error || "Falha ao enviar");
            }

        } catch (error) {
            console.error("Erro ao disparar ping:", error);
            setToast(`Erro ao enviar: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
        } finally {
            setIsSendingPing(false);
            setTimeout(() => setToast(null), 5000);
        }
    };

    const ScaleVisual = ({ value, max }: { value: number | undefined, max: number }) => (
        <div className="flex gap-1 items-center">
            {Array.from({ length: max }).map((_, i) => {
                const num = i + 1;
                const isSelected = value === num;
                return (
                    <div
                        key={num}
                        className={`
                          w-6 h-6 rounded flex items-center justify-center text-xs font-bold border transition-all
                          ${isSelected
                                ? 'bg-cyan-500 border-cyan-400 text-white scale-110 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                                : 'bg-slate-800 border-slate-700 text-gray-600'
                            }
                      `}
                    >
                        {num}
                    </div>
                )
            })}
        </div>
    );

    const navigate = useNavigate();
    const { user: authUser, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    }

    return (
        <div className="p-4 sm:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                        Painel do Pesquisador
                    </h1>
                    <p className="text-gray-400">Monitoramento do Estudo: Enigma da Mente</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={recalculateAllXp}
                        disabled={recalculating || allUsers.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-lg hover:bg-amber-500/30 transition-colors font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ChartBarIcon className="w-5 h-5" />
                        {recalculating ? "Recalculando..." : "Recalcular XP"}
                    </button>
                    <button
                        onClick={downloadExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 transition-colors font-semibold"
                    >
                        <DocumentTextIcon className="w-5 h-5" />
                        Exportar Excel
                    </button>
                    <button onClick={handleLogout} className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                        Sair
                    </button>
                </div>
            </header>

            {/* Toast */}
            {toast && (
                <div className="fixed top-4 right-4 bg-green-500/90 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in-down flex items-center">
                    <CheckCircleIcon className="w-6 h-6 mr-2" />
                    {toast}
                </div>
            )}

            {/* Global KPI Cards - Expanded */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Main Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-cyan-500/30">
                        <div className="flex items-center space-x-2 mb-2">
                            <UserIcon className="w-5 h-5 text-cyan-400" />
                            <span className="text-gray-400 text-xs uppercase font-bold">Participantes</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{activeUsersCount}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-green-500/30">
                        <div className="flex items-center space-x-2 mb-2">
                            <BellIcon className="w-5 h-5 text-green-400" />
                            <span className="text-gray-400 text-xs uppercase font-bold">Resp. / Total</span>
                        </div>
                        <p className="text-xl font-bold text-green-400">{totalAnswered} <span className="text-sm text-gray-500">/ {totalIssued}</span></p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-purple-500/30">
                        <div className="flex items-center space-x-2 mb-2">
                            <ChartBarIcon className="w-5 h-5 text-purple-400" />
                            <span className="text-gray-400 text-xs uppercase font-bold">Taxa Resp.</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-400">{globalResponseRate}%</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-yellow-500/30">
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="text-yellow-400 text-lg">🌙</span>
                            <span className="text-gray-400 text-xs uppercase font-bold">Sono Médio</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-400">{globalStats.sleepAvg}</p>
                    </div>
                </div>

                {/* Screen Time Global */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-blue-500/30 flex justify-between items-center">
                    <div>
                        <h4 className="text-gray-400 text-xs uppercase font-bold mb-1">Tempo de Tela Médio (Diário)</h4>
                        {/* Using the logic manually for global stats or reusing component if I extracted it. 
                      Since I defined the component inside the render, I can use it here? 
                      No, component definitions inside functional component body is bad practice but "render functions" are okay.
                      Actually I defined it as a const component inside the body, so yes I can use it. */}
                        <ScreenTimeThermometer minutes={Math.round(globalStats.avgScreenTimeRaw || 0)} />
                    </div>
                    <div className="text-right">
                        <h4 className="text-gray-500 text-[10px] uppercase font-bold mb-1">Top Apps (min/dia)</h4>
                        <div className="text-xs text-gray-300 space-y-1">
                            {Object.entries(globalStats.platformAvg).sort(([, a], [, b]) => Number(b) - Number(a)).slice(0, 3).map(([p, m]) => (
                                <div key={p} className="flex justify-end gap-2"><span>{p}</span><span className="font-bold text-blue-300">{m}m</span></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gamification Stats (Global) */}
            <div className="mb-8">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-yellow-500/30 flex justify-between items-center">
                    <div>
                        <h4 className="text-gray-400 text-xs uppercase font-bold mb-2 flex items-center gap-2">🏆 <span className="text-yellow-400">Gamificação Global</span></h4>
                        <div className="flex gap-8">
                            <div>
                                <p className="text-3xl font-bold text-white">{globalStats.avgLevel}</p>
                                <p className="text-[10px] text-gray-500 uppercase">Nível Médio</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-yellow-400">{globalStats.maxLevel}</p>
                                <p className="text-[10px] text-gray-500 uppercase">Nível Máximo</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <h4 className="text-gray-500 text-[10px] uppercase font-bold mb-1">Leaderboard (Top 3) e XP</h4>
                        <div className="text-xs text-gray-300 space-y-1">
                            {[...allUsers].filter(u => u.user).sort((a, b) => (b.user?.points || 0) - (a.user?.points || 0)).slice(0, 3).map((u, i) => (
                                <div key={u.user?.nickname || i} className="flex justify-end gap-2 items-center">
                                    <span className={`${i === 0 ? 'text-yellow-400 font-bold' : ''}`}>{i + 1}. {u.user?.nickname || 'N/A'}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-purple-300 bg-purple-900/30 px-1.5 py-0.5 rounded text-[10px]">Lvl {u.user?.level || 0}</span>
                                        <span className="text-gray-500 text-[10px]">{u.user?.points || 0} XP</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Averages Row (SAM & PANAS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-4 flex justify-between items-center">
                    <span className="text-gray-400 font-bold text-sm">Média Global SAM</span>
                    <div className="flex gap-6">
                        <div className="text-center"><p className="text-lg font-bold text-white">{globalStats.samAvg.valence}</p><p className="text-[10px] text-gray-500 uppercase">Valência</p></div>
                        <div className="text-center"><p className="text-lg font-bold text-white">{globalStats.samAvg.arousal}</p><p className="text-[10px] text-gray-500 uppercase">Alerta</p></div>
                        <div className="text-center"><p className="text-lg font-bold text-white">{globalStats.samAvg.dominance}</p><p className="text-[10px] text-gray-500 uppercase">Dominância</p></div>
                    </div>
                </div>

                <div className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-4 flex justify-between items-center">
                    <span className="text-gray-400 font-bold text-sm">Média Global PANAS</span>
                    <div className="flex gap-6">
                        <div className="text-center"><p className="text-lg font-bold text-cyan-400">{globalStats.panasAvg.pa}</p><p className="text-[10px] text-cyan-500/50 uppercase">Positivos</p></div>
                        <div className="text-center"><p className="text-lg font-bold text-red-400">{globalStats.panasAvg.na}</p><p className="text-[10px] text-red-500/50 uppercase">Negativos</p></div>
                    </div>
                </div>
            </div>


            {/* --- SEARCH / SELECT USER SECTION --- */}
            <div className="mb-8">
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center">
                        <MagnifyingGlassIcon className="w-5 h-5 mr-2 text-cyan-400" />
                        Selecionar Participante para Análise
                    </h3>
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Pesquisar por nickname (ex: Iniciante)..."
                                className="w-full bg-slate-800 border-slate-600 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                                value={searchTerm}
                                autoComplete="off"
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setIsDropdownOpen(true);
                                    if (e.target.value === "") setSelectedUser(null);
                                }}
                                onFocus={() => {
                                    setIsDropdownOpen(true);
                                    if (searchTerm === "") setFilteredUsers(allUsers);
                                }}
                                onClick={() => {
                                    setIsDropdownOpen(true);
                                    if (searchTerm === "") setFilteredUsers(allUsers);
                                }}
                                // Delay hiding to allow click event to register
                                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                            />

                            {/* Autocomplete Dropdown */}
                            {isDropdownOpen && filteredUsers.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                    {filteredUsers.map((u, idx) => (
                                        <div
                                            key={idx}
                                            className="px-4 py-3 hover:bg-slate-700 cursor-pointer flex items-center justify-between border-b border-slate-700/50 last:border-0"
                                            onClick={() => handleSelectUser(u)}
                                        >
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 rounded-full bg-cyan-500 mr-3"></div>
                                                <span className="font-medium text-gray-200">{u.user.nickname}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">{u.responses.length} resp.</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {loading && <p className="text-gray-400 mt-2 animate-pulse">Carregando usuários...</p>}
                    {!loading && isDropdownOpen && searchTerm && filteredUsers.length === 0 && (
                        <p className="text-gray-400 mt-2 italic">Nenhum usuário encontrado.</p>
                    )}
                </div>
            </div>


            {/* --- DETAILED USER VIEW --- */}
            {
                selectedUser ? (
                    <div className="animate-fade-in-up">
                        <div className="flex items-end gap-4 mb-4 border-b border-gray-700 pb-2">
                            <h2 className="text-2xl font-bold text-white">
                                Análise: <span className="text-cyan-400">{selectedUser.user.nickname}</span>
                            </h2>
                            <span className="text-gray-400 text-sm mb-1">
                                {selectedUser.responses.length} respostas registradas
                            </span>
                        </div>

                        {/* --- NEW: PARTICIPANT SUMMARY PANEL --- */}
                        {userSummary && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {/* Pings Summary */}
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <h4 className="text-gray-400 text-xs uppercase font-bold mb-2">Engajamento</h4>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-bold text-white">{userSummary.totalAnswered}</span>
                                        <span className="text-sm text-gray-500 mb-1">/ {userSummary.totalIssued} pings</span>
                                    </div>
                                    <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2">
                                        <div
                                            className="bg-green-500 h-1.5 rounded-full"
                                            style={{ width: `${userSummary.totalIssued > 0 ? (userSummary.totalAnswered / userSummary.totalIssued) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Screen Time Summary */}
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <h4 className="text-gray-400 text-xs uppercase font-bold mb-2">Tempo de Tela (Média Diária)</h4>
                                    <div className="flex justify-between items-start">
                                        <ScreenTimeThermometer minutes={userSummary.screenTime.averageMinutes} />
                                        <div className="text-right">
                                            <span className="text-[10px] text-gray-500 block uppercase">Total Acumulado</span>
                                            <span className="text-sm font-bold text-gray-400">{userSummary.screenTime.totalFormatted}</span>
                                        </div>
                                    </div>

                                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                                        {Object.entries(userSummary.screenTime.breakdown)
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0, 3)
                                            .map(([plat, mins]) => (
                                                <div key={plat} className="flex justify-between">
                                                    <span>{plat}</span>
                                                    <span>{mins} m</span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>

                                {/* Sleep Summary */}
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                    <h4 className="text-gray-400 text-xs uppercase font-bold mb-2">Sono (Média)</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl font-bold text-purple-400">{userSummary.sleep.average}</span>
                                        <span className="text-xs text-gray-500">/ 5.0</span>
                                    </div>
                                    <div className="flex gap-1 mt-3">
                                        {userSummary.sleep.history.slice(-5).map((val, i) => (
                                            <div key={i} className="h-1 w-full rounded-full bg-gray-700 overflow-hidden" title={`Nota: ${val}`}>
                                                <div className={`h-full ${val >= 3 ? 'bg-purple-400' : 'bg-red-400'}`} style={{ opacity: val / 5 }} />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1 text-right">Últimos registros</p>
                                </div>

                                {/* Stress Summary */}
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 overflow-y-auto max-h-32 custom-scrollbar">
                                    <h4 className="text-gray-400 text-xs uppercase font-bold mb-2">Eventos Estressantes ({userSummary.stressLogs.length})</h4>
                                    {userSummary.stressLogs.length > 0 ? (
                                        <ul className="space-y-2">
                                            {userSummary.stressLogs.slice().reverse().map((log, i) => (
                                                <li key={i} className="text-xs text-gray-300 border-l-2 border-red-500/50 pl-2">
                                                    <span className="text-gray-500 block text-[10px]">{log.date}</span>
                                                    {log.text}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-gray-500 italic">Nenhum evento relatado.</p>
                                    )}
                                </div>
                            </div>
                        )}



                        {/* STATS CARDS (User vs Global) */}
                        {selectedUserStats && selectedUserStats.samAverages && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {/* User Average */}
                                <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-gray-200 mb-4">Médias do Usuário (Geral)</h3>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="bg-slate-800/50 p-3 rounded-xl">
                                            <p className="text-2xl font-bold text-cyan-400">{selectedUserStats.samAverages.valence}</p>
                                            <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Valência</p>
                                        </div>
                                        <div className="bg-slate-800/50 p-3 rounded-xl">
                                            <p className="text-2xl font-bold text-cyan-400">{selectedUserStats.samAverages.arousal}</p>
                                            <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Alerta</p>
                                        </div>
                                        <div className="bg-slate-800/50 p-3 rounded-xl">
                                            <p className="text-2xl font-bold text-cyan-400">{selectedUserStats.samAverages.dominance}</p>
                                            <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Dominância</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Global Context */}
                                {/* Removed redundant Screen Time Card */}
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-yellow-500/30">
                                    <h4 className="text-gray-400 text-xs uppercase font-bold mb-2 flex items-center gap-2">🏆 Progresso</h4>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-yellow-400">{selectedUser.user.level}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">Nível</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-white">{selectedUser.user.points}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">XP Total</p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* PANAS STATS */}
                        {selectedUserStats && selectedUserStats.panasAverages && (
                            <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 mb-8">
                                <h3 className="text-lg font-bold text-gray-200 mb-4">PANAS Médio (Escala 10-50)</h3>
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="bg-slate-800/50 p-3 rounded-xl border border-cyan-500/20">
                                        <p className="text-2xl font-bold text-cyan-400">{selectedUserStats.panasAverages.pa}</p>
                                        <p className="text-xs text-cyan-200 uppercase tracking-widest mt-1">Afetos Positivos</p>
                                    </div>
                                    <div className="bg-slate-800/50 p-3 rounded-xl border border-red-500/20">
                                        <p className="text-2xl font-bold text-red-400">{selectedUserStats.panasAverages.na}</p>
                                        <p className="text-xs text-red-200 uppercase tracking-widest mt-1">Afetos Negativos</p>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* PING SELECTOR FOR THIS USER */}
                        <div className="mb-8">
                            <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Histórico de Respostas deste Usuário</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 text-white text-lg rounded-xl p-4 focus:ring-2 focus:ring-cyan-500 outline-none appearance-none cursor-pointer hover:bg-slate-800 transition-colors shadow-lg"
                                    value={selectedHistoryIndex}
                                    onChange={(e) => setSelectedHistoryIndex(Number(e.target.value))}
                                    disabled={!historyItems.length}
                                >
                                    {historyItems.map((item, idx) => (
                                        <option key={idx} value={idx}>
                                            {item.status === 'missed' ? '❌' : '✅'} #{historyItems.length - idx} - {item.label} - {item.dateLabel}
                                        </option>
                                    ))}
                                    {!historyItems.length && <option value="">Nenhum registro encontrado</option>}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                    <ChevronDownIcon className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* --- FIXED VISUAL TABLE (Existing Implementation) --- */}
                        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl mb-8">
                            <div className="bg-slate-800/80 p-4 border-b border-slate-700 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <DocumentTextIcon className="w-5 h-5 text-purple-400" />
                                    Detalhamento Visual: {selectedItem ? selectedItem.label : '-'}
                                </h3>
                                <div className="flex gap-2">
                                    {selectedResponse && (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-700 text-gray-300 border border-slate-600">
                                            {selectedResponse.type === 'end_of_day' ? 'Resumo do Dia' : 'Ping Regular'}
                                        </span>
                                    )}
                                    {selectedItem && (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${selectedItem.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
                                            {selectedItem.status === 'completed' ? 'Respondido Corretamente' : 'Não Respondido'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {selectedItem?.status === 'completed' ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-800/50 text-gray-400 text-xs uppercase tracking-wider border-b border-slate-700">
                                                <th className="p-4 w-1/4">Item / Dimensão</th>
                                                <th className="p-4">Visualização da Escala</th>
                                                <th className="p-4 w-24 text-center">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/50">
                                            {/* SAM ITEMS */}
                                            {selectedResponse?.sam && (
                                                <>
                                                    <tr className="bg-slate-800/20">
                                                        <td className="p-4 font-bold text-cyan-400" colSpan={3}>SAM (Self-Assessment Manikin) - Escala 1-9</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="p-4 text-gray-300 font-medium">Valência (Prazer)</td>
                                                        <td className="p-4"><ScaleVisual max={9} value={selectedResponse.sam.pleasure} /></td>
                                                        <td className="p-4 text-center font-bold text-white text-lg">{selectedResponse.sam.pleasure}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="p-4 text-gray-300 font-medium">Alerta (Excitação)</td>
                                                        <td className="p-4"><ScaleVisual max={9} value={selectedResponse.sam.arousal} /></td>
                                                        <td className="p-4 text-center font-bold text-white text-lg">{selectedResponse.sam.arousal}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="p-4 text-gray-300 font-medium">Dominância</td>
                                                        <td className="p-4"><ScaleVisual max={9} value={selectedResponse.sam.dominance} /></td>
                                                        <td className="p-4 text-center font-bold text-white text-lg">{selectedResponse.sam.dominance}</td>
                                                    </tr>
                                                </>
                                            )}

                                            {/* PANAS ITEMS */}
                                            {selectedResponse?.panas && (
                                                <>
                                                    <tr className="bg-slate-800/20">
                                                        <td className="p-4 font-bold text-purple-400 border-t border-slate-700" colSpan={3}>
                                                            PANAS

                                                            <span className="ml-4 text-sm font-normal text-gray-400">
                                                                Scores:
                                                                <strong className="text-cyan-400 ml-2">PA: {
                                                                    Object.entries(selectedResponse.panas).reduce((acc, [k, v]) => POSITIVE_ITEMS.includes(k) ? acc + Number(v) : acc, 0)
                                                                }</strong>
                                                                <span className="mx-2">|</span>
                                                                <strong className="text-red-400">NA: {
                                                                    Object.entries(selectedResponse.panas).reduce((acc, [k, v]) => NEGATIVE_ITEMS.includes(k) ? acc + Number(v) : acc, 0)
                                                                }</strong>
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    {/* Positive Group */}
                                                    <tr className="bg-cyan-900/10">
                                                        <td className="px-4 py-2 text-xs font-bold text-cyan-500 uppercase tracking-wider" colSpan={3}>Afetos Positivos</td>
                                                    </tr>
                                                    {POSITIVE_ITEMS.map((item) => {
                                                        const val = selectedResponse.panas[item];
                                                        return (
                                                            <tr key={item} className="hover:bg-cyan-900/5 transition-colors">
                                                                <td className="p-4 text-gray-300 pl-8">{item}</td>
                                                                <td className="p-4"><ScaleVisual max={5} value={val} /></td>
                                                                <td className="p-4 text-center font-bold text-cyan-100 text-lg">{val}</td>
                                                            </tr>
                                                        );
                                                    })}

                                                    {/* Negative Group */}
                                                    <tr className="bg-red-900/10">
                                                        <td className="px-4 py-2 text-xs font-bold text-red-500 uppercase tracking-wider" colSpan={3}>Afetos Negativos</td>
                                                    </tr>
                                                    {NEGATIVE_ITEMS.map((item) => {
                                                        const val = selectedResponse.panas[item];
                                                        return (
                                                            <tr key={item} className="hover:bg-red-900/5 transition-colors">
                                                                <td className="p-4 text-gray-300 pl-8">{item}</td>
                                                                <td className="p-4"><ScaleVisual max={5} value={val} /></td>
                                                                <td className="p-4 text-center font-bold text-red-100 text-lg">{val}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </>
                                            )}

                                            {/* END OF DAY REPORT EXTRAS (Sleep, Screen Time, Stress) */}
                                            {selectedResponse?.type === 'end_of_day' && (
                                                <>
                                                    <tr className="bg-slate-800/20">
                                                        <td className="p-4 font-bold text-blue-400 border-t border-slate-700" colSpan={3}>
                                                            Relatório de Fim de Dia
                                                        </td>
                                                    </tr>

                                                    {/* Sleep */}
                                                    <tr>
                                                        <td className="p-4 text-gray-300 font-medium">Qualidade do Sono</td>
                                                        <td className="p-4">
                                                            <div className="flex gap-1 items-center">
                                                                {Array.from({ length: 5 }).map((_, i) => (
                                                                    <div key={i} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold border transition-all ${selectedResponse.sleepQuality === i + 1 ? 'bg-blue-500 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-gray-600'}`}>{i + 1}</div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center font-bold text-white text-lg">{selectedResponse.sleepQuality ?? "-"}</td>
                                                    </tr>

                                                    {/* Screen Time Log */}
                                                    <tr>
                                                        <td className="p-4 text-gray-300 font-medium align-top">Tempo de Tela</td>
                                                        <td className="p-4" colSpan={2}>
                                                            {selectedResponse.screenTimeLog && selectedResponse.screenTimeLog.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {selectedResponse.screenTimeLog.map((log, i) => (
                                                                        <div key={i} className="flex justify-between items-center bg-slate-900/50 p-2 rounded border border-slate-700">
                                                                            <span className="text-sm text-gray-300">{log.platform || "Outros"}</span>
                                                                            <span className="text-sm font-bold text-blue-400">{log.duration} min</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : <span className="text-gray-500 italic">Não informado</span>}
                                                        </td>
                                                    </tr>

                                                    {/* Stress */}
                                                    <tr>
                                                        <td className="p-4 text-gray-300 font-medium align-top">Eventos Estressantes</td>
                                                        <td className="p-4 text-sm text-gray-300 italic" colSpan={2}>
                                                            {selectedResponse.stressfulEvents || "Nenhum evento relatado."}
                                                        </td>
                                                    </tr>
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500 italic">
                                    Nenhum detalhe disponível para este ping não respondido.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/30">
                        <UserIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-400">Nenhum Participante Selecionado</h3>
                        <p className="text-gray-500 mt-2">Utilize a busca acima para encontrar um participante e visualizar seus dados detalhados.</p>
                    </div>
                )
            }

            {/* Control Panel */}
            <div className="space-y-6 mt-12">
                <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-purple-400 mb-4">
                        Controle de Campo
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">
                        Ações manuais para gerenciamento do estudo em tempo real.
                    </p>

                    <div className="space-y-4">
                        <button
                            onClick={triggerPing}
                            disabled={isSendingPing}
                            className={`w-full py-4 px-6 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all transform hover:-translate-y-1 flex items-center justify-center
                ${isSendingPing ? 'bg-purple-800 cursor-wait opacity-70' : 'bg-purple-600 hover:bg-purple-500'}
              `}
                        >
                            {isSendingPing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <BellIcon className="w-6 h-6 mr-3" />
                                    Disparar Pings Agora (Todos os {activeUsersCount} usuários)
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
};
