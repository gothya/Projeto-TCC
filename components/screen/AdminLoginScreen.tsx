import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebase";

export const AdminLoginScreen: React.FC<{
  onLoginSuccess: () => void;
  onBack: () => void;
}> = ({ onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, username, password);

      // Strict Admin Check
      if (userCredential.user.email !== import.meta.env.VITE_ADMIN_EMAIL) {
        await auth.signOut();
        throw new Error("unauthorized_admin");
      }

      onLoginSuccess();
    } catch (err: any) {
      console.error("Admin auth failed:", err);
      let msg = "Erro ao autenticar.";
      if (err.message === "unauthorized_admin") msg = "Acesso Negado: Esta conta não possui privilégios de administrador.";
      if (err.code === 'auth/invalid-email') msg = "E-mail inválido.";
      if (err.code === 'auth/user-not-found') msg = "Usuário não encontrado.";
      if (err.code === 'auth/wrong-password') msg = "Senha incorreta.";
      if (err.code === 'auth/invalid-credential') msg = "Credenciais inválidas.";
      setError(msg);
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
              E-mail
            </label>
            <input
              type="email"
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
