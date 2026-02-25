import React, { useState } from "react";
import { PlexusFace } from "../PlexusFace";

export const RecoveryLoginScreen: React.FC<{
    onRecover: (code: string) => Promise<boolean | string>;
    onCancel: () => void;
}> = ({ onRecover, onCancel }) => {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!code.trim()) return;
        setLoading(true);
        setError(null);
        const result = await onRecover(code.trim().toUpperCase());
        if (result !== true) {
            setError(typeof result === "string" ? result : "Código inválido ou participante não encontrado.");
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in relative">
            <button
                onClick={onCancel}
                className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
                <span>← Voltar</span>
            </button>

            <div className="w-full max-w-md p-8 space-y-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue pointer-events-auto">
                <h2 className="text-2xl font-bold text-cyan-400">Recuperar Acesso</h2>
                <div className="w-32 h-32 mx-auto my-4 opacity-50">
                    <PlexusFace />
                </div>
                <p className="text-gray-300">
                    Insira o seu Código de Recuperação para continuar de onde parou.
                </p>

                <div className="space-y-4">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="EX: ABCDEF-WXYZ"
                        className="w-full px-4 py-3 text-center text-white bg-slate-800 border-2 border-cyan-500/50 rounded-lg focus:outline-none focus:border-cyan-400 focus:shadow-glow-blue-sm transition-all font-mono text-xl tracking-widest placeholder-gray-600 uppercase"
                        disabled={loading}
                    />

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <button
                        onClick={handleSubmit}
                        disabled={code.length < 5 || loading}
                        className="w-full px-6 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all duration-300 shadow-glow-blue flex justify-center items-center disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-brand-dark"></div>
                        ) : (
                            "Recuperar Conta"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
