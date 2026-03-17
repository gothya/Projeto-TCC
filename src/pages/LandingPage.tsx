import React from "react";
import { PlexusFace } from "../components/PlexusFace";
import { UserIcon } from "../components/icons/UserIcon";
import { useNavigate } from "react-router-dom";

export const LandingPage: React.FC<{
}> = ({ }) => {

  const navigate = useNavigate();

  const goToAdminPage = () => {
    navigate("/admin");
  }

  const goToLoginPage = () => {
    navigate("/login");
  }

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

        <div className="flex flex-col items-center gap-6 w-full px-4">
          {/* Botão principal — destaque total */}
          <button
            onClick={goToLoginPage}
            className="group relative overflow-hidden rounded-2xl w-full max-w-sm bg-cyan-400 p-8 transition-all duration-300 hover:brightness-110 hover:-translate-y-1 active:scale-95"
            style={{ boxShadow: "0 0 32px rgba(34,211,238,0.35)" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <UserIcon className="w-12 h-12 text-slate-900 mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Acessar Jornada
            </h2>
            <p className="text-sm text-slate-700">
              Entre com sua conta e continue de onde parou.
            </p>
          </button>

          {/* Acesso do administrador — discreto, sem destaque */}
          <button
            onClick={goToAdminPage}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors underline underline-offset-2"
          >
            Acesso restrito — área do pesquisador
          </button>
        </div>

        <p className="mt-12 text-xs text-gray-500">
          Desenvolvido para fins de pesquisa científica - UniCEUB
        </p>
      </div>
    </div>
  );
};