import React, { useState } from "react";
import { SamResponse } from "./data/SamResponse";
import { SAMDynamicFigure } from "./SAMDynamicFigure";

export const SAMComponent: React.FC<{
  onComplete: (data: SamResponse) => void;
}> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0); // 0: Pleasure, 1: Arousal, 2: Dominance
  const [responses, setResponses] = useState<SamResponse>({
    pleasure: 0,
    arousal: 0,
    dominance: 0,
  });

  const steps: { label: string; type: "pleasure" | "arousal" | "dominance" }[] = [
    { label: "Prazer / Valência", type: "pleasure" },
    { label: "Excitação / Ativação", type: "arousal" },
    { label: "Dominância", type: "dominance" },
  ];

  const currentStepData = steps[currentStep];
  const canProceed = responses[currentStepData.type] > 0;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(p => p + 1);
    } else {
      onComplete(responses);
    }
  };

  const SAMSlider: React.FC<{
    label: string;
    type: "pleasure" | "arousal" | "dominance";
  }> = ({ label, type }) => {
    const values = Array.from({ length: 9 }).map((_, i) => i + 1);

    const glowColor = responses[type] === 0
      ? "rgba(100,116,139,0.15)"
      : responses[type] <= 3
        ? "rgba(139,92,246,0.25)"
        : responses[type] <= 6
          ? "rgba(34,211,238,0.25)"
          : "rgba(34,211,238,0.45)";

    const getLabels = (t: typeof type) => {
      switch (t) {
        case "pleasure": return { low: "Desprazer", high: "Prazer" };
        case "arousal": return { low: "Calmo", high: "Agitado" };
        case "dominance": return { low: "Submisso", high: "Dominante" };
      }
    };
    const { low, high } = getLabels(type);

    return (
      <div className="flex flex-col items-center w-full gap-3 py-2">

        {/* Figura — elemento central */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div
            className="relative w-full max-w-[280px] aspect-square flex items-center justify-center transition-all duration-500"
            style={{ filter: responses[type] > 0 ? `drop-shadow(0 0 24px ${glowColor})` : "none" }}
          >
            {/* fundo radial sutil */}
            <div
              className="absolute inset-0 rounded-full transition-all duration-500"
              style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
            />
            {responses[type] > 0 ? (
              <SAMDynamicFigure type={type} value={responses[type]} />
            ) : (
              <div className="text-gray-500 text-sm text-center px-8 animate-pulse">
                Selecione um nível abaixo para visualizar
              </div>
            )}
          </div>
        </div>

        {/* Controles */}
        <div className="w-full max-w-2xl flex flex-col items-center gap-2">
          <h3 className="text-base sm:text-lg font-bold text-cyan-300 text-center tracking-wide">
            {label}
          </h3>
          <div className="w-full">
            <div className="flex justify-between items-center gap-1">
              {values.map((val) => (
                <button
                  key={val}
                  onClick={() => setResponses((p) => ({ ...p, [type]: val }))}
                  aria-label={`${label} nível ${val}`}
                  className={`
                    flex items-center justify-center transition-all duration-200
                    w-8 h-8 sm:w-11 sm:h-11 rounded-xl border-2
                    ${responses[type] === val
                      ? "bg-cyan-500 border-cyan-300 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-110 z-10"
                      : "bg-slate-800 border-slate-600 text-gray-400 hover:border-cyan-400/50 hover:text-cyan-200 hover:bg-slate-700"
                    }
                  `}
                >
                  <span className="text-sm sm:text-base font-bold">{val}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between w-full mt-1.5 px-1 text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest">
              <span>{low}</span>
              <span>{high}</span>
            </div>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex-none flex justify-between items-center text-sm text-gray-400 border-b border-gray-700 pb-2 mb-2">
        <span>Passo {currentStep + 1} de {steps.length}</span>
        <div className="flex gap-1">
          {steps.map((_, idx) => (
            <div key={idx} className={`h-1.5 w-6 rounded-full ${idx <= currentStep ? 'bg-cyan-400' : 'bg-gray-700'}`} />
          ))}
        </div>
      </div>

      {/* Botão no topo para garantir visibilidade */}
      <div className="relative flex justify-between items-center py-2 px-2 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 z-10 shrink-0 mb-2 rounded-lg">
        <button
          onClick={() => setCurrentStep((p) => p - 1)}
          disabled={currentStep === 0}
          className={`px-4 py-2 text-sm sm:text-base font-medium text-gray-300 transition-colors hover:text-white
            ${currentStep === 0 ? "invisible" : ""}
          `}
        >
          Voltar
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-6 py-2 text-sm sm:text-base font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors shadow-glow-blue disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {currentStep === steps.length - 1 ? "Concluir" : "Próximo"}
        </button>
      </div>

      {/* Conteúdo — pb-4 ao invés de pb-20 agora que o botão não está no base */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-2 pb-4">
        <SAMSlider
          label={currentStepData.label}
          type={currentStepData.type}
        />
      </div>
    </div>
  );
};
