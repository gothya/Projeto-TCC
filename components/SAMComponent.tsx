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
      <div className="grid grid-cols-[auto,1fr] gap-2 sm:gap-4 items-center animate-fade-in">
        <div>
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-slate-800 rounded-full p-2 border-2 border-cyan-400/30">
            {responses[type] > 0 && (
              <SAMDynamicFigure type={type} value={responses[type]} />
            )}
          </div>
        </div>
        <div>
          <h3 className="text-base sm:text-xl font-semibold text-cyan-300 mb-2">
            {label}
          </h3>
          <div className="flex justify-between items-center bg-slate-900/70 p-1 sm:p-2 rounded-full space-x-0.5 sm:space-x-1">
            {values.map((val) => (
              <button
                key={val}
                onClick={() => setResponses((p) => ({ ...p, [type]: val }))}
                aria-label={`${label} nível ${val}`}
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-150 transform hover:scale-110 text-xs
                                    ${responses[type] === val
                    ? "bg-cyan-400 border-cyan-300 text-brand-dark font-bold shadow-glow-blue-sm"
                    : "border-gray-600 hover:border-cyan-500 text-gray-400"
                  }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center text-sm text-gray-400 border-b border-gray-700 pb-2 mb-4">
        <span>Passo {currentStep + 1} de {steps.length}</span>
        <div className="flex gap-1">
          {steps.map((_, idx) => (
            <div key={idx} className={`h-1.5 w-6 rounded-full ${idx <= currentStep ? 'bg-cyan-400' : 'bg-gray-700'}`} />
          ))}
        </div>
      </div>

      <SAMSlider
        label={currentStepData.label}
        type={currentStepData.type}
      />

      <div className="flex justify-end pt-4">
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
