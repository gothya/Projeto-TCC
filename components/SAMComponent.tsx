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

    return (
      <div className="flex flex-col items-center gap-4 animate-fade-in w-full py-2">
        {/* Figure Section - Larger and Centered */}
        <div className="relative group shrink-0">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
          <div className="relative w-32 h-32 sm:w-48 sm:h-48 bg-slate-800 rounded-full p-4 border-2 border-cyan-400/30 shadow-2xl flex items-center justify-center">
            {responses[type] > 0 ? (
              <SAMDynamicFigure type={type} value={responses[type]} />
            ) : (
              <div className="text-gray-600 text-sm text-center px-4">
                Selecione um nível abaixo
              </div>
            )}
          </div>
        </div>

        {/* Controls Section - Moved Below */}
        <div className="w-full max-w-3xl flex flex-col items-center animate-slide-up">
          <h3 className="text-lg sm:text-xl font-bold text-cyan-300 mb-2 text-center tracking-wide">
            {label}
          </h3>

          <div className="w-full bg-slate-900/80 p-3 sm:p-5 rounded-3xl border border-white/5 backdrop-blur-sm shadow-xl">
            <div className="flex justify-between items-center gap-1 sm:gap-2">
              {values.map((val) => (
                <button
                  key={val}
                  onClick={() => setResponses((p) => ({ ...p, [type]: val }))}
                  aria-label={`${label} nível ${val}`}
                  className={`
                        relative group flex items-center justify-center transition-all duration-300
                        w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl border-2
                        ${responses[type] === val
                      ? "bg-cyan-500 border-cyan-300 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-110 z-10"
                      : "bg-slate-800 border-slate-600 text-gray-400 hover:border-cyan-400/50 hover:text-cyan-200 hover:bg-slate-700 hover:-translate-y-1"
                    }
                    `}
                >
                  <span className="text-sm sm:text-lg font-bold">{val}</span>

                  {/* Tooltip-ish indicator for meaning */}
                  {(val === 1 || val === 9) && (
                    <span className={`absolute -bottom-6 text-[10px] sm:text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400/80 font-medium pointer-events-none`}>
                      {val === 1 ? "Min" : "Max"}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-between w-full mt-2 px-2 text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">
              <span>Baixo</span>
              <span>Alto</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
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
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-2">
        <SAMSlider
          label={currentStepData.label}
          type={currentStepData.type}
        />
      </div>

      {/* Footer - Fixed */}
      <div className="flex-none flex justify-end pt-4 mt-auto border-t border-gray-800/50">
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
