import React, { useState } from "react";

export const AdminLoginScreen: React.FC<{
  onLoginSuccess: () => void;
  onBack: () => void;
}> = ({ onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: extrair para banco de dados
    if (username === "Thiago" && password === "psicólogo") {
      onLoginSuccess();
    } else {
      setError("Credenciais inválidas. Tente novamente.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white mb-4 flex items-center text-sm"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Voltar
        </button>
        <h2 className="text-2xl font-bold text-purple-400 text-center mb-6">
          Acesso Administrativo
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-purple-300 text-sm font-bold mb-2">
              Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-purple-500/30 rounded focus:outline-none focus:border-purple-500 focus:shadow-[0_0_8px_rgba(168,85,247,0.4)] text-white transition-all"
            />
          </div>
          <div>
            <label className="block text-purple-300 text-sm font-bold mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-purple-500/30 rounded focus:outline-none focus:border-purple-500 focus:shadow-[0_0_8px_rgba(168,85,247,0.4)] text-white transition-all"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full px-6 py-3 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-500 transition-all duration-300 shadow-[0_0_10px_rgba(147,51,234,0.5)] mt-4"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};
