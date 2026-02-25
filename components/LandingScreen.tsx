import React from "react";
import { PlexusFace } from "./PlexusFace";
import { UserIcon } from "./icons/UserIcon";
import { ChartBarIcon } from "./icons/ChartBarIcon";

export const LandingScreen: React.FC<{
  onUserSelect: () => void;
  onAdminSelect: () => void;
  onRecoverSelect?: () => void;
}> = ({ onUserSelect, onAdminSelect, onRecoverSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="z-10 text-center max-w-2xl w-full">
        <div className="w-48 h-48 mx-auto mb-8 animate-slow-spin-slow">
          <PlexusFace />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
          PSYLOGOS
        </h1>
        <p className="text-xl text-cyan-200 mb-12 tracking-wider">
          O Enigma da Mente
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4">
          <button
            onClick={onUserSelect}
            className="group relative overflow-hidden rounded-2xl bg-slate-800/50 border border-cyan-400/30 p-8 hover:bg-slate-800/80 transition-all duration-300 hover:shadow-glow-blue hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <UserIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-xl font-bold text-white mb-2">
              Sou Participante
            </h2>
            <p className="text-sm text-gray-400">
              Acesse sua jornada, responda aos pings e acompanhe seu progresso.
            </p>
          </button>

          <button
            onClick={onAdminSelect}
            className="group relative overflow-hidden rounded-2xl bg-slate-800/50 border border-purple-400/30 p-8 hover:bg-slate-800/80 transition-all duration-300 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <ChartBarIcon className="w-12 h-12 text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-xl font-bold text-white mb-2">
              Sou Pesquisador
            </h2>
            <p className="text-sm text-gray-400">
              Acesse o painel administrativo para monitorar o estudo e dados.
            </p>
          </button>
        </div>

        {onRecoverSelect && (
          <div className="mt-8 flex flex-col items-center">
            <p className="text-gray-400 text-sm mb-3">Já participava e perdeu o acesso?</p>
            <button
              onClick={onRecoverSelect}
              className="px-6 py-2 border border-cyan-500/30 text-cyan-300 rounded-full hover:bg-cyan-500/10 transition-colors text-sm"
            >
              Recuperar com Código
            </button>
          </div>
        )}

        <p className="mt-12 text-xs text-gray-500">
          Desenvolvido para fins de pesquisa científica - UniCEUB
        </p>
      </div>
    </div>
  );
};
