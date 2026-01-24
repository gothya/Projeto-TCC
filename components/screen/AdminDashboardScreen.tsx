import React, { useState, useEffect } from "react";
import { CheckCircleIcon } from "../icons/CheckCircleIcon";
import { GameState } from "../data/GameState";
import { MagnifyingGlassIcon } from "../icons/MagnifyingGlassIcon";
import { UserIcon } from "../icons/UserIcon";
import { BellIcon } from "../icons/BellIcon";
import { ChartBarIcon } from "../icons/ChartBarIcon";
import { DocumentTextIcon } from "../icons/DocumentTextIcon";
import { ChevronDownIcon } from "../icons/ChevronDownIcon";
import { ChevronUpIcon } from "../icons/ChevronUpIcon";
import { PANAS_ITEMS } from "../data/PanasItems";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";

export const AdminDashboardScreen: React.FC<{
  onLogout: () => void;
}> = ({ onLogout }) => {
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  // All users fetched from Firestore
  const [allUsers, setAllUsers] = useState<GameState[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected User State (for granular view)
  const [selectedUser, setSelectedUser] = useState<GameState | null>(null);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState<number | null>(null);

  // Fetch all users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData: GameState[] = [];
        querySnapshot.forEach((doc) => {
          // We assume the doc data matches GameState structure
          usersData.push(doc.data() as GameState);
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

  // Update selected ping index when selected user changes
  useEffect(() => {
    if (selectedUser && selectedUser.responses && selectedUser.responses.length > 0) {
      setSelectedResponseIndex(selectedUser.responses.length - 1);
    } else {
      setSelectedResponseIndex(null);
    }
  }, [selectedUser]);

  // Handle Search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSelectedUser(null);
      return;
    }
    const found = allUsers.find(u =>
      u.user.nickname.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (found) setSelectedUser(found);
  }, [searchTerm, allUsers]);


  // --- CALCULATION LOGIC ---

  const activeUsersCount = allUsers.length;

  const calculateGlobalResponseRate = () => {
    if (allUsers.length === 0) return 0;

    let totalRateSum = 0;

    allUsers.forEach(user => {
      let totalPings = 0;
      let answeredPings = 0;
      user.pings.forEach(day => {
        if (day.statuses) {
          day.statuses.forEach(status => {
            if (status !== "pending") {
              totalPings++;
              if (status === "completed") answeredPings++;
            }
          });
        }
      });
      const rate = totalPings === 0 ? 0 : (answeredPings / totalPings);
      totalRateSum += rate;
    });

    return Math.round((totalRateSum / allUsers.length) * 100);
  };

  const globalResponseRate = calculateGlobalResponseRate();


  // Stats for the SELECTED USER (or global if we wanted to aggregate all, but usually detail is per user)
  // The requirements imply browsing a "User's" history.
  // We can calculate "Global Averages" (All users) vs "Selected User Averages".

  const calculateGlobalAverageStats = () => {
    let samTotals = { valence: 0, arousal: 0, dominance: 0, count: 0 };
    // We can also aggregate PANAS globally if needed

    allUsers.forEach(user => {
      user.responses.forEach(r => {
        if (r.sam) {
          samTotals.valence += r.sam.valence;
          samTotals.arousal += r.sam.arousal;
          samTotals.dominance += r.sam.dominance;
          samTotals.count++;
        }
      });
    });

    return samTotals.count > 0 ? {
      valence: (samTotals.valence / samTotals.count).toFixed(1),
      arousal: (samTotals.arousal / samTotals.count).toFixed(1),
      dominance: (samTotals.dominance / samTotals.count).toFixed(1),
    } : { valence: "0.0", arousal: "0.0", dominance: "0.0" };
  };

  const globalStats = calculateGlobalAverageStats();


  // Stats for the SPECIFIC user being viewed
  const calculateDetailedStatsForUser = (user: GameState) => {
    if (!user.responses || user.responses.length === 0) return null;
    let samTotals = { valence: 0, arousal: 0, dominance: 0, count: 0 };
    let panasTotals: { [key: string]: { sum: number; count: number } } = {};

    user.responses.forEach(r => {
      if (r.sam) {
        samTotals.valence += r.sam.pleasure;
        samTotals.arousal += r.sam.arousal;
        samTotals.dominance += r.sam.dominance;
        samTotals.count++;
      }
      if (r.panas) {
        Object.entries(r.panas).forEach(([key, value]) => {
          if (key !== 'positiveAffect' && key !== 'negativeAffect') {
            if (!panasTotals[key]) panasTotals[key] = { sum: 0, count: 0 };
            panasTotals[key].sum += value;
            panasTotals[key].count++;
          }
        });
      }
    });

    const samAverages = samTotals.count > 0 ? {
      valence: (samTotals.valence / samTotals.count).toFixed(1),
      arousal: (samTotals.arousal / samTotals.count).toFixed(1),
      dominance: (samTotals.dominance / samTotals.count).toFixed(1),
    } : null;

    const panasAverages = Object.entries(panasTotals)
      .map(([key, data]) => ({
        item: key,
        average: (data.sum / data.count).toFixed(1)
      }))
      .sort((a, b) => parseFloat(b.average) - parseFloat(a.average));

    return { samAverages, panasAverages };
  };

  const selectedUserStats = selectedUser ? calculateDetailedStatsForUser(selectedUser) : null;
  const selectedResponse = (selectedUser && selectedResponseIndex !== null) ? selectedUser.responses[selectedResponseIndex] : null;


  const triggerPing = () => {
    setToast(`Notificações enviadas para ${activeUsersCount} usuários!`);
    setTimeout(() => setToast(null), 3000);
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
        <button onClick={onLogout} className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
          Sair
        </button>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-500/90 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in-down flex items-center">
          <CheckCircleIcon className="w-6 h-6 mr-2" />
          {toast}
        </div>
      )}

      {/* Global KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/50 p-6 rounded-xl border border-cyan-500/30 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-cyan-500/20 text-cyan-400"><UserIcon className="w-6 h-6" /></div>
          <div><p className="text-gray-400 text-sm">Participantes</p><p className="text-2xl font-bold text-cyan-400">{activeUsersCount}</p></div>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-xl border border-green-500/30 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-green-500/20 text-green-400"><BellIcon className="w-6 h-6" /></div>
          <div><p className="text-gray-400 text-sm">Pings Globais</p><p className="text-2xl font-bold text-green-400">{activeUsersCount * 42}</p></div>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-xl border border-purple-500/30 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-purple-500/20 text-purple-400"><ChartBarIcon className="w-6 h-6" /></div>
          <div><p className="text-gray-400 text-sm">Taxa de Resposta</p><p className="text-2xl font-bold text-purple-400">{globalResponseRate}%</p></div>
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
            <input
              type="text"
              placeholder="Pesquisar por nickname (ex: Iniciante)..."
              className="flex-1 bg-slate-800 border-slate-600 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {loading && <p className="text-gray-400 mt-2 animate-pulse">Carregando usuários...</p>}
          {!loading && searchTerm && !selectedUser && (
            <p className="text-gray-400 mt-2 italic">Nenhum usuário encontrado.</p>
          )}
        </div>
      </div>


      {/* --- DETAILED USER VIEW --- */}
      {selectedUser ? (
        <div className="animate-fade-in-up">
          <div className="flex items-end gap-4 mb-4 border-b border-gray-700 pb-2">
            <h2 className="text-2xl font-bold text-white">
              Análise: <span className="text-cyan-400">{selectedUser.user.nickname}</span>
            </h2>
            <span className="text-gray-400 text-sm mb-1">
              {selectedUser.responses.length} respostas registradas
            </span>
          </div>

          {/* PING SELECTOR FOR THIS USER */}
          <div className="mb-8">
            <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Histórico de Respostas deste Usuário</label>
            <div className="relative">
              <select
                className="w-full bg-slate-900 border border-slate-700 text-white text-lg rounded-xl p-4 focus:ring-2 focus:ring-cyan-500 outline-none appearance-none cursor-pointer hover:bg-slate-800 transition-colors shadow-lg"
                value={selectedResponseIndex ?? ""}
                onChange={(e) => setSelectedResponseIndex(Number(e.target.value))}
                disabled={!selectedUser.responses.length}
              >
                {selectedUser.responses.slice().reverse().map((r, idx) => {
                  const realIndex = selectedUser.responses.length - 1 - idx;
                  const date = new Date(r.timestamp).toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                  return (
                    <option key={realIndex} value={realIndex}>
                      #{realIndex + 1} - Dia {r.pingDay + 1} ({["9h", "11h", "13h", "15h", "17h", "19h", "21h"][r.pingIndex]}) - {date}
                    </option>
                  )
                })}
                {!selectedUser.responses.length && <option value="">Nenhuma resposta registrada para este usuário</option>}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                <ChevronDownIcon className="w-5 h-5" />
              </div>
            </div>
          </div>

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
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 opacity-75">
                <h3 className="text-lg font-bold text-gray-400 mb-4">Comparativo Global (Todos os Participantes)</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold text-gray-300">{globalStats.valence}</p>
                    <p className="text-xs text-gray-500">Média Valência</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-300">{globalStats.arousal}</p>
                    <p className="text-xs text-gray-500">Média Alerta</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-300">{globalStats.dominance}</p>
                    <p className="text-xs text-gray-500">Média Dominância</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- FIXED VISUAL TABLE (Existing Implementation) --- */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl mb-8">
            <div className="bg-slate-800/80 p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-purple-400" />
                Detalhamento Visual: Ping #{selectedResponseIndex! + 1}
              </h3>
            </div>

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
                  <tr className="bg-slate-800/20">
                    <td className="p-4 font-bold text-cyan-400" colSpan={3}>SAM (Self-Assessment Manikin) - Escala 1-9</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-gray-300 font-medium">Valência (Prazer)</td>
                    <td className="p-4"><ScaleVisual max={9} value={selectedResponse?.sam?.pleasure} /></td>
                    <td className="p-4 text-center font-bold text-white text-lg">{selectedResponse?.sam?.pleasure ?? "-"}</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-gray-300 font-medium">Alerta (Excitação)</td>
                    <td className="p-4"><ScaleVisual max={9} value={selectedResponse?.sam?.arousal} /></td>
                    <td className="p-4 text-center font-bold text-white text-lg">{selectedResponse?.sam?.arousal ?? "-"}</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-gray-300 font-medium">Dominância</td>
                    <td className="p-4"><ScaleVisual max={9} value={selectedResponse?.sam?.dominance} /></td>
                    <td className="p-4 text-center font-bold text-white text-lg">{selectedResponse?.sam?.dominance ?? "-"}</td>
                  </tr>

                  {/* PANAS ITEMS */}
                  <tr className="bg-slate-800/20">
                    <td className="p-4 font-bold text-purple-400" colSpan={3}>PANAS - Escala 1-5</td>
                  </tr>
                  {PANAS_ITEMS.map((item) => {
                    const val = selectedResponse?.panas?.[item];
                    return (
                      <tr key={item} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-gray-300">{item}</td>
                        <td className="p-4"><ScaleVisual max={5} value={val} /></td>
                        <td className="p-4 text-center font-bold text-white text-lg">{val ?? "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>


        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/30">
          <UserIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400">Nenhum Participante Selecionado</h3>
          <p className="text-gray-500 mt-2">Utilize a busca acima para encontrar um participante e visualizar seus dados detalhados.</p>
        </div>
      )}

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
              className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all transform hover:-translate-y-1 flex items-center justify-center"
            >
              <BellIcon className="w-6 h-6 mr-3" />
              Disparar Pings Agora (Todos os {activeUsersCount} usuários)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
