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
    { label: "Valência", type: "pleasure" },
    { label: "Ativação", type: "arousal" },
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

    return (
      <div className="flex flex-col items-center justify-between h-full w-full py-1">
        {/* Figure Section - Maximized */}
        <div className="relative group shrink-0 flex-1 flex items-center justify-center min-h-0">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 to-transparent rounded-full opacity-0 pointer-events-none"></div>
          <div className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-60 md:h-60 bg-slate-800 rounded-full p-2 sm:p-4 border-2 border-cyan-400/30 shadow-[0_0_30px_rgba(34,211,238,0.1)] flex items-center justify-center transition-all duration-500">
            {responses[type] > 0 ? (
              <SAMDynamicFigure type={type} value={responses[type]} />
            ) : (
              <div className="text-gray-500 text-sm text-center px-8 animate-pulse">
                Selecione um nível abaixo para visualizar
              </div>
            )}
          </div>
        </div>

        {/* Controls Section - Moved to Bottom Base */}
        <div className="w-full max-w-2xl flex flex-col items-center animate-slide-up bg-slate-900/40 p-2 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/5 mt-1 sm:mt-2">
          <h3 className="text-sm sm:text-2xl font-bold text-cyan-300 mb-1 sm:mb-3 text-center tracking-wide drop-shadow-sm">
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
                        relative group flex items-center justify-center transition-all duration-200
                        w-8 h-8 sm:w-12 sm:h-12 rounded-xl border-2
                        ${responses[type] === val
                      ? "bg-cyan-500 border-cyan-300 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-110 z-10"
                      : "bg-slate-800 border-slate-600 text-gray-400 hover:border-cyan-400/50 hover:text-cyan-200 hover:bg-slate-700"
                    }
                    `}
                >
                  <span className="text-sm sm:text-lg font-bold">{val}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between w-full mt-2 px-1 text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest">
              <span>Baixo</span>
              <span>Alto</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header - Fixed */}
      <div className="flex-none flex justify-between items-center text-sm text-gray-400 border-b border-gray-700 pb-2 mb-2">
        <span>Passo {currentStep + 1} de {steps.length}</span>
        <div className="flex gap-1">
          {steps.map((_, idx) => (
            <div key={idx} className={`h-1.5 w-6 rounded-full ${idx <= currentStep ? 'bg-cyan-400' : 'bg-gray-700'}`} />
          ))}
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-1 sm:py-2">
        <SAMSlider
          label={currentStepData.label}
          type={currentStepData.type}
        />
      </div>

      {/* Footer - Fixed */}
      <div className="flex-none flex justify-end pt-2 sm:pt-4 mt-auto border-t border-gray-800/50">
        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep(p => p - 1)}
            className="mr-auto px-6 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Voltar
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-8 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors shadow-glow-blue disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {currentStep === steps.length - 1 ? "Concluir" : "Próximo"}
        </button>
      </div>
    </div>
  );
};
