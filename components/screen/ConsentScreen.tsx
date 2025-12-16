import React, { useState } from "react";
import { RCLE_TEXT } from "../modal/RcleModal";

export const ConsentScreen: React.FC<{
  onConsent: (agreed: boolean) => void;
}> = ({ onConsent }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue">
        <h1 className="text-2xl font-bold text-cyan-400 text-center">
          Bem vindo ao ENIGMA DE PSYLOGOS!
        </h1>
        <h2 className="text-xl font-semibold text-white text-center">
          Registro de Consentimento Livre e Esclarecido
        </h2>
        <div className="h-64 overflow-y-auto p-4 border border-cyan-400/30 rounded-lg bg-black/20 text-gray-300 text-sm">
          <p className="whitespace-pre-wrap">{RCLE_TEXT}</p>
        </div>
        <div className="flex flex-col items-center space-y-6 pt-4">
          <label className="flex items-center space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="sr-only peer"
              aria-describedby="consent-text"
            />
            <span className="w-6 h-6 rounded-md border-2 border-cyan-400/50 flex items-center justify-center transition-all duration-300 group-hover:border-cyan-300 peer-checked:bg-cyan-400 peer-checked:border-cyan-400 peer-checked:shadow-glow-blue-sm">
              {agreed && (
                <svg
                  className="w-4 h-4 text-brand-dark"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </span>
            <span
              id="consent-text"
              className="text-gray-300 group-hover:text-white transition-colors"
            >
              Li e concordo com os termos de participação.
            </span>
          </label>
          <button
            onClick={() => onConsent(agreed)}
            disabled={!agreed}
            className="w-full max-w-xs px-6 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all duration-300 shadow-glow-blue disabled:bg-gray-600/50 disabled:cursor-not-allowed disabled:shadow-none disabled:text-gray-400"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
