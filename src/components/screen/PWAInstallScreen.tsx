import React, { useState } from "react";
import { isIOS, isStandalone } from "@/src/utils/pwaUtils";
import { getInstallPrompt, clearInstallPrompt } from "@/src/utils/installPrompt";

interface PWAInstallScreenProps {
  onContinue: () => void;
}

type View = "prompt" | "ios-instructions" | "skip-hint";

export const PWAInstallScreen: React.FC<PWAInstallScreenProps> = ({ onContinue }) => {
  const ios = isIOS();

  const [view, setView] = useState<View>(ios ? "ios-instructions" : "prompt");
  const [notStandaloneWarning, setNotStandaloneWarning] = useState(false);

  // Já está instalado — pula
  if (isStandalone()) {
    onContinue();
    return null;
  }

  const handleInstall = async () => {
    const prompt = getInstallPrompt();
    if (!prompt) {
      // Sem prompt disponível (PWA não elegível ou já instalado): feedback visual
      setView("skip-hint");
      return;
    }
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    clearInstallPrompt();
    if (outcome === "accepted") {
      onContinue();
    }
    // Se recusou: permanece na tela — usuário pode pular via botão
  };

  const handleSkip = () => {
    setView("skip-hint");
  };

  const handleIosContinue = () => {
    if (!isStandalone()) {
      setNotStandaloneWarning(true);
      return;
    }
    onContinue();
  };

  // --- Tela principal (Android / Desktop) ---
  if (view === "prompt") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in">
        <div className="w-full max-w-md p-8 space-y-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue">

          <div className="text-5xl">📲</div>

          <h2 className="text-2xl font-bold text-cyan-400">
            Instale o Psylogos
          </h2>

          <p className="text-gray-300 text-sm leading-relaxed">
            Incentivamos que você baixe nosso app para receber as notificações de ping no horário certo.
            Mas caso não queira, pode optar por não baixar. Porém, dessa forma, não poderemos te notificar automaticamente.
          </p>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleInstall}
              className="w-full px-6 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all duration-300 shadow-glow-blue"
            >
              Instalar o app
            </button>
            <button
              onClick={handleSkip}
              className="w-full px-6 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Continuar sem instalar
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- Instruções iOS ---
  if (view === "ios-instructions") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in">
        <div className="w-full max-w-md p-8 space-y-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue">

          <div className="text-5xl">📲</div>

          <h2 className="text-2xl font-bold text-cyan-400">
            Como instalar no iPhone
          </h2>

          <div className="text-left space-y-3 bg-slate-800/60 rounded-xl p-4 border border-cyan-400/10">
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0">1.</span>
                Toque no ícone de compartilhar{" "}
                <span className="inline-block bg-slate-700 rounded px-1 text-xs font-mono">⬆</span>{" "}
                na barra do Safari
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0">2.</span>
                Role para baixo e toque em{" "}
                <span className="font-semibold text-white">"Adicionar à Tela de Início"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0">3.</span>
                Toque em{" "}
                <span className="font-semibold text-white">"Adicionar"</span>{" "}
                no canto superior direito
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0">4.</span>
                Abra o app pelo ícone na tela inicial e toque em{" "}
                <span className="font-semibold text-white">"Já instalei"</span>{" "}
                abaixo
              </li>
            </ol>
          </div>

          {notStandaloneWarning && (
            <p className="text-yellow-400 text-sm">
              O app ainda está abrindo pelo Safari. Siga os passos acima e reabra pelo ícone na tela inicial.
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={handleIosContinue}
              className="w-full px-6 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all duration-300 shadow-glow-blue"
            >
              Já instalei ✓
            </button>
            <button
              onClick={handleSkip}
              className="w-full px-6 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Continuar sem instalar
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- Hint após recusar ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue">

        <div className="text-5xl">⏰</div>

        <h2 className="text-xl font-bold text-white">
          Tudo bem, sem notificações!
        </h2>

        <p className="text-gray-300 text-sm leading-relaxed">
          Você também pode configurar <span className="text-cyan-400 font-semibold">alarmes no seu celular</span> durante
          esses 7 dias de jornada para lembrar da hora de responder.
        </p>

        <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-400/10 text-left">
          <p className="text-xs text-cyan-400 font-semibold uppercase tracking-widest mb-2">
            Dica de compromisso
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">
            Se quiser, você pode se comprometer com apenas{" "}
            <span className="text-white font-semibold">3 respostas por dia</span> para
            receber seu{" "}
            <span className="text-cyan-400 font-semibold">Relatório de Jornada</span>{" "}
            ao final!
          </p>
        </div>

        <button
          onClick={onContinue}
          className="w-full px-6 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all duration-300 shadow-glow-blue"
        >
          Entendido, vamos começar!
        </button>

      </div>
    </div>
  );
};
