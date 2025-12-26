import React, { useState } from "react";
import { PanasResponse } from "./data/PanasResponse";
import { PANAS_ITEMS } from "./data/PanasItems";

export const PANASComponent: React.FC<{
  question: string;
  onComplete: (data: PanasResponse) => void;
}> = ({ question, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<PanasResponse>(() => {
    const initialResponses: PanasResponse = {};
    PANAS_ITEMS.forEach((item) => {
      // Default to 0 or 1? Usually standard PANAS starts empty or 1.
      // Providing 0 allows checking if answered, but 1 is "very slightly or not at all".
      // Let's safe initialize to 0 so we can force user interaction, or 1 if we assume default.
      // Re-reading code: previous used 1. Let's stick to 1 but maybe init as 0 to force choice if needed?
      // Actually user asked for a flow, let's keep it simple: init 0 to show "unselected" state if we want,
      // or 1. Let's use 0 to require interaction for better data quality?
      // "scale 1-5". 
      initialResponses[item] = 1;
    });
    return initialResponses;
  });

  const ITEMS_PER_STEP = 4;
  const totalSteps = Math.ceil(PANAS_ITEMS.length / ITEMS_PER_STEP);

  const currentItems = PANAS_ITEMS.slice(
    currentStep * ITEMS_PER_STEP,
    (currentStep + 1) * ITEMS_PER_STEP
  );

  // Check if all items in current step have been answered (> 0)
  const canProceed = currentItems.every((item) => responses[item] > 0);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete(responses);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const VolumeSlider: React.FC<{
    value: number;
    onChange: (val: number) => void;
  }> = ({ value, onChange }) => {
    return (
      <div className="flex items-end gap-1 h-12">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`w-full rounded-t-sm transition-all duration-200 ease-out border-b-0
              ${value >= level
                ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                : "bg-slate-700/50 hover:bg-slate-600"
              }
            `}
            style={{
              height: `${20 + (level * 20)}%`, // 40%, 60%, 80%, 100%, 120%? No, 20-100%
            }}
            aria-label={`Nível ${level}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col animate-fade-in space-y-4">
      <div className="flex-shrink-0 text-center space-y-2">
        <h2 className="text-xl font-bold text-cyan-300">
          Passo {currentStep + 1} de {totalSteps}
        </h2>
        <p className="text-gray-300 text-sm px-4">{question}</p>

        <div className="flex gap-1 justify-center mt-2">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div key={idx} className={`h-1 w-8 rounded-full transition-colors ${idx <= currentStep ? 'bg-cyan-400' : 'bg-gray-700'}`} />
          ))}
        </div>
      </div>

      <div className="flex-grow space-y-6 overflow-y-auto px-1 py-2">
        {currentItems.map((item) => (
          <div key={item} className="space-y-2 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
            <h3 className="text-lg font-medium text-center text-gray-200">{item}</h3>

            <VolumeSlider
              value={responses[item]}
              onChange={(val) => setResponses(prev => ({ ...prev, [item]: val }))}
            />

            <div className="flex justify-between text-xs text-gray-500 font-medium px-1">
              <span>Nem um pouco</span>
              <span>Extremamente</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-2 flex-shrink-0">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`px-6 py-3 font-medium text-gray-300 transition-colors hover:text-white
            ${currentStep === 0 ? "invisible" : ""}
          `}
        >
          Voltar
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-8 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors shadow-glow-blue disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {currentStep === totalSteps - 1 ? "Concluir" : "Próximo"}
        </button>
      </div>
    </div>
  );
};
