import React, { useState } from "react";
import UserService from "@/src/service/user/UserService";

const RATING_OPTIONS = [
  { value: 1, emoji: "😞", label: "Muito ruim" },
  { value: 2, emoji: "😕", label: "Ruim" },
  { value: 3, emoji: "😐", label: "Regular" },
  { value: 4, emoji: "😊", label: "Bom" },
  { value: 5, emoji: "🤩", label: "Excelente" },
];

const STANDARD_FIELDS: { key: "liked" | "disliked" | "suggestion"; label: string }[] = [
  { key: "liked",      label: "O que você mais curtiu na jornada?" },
  { key: "disliked",   label: "Teve algo que não gostou ou não entendeu?" },
  { key: "suggestion", label: "Se pudesse mudar algo para os próximos pesquisadores, o que seria?" },
];

type Props = {
  firebaseId: string;
  nickname: string;
  alreadyDone: boolean;
  onSubmitDone: () => void;
};

export const PostStudyLockScreen: React.FC<Props> = ({ firebaseId, nickname, alreadyDone, onSubmitDone }) => {
  const [rating, setRating]           = useState<number | null>(null);
  const [liked, setLiked]             = useState("");
  const [disliked, setDisliked]       = useState("");
  const [suggestion, setSuggestion]   = useState("");
  const [freeComment, setFreeComment] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const setters: Record<string, React.Dispatch<React.SetStateAction<string>>> = {
    liked: setLiked,
    disliked: setDisliked,
    suggestion: setSuggestion,
  };
  const values: Record<string, string> = { liked, disliked, suggestion };

  const handleSubmit = async () => {
    if (!rating) {
      setError("Selecione uma nota para continuar.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await UserService.saveReactionEvaluation(firebaseId, {
        rating, liked, disliked, suggestion, freeComment, nickname,
      });
      onSubmitDone();
    } catch {
      setError("Erro ao enviar. Tente novamente.");
      setLoading(false);
    }
  };

  if (alreadyDone) {
    return <ThankYouScreen />;
  }

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col overflow-y-auto rounded-2xl backdrop-blur-sm"
      style={{ background: "rgba(5,10,25,0.95)", border: "1px solid rgba(34,211,238,0.15)" }}
    >
      <div className="flex flex-col p-6">
        {/* Lore intro */}
        <div className="flex flex-col items-center text-center mb-7">
          <span className="text-5xl mb-4">🔮</span>
          <h2 className="text-lg font-bold text-white mb-2">Deixe sua mensagem para o Psylogos</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Sua jornada terminou, mas ainda há uma última coisa.<br />
            Queremos saber como foi a sua experiência.<br />
            E talvez sua mensagem inspire outras pessoas!
          </p>
        </div>

        {/* Rating */}
        <p className="text-white font-semibold text-sm mb-3 text-center">
          Como você avalia sua experiência geral?{" "}
          <span className="text-red-400">*</span>
        </p>
        <div className="flex justify-center gap-2 mb-7 flex-wrap">
          {RATING_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRating(opt.value)}
              className="flex flex-col items-center p-3 rounded-xl border transition-all"
              style={{
                borderColor: rating === opt.value ? "#22d3ee" : "rgba(51,65,85,0.8)",
                background:  rating === opt.value ? "rgba(34,211,238,0.12)" : "rgba(15,23,42,0.6)",
              }}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-xs text-slate-400 mt-1">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Campos padrão */}
        {STANDARD_FIELDS.map(({ key, label }) => (
          <div key={key} className="mb-4">
            <label className="block text-slate-400 text-xs mb-1">{label}</label>
            <textarea
              value={values[key]}
              onChange={e => setters[key](e.target.value)}
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none resize-none"
              style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(51,65,85,0.8)" }}
              placeholder="Opcional..."
            />
          </div>
        ))}

        {/* Campo destacado — mensagem para futuros participantes */}
        <div
          className="mb-5 p-4 rounded-xl"
          style={{
            background: "linear-gradient(135deg, rgba(129,140,248,0.08), rgba(34,211,238,0.06))",
            border: "1px solid rgba(129,140,248,0.35)",
          }}
        >
          <div className="flex items-start gap-2 mb-2">
            <span className="text-lg">✉️</span>
            <div>
              <p className="text-white font-semibold text-sm leading-snug">
                Deixe um recado para os participantes do futuro
              </p>
              <p className="text-slate-300 text-xs leading-relaxed mt-1">
                Nós do Instituto ARC vamos levar sua mensagem aos próximos participantes do Enigma de Psylogos!
              </p>
              <p
                className="text-xs mt-2 font-medium"
                style={{ color: "rgba(34,211,238,0.75)" }}
              >
                🌐 Sua mensagem será publicada no site do Psylogos com sua assinatura como explorador.
              </p>
            </div>
          </div>
          <textarea
            value={freeComment}
            onChange={e => setFreeComment(e.target.value)}
            rows={4}
            className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none resize-none mt-1"
            style={{
              background: "rgba(10,16,35,0.7)",
              border: "1px solid rgba(129,140,248,0.3)",
            }}
            placeholder="O que você diria a quem está prestes a começar esta jornada?"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs text-center mb-3">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm text-slate-900 transition-opacity disabled:opacity-50 mt-1"
          style={{ background: "linear-gradient(135deg, #22d3ee, #818cf8)" }}
        >
          {loading ? "Enviando..." : "✦ Deixar impressão"}
        </button>
      </div>
    </div>
  );
};

const ThankYouScreen: React.FC = () => (
  <div
    className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 rounded-2xl backdrop-blur-sm text-center"
    style={{ background: "rgba(5,10,25,0.95)", border: "1px solid rgba(34,211,238,0.15)" }}
  >
    <span className="text-5xl mb-5">✨</span>
    <h2 className="text-lg font-bold text-white mb-3">Mensagem recebida.</h2>
    <p className="text-slate-400 text-sm leading-relaxed">
      O Psylogos processou sua impressão.<br />
      Obrigado por fazer parte desta jornada, Pesquisador.<br />
      Até o próximo enigma.
    </p>
    <p className="mt-6 text-xs" style={{ color: "rgba(34,211,238,0.5)" }}>— Instituto ARC</p>
  </div>
);
