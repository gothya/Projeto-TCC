import React, { useState } from "react";

export const DeleteAccountModal: React.FC<{
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}> = ({ onConfirm, onCancel }) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const confirmed = input.trim() === "EXCLUIR";

  const handleConfirm = async () => {
    if (!confirmed) return;
    setLoading(true);
    setError("");
    try {
      await onConfirm();
    } catch {
      setError("Ocorreu um erro ao excluir. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-white leading-tight">
            Excluir participação na pesquisa
          </h2>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-5">
          Você realmente deseja excluir toda sua participação na pesquisa?
          <br />
          <span className="text-red-400 font-medium">Esta ação é permanente e não pode ser desfeita.</span> Todos os seus dados, respostas e progresso serão removidos.
        </p>

        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Escreva <span className="text-red-400 font-bold">EXCLUIR</span> para confirmar
        </label>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="EXCLUIR"
          className="w-full px-3 py-2 rounded-lg text-sm bg-slate-800 border border-slate-600 text-white placeholder-slate-600 focus:outline-none focus:border-red-500/60 transition-colors mb-4"
          autoComplete="off"
          spellCheck={false}
        />

        {error && (
          <p className="text-xs text-red-400 mb-3">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!confirmed || loading}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: confirmed ? "rgba(239,68,68,0.85)" : "rgba(239,68,68,0.2)",
              color: confirmed ? "#fff" : "rgba(239,68,68,0.5)",
              border: "1px solid rgba(239,68,68,0.4)",
            }}
          >
            {loading ? "Excluindo..." : "Excluir tudo"}
          </button>
        </div>
      </div>
    </div>
  );
};
