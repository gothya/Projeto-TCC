import React, { useState } from "react";
import { FormField } from "./form/FormField";
import { InstrumentResponse } from "./data/InstrumentResponse";

export const EndOfDayLogComponent: React.FC<{
  onComplete: (data: Partial<InstrumentResponse>) => void;
}> = ({ onComplete }) => {
  const [sleepQuality, setSleepQuality] = useState(0);
  const [stressfulEvents, setStressfulEvents] = useState("");

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto pr-4 space-y-6">
        <FormField label="Como você avalia a qualidade do seu sono na noite passada? (1=Péssima, 5=Excelente)">
          <div className="flex justify-start space-x-2 sm:space-x-4">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setSleepQuality(v)}
                className={`w-10 h-10 text-lg font-bold rounded-full border-2 transition-colors transform hover:scale-110 ${
                  sleepQuality === v
                    ? "bg-cyan-400 border-cyan-300 text-brand-dark"
                    : "border-gray-500 hover:border-cyan-400 text-gray-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="Ocorreram eventos estressantes hoje?">
          <textarea
            value={stressfulEvents}
            onChange={(e) => setStressfulEvents(e.target.value)}
            className="form-input"
            placeholder="Descreva brevemente... (opcional)"
          />
        </FormField>
      </div>
      <div className="flex justify-end pt-6">
        <button
          onClick={() => onComplete({ sleepQuality, stressfulEvents })}
          className="px-8 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors shadow-glow-blue"
        >
          Salvar Relatório
        </button>
      </div>
    </div>
  );
};
