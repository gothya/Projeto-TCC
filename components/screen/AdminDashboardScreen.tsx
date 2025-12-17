import React, { useState } from "react";
import { CheckCircleIcon } from "../icons/CheckCircleIcon";
import { UserIcon } from "../icons/UserIcon";
import { BellIcon } from "../icons/BellIcon";
import { ChartBarIcon } from "../icons/ChartBarIcon";
import { DocumentTextIcon } from "../icons/DocumentTextIcon";
import { ADMIN_MOCK_STATS } from "../data/AdminMockStats";

export const AdminDashboardScreen: React.FC<{ onLogout: () => void }> = ({
  onLogout,
}) => {
  const [toast, setToast] = useState<string | null>(null);

  const triggerPing = () => {
    // Simulation of triggering pings
    setToast("Notificações enviadas com sucesso para 118 usuários ativos!");
    setTimeout(() => setToast(null), 3000);
  };

  const StatCard = ({
    label,
    value,
    icon,
    color,
  }: {
    label: string;
    value: string | number;
    icon: any;
    color: string;
  }) => (
    <div
      className={`bg-slate-900/50 p-6 rounded-xl border border-${color}-500/30 flex items-center space-x-4`}
    >
      <div className={`p-3 rounded-full bg-${color}-500/20 text-${color}-400`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className={`text-2xl font-bold text-${color}-400`}>{value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            Painel do Pesquisador
          </h1>
          <p className="text-gray-400">
            Monitoramento do Estudo: Enigma da Mente
          </p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
        >
          Sair
        </button>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-500/90 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in-down flex items-center">
          <CheckCircleIcon className="w-6 h-6 mr-2" />
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          label="Total de Participantes"
          value={ADMIN_MOCK_STATS.totalParticipants}
          icon={<UserIcon className="w-6 h-6" />}
          color="cyan"
        />
        <StatCard
          label="Usuários Ativos (Hoje)"
          value={ADMIN_MOCK_STATS.activeUsersToday}
          icon={<BellIcon className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          label="Taxa de Resposta Global"
          value={`${ADMIN_MOCK_STATS.globalResponseRate}%`}
          icon={<ChartBarIcon className="w-6 h-6" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart / Heatmap */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-cyan-500/20 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-cyan-400 mb-6">
            Mapa de Calor: Taxa de Resposta por Ping
          </h3>
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-8 gap-2 mb-2 text-center text-sm text-gray-400 font-semibold">
                <div>Dia</div>
                {["9h", "11h", "13h", "15h", "17h", "19h", "21h"].map((t) => (
                  <div key={t}>{t}</div>
                ))}
              </div>
              {ADMIN_MOCK_STATS.pingHeatmap.map((dayRates, i) => (
                <div
                  key={i}
                  className="grid grid-cols-8 gap-2 mb-2 items-center"
                >
                  <div className="text-gray-300 font-medium text-center">
                    Dia {i + 1}
                  </div>
                  {dayRates.map((rate, j) => {
                    // Color logic based on rate
                    let bgClass =
                      "bg-red-500/20 text-red-400 border-red-500/30";
                    if (rate >= 80)
                      bgClass =
                        "bg-green-500/20 text-green-400 border-green-500/30";
                    else if (rate >= 50)
                      bgClass =
                        "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

                    return (
                      <div
                        key={j}
                        className={`h-10 rounded-md border flex items-center justify-center text-sm font-bold ${bgClass} transition-all hover:scale-105 cursor-default relative group`}
                      >
                        {rate}%
                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-xs px-2 py-1 rounded border border-gray-600 whitespace-nowrap z-10">
                          {Math.round(
                            (rate / 100) * ADMIN_MOCK_STATS.activeUsersToday
                          )}{" "}
                          respondentes
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500/50 mr-2 rounded"></span>Alta
              Adesão (&gt;80%)
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-yellow-500/50 mr-2 rounded"></span>
              Média Adesão (50-80%)
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-red-500/50 mr-2 rounded"></span>Baixa
              Adesão (&lt;50%)
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="space-y-6">
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
                Disparar Pings Agora
              </button>
              <button className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl transition-all flex items-center justify-center">
                <DocumentTextIcon className="w-5 h-5 mr-3" />
                Exportar Dados (CSV)
              </button>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-gray-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-300 mb-4">
              Feedbacks Recentes
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-slate-800/50 rounded-lg border-l-2 border-yellow-400 text-sm">
                <span className="text-yellow-400 font-bold block mb-1">
                  Problema relatado
                </span>
                <p className="text-gray-400">
                  Participante #42 relatou dificuldade com o slider SAM.
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border-l-2 border-green-400 text-sm">
                <span className="text-green-400 font-bold block mb-1">
                  Sistema
                </span>
                <p className="text-gray-400">
                  Backup de dados realizado com sucesso às 03:00.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
