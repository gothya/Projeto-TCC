import React from "react";
import { useNavigate } from "react-router-dom";
import { PlexusFace } from "@/src/components/PlexusFace";

export const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue">
        <h1 className="text-3xl font-bold text-cyan-400">ENIGMA DE PSYLOGOS</h1>

        <div className="w-40 h-40 mx-auto">
          <PlexusFace />
        </div>

        <h2 className="text-xl font-semibold text-white">
          Como deseja acessar?
        </h2>
        <p className="text-gray-400 text-sm">
          Sua conta possui acesso de pesquisador e de participante.
        </p>

        <div className="flex flex-col space-y-4">
          <button
            onClick={() => navigate("/admin")}
            className="w-full px-6 py-4 font-bold text-brand-dark bg-gradient-to-r from-purple-500 to-cyan-400 rounded-lg hover:from-purple-400 hover:to-cyan-300 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-3"
          >
            <span className="text-xl">📊</span>
            Entrar como Pesquisador
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full px-6 py-4 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all duration-300 shadow-glow-blue flex items-center justify-center gap-3"
          >
            <span className="text-xl">🎮</span>
            Entrar como Participante
          </button>
        </div>
      </div>
    </div>
  );
};
