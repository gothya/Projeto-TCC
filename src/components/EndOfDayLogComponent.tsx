import React, { useState } from "react";
import { FormField } from "./form/FormField";
import { InstrumentResponse } from "./data/InstrumentResponse";
import { ScreenTimeEntry } from "./screen/ScreenTimeEntry";
import { PlusIcon } from "./icons/PlusIcon";

export const EndOfDayLogComponent: React.FC<{
  onComplete: (data: Partial<InstrumentResponse>) => void;
}> = ({ onComplete }) => {
  const [sleepQuality, setSleepQuality] = useState(0);
  const [stressfulEvents, setStressfulEvents] = useState("");
  const [screenTimeLog, setScreenTimeLog] = useState<ScreenTimeEntry[]>([
    { id: "0", platform: "", otherPlatformDetail: "", hours: "", minutes: "", duration: "" },
  ]);

  const addScreenTimeEntry = () =>
    setScreenTimeLog((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        platform: "",
        otherPlatformDetail: "",
        hours: "",
        minutes: "",
        duration: "",
      },
    ]);

  const updateScreenTimeEntry = (
    index: number,
    field: keyof ScreenTimeEntry,
    value: string
  ) => {
    const newLog = [...screenTimeLog];
    newLog[index] = { ...newLog[index], [field]: value };

    // Auto-calculate duration (total minutes) from hours + minutes
    if (field === "hours" || field === "minutes") {
      const h = parseInt(newLog[index].hours || "0", 10);
      const m = parseInt(newLog[index].minutes || "0", 10);
      newLog[index].duration = String(h * 60 + m);
    }

    setScreenTimeLog(newLog);
  };

  return (
    <div className="">
      <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-6">
        <FormField label="Como você avalia a qualidade do seu sono na noite passada? (1=Péssima, 5=Excelente)">
          <div className="flex justify-start space-x-2 sm:space-x-4">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setSleepQuality(v)}
                className={`w-10 h-10 text-lg font-bold rounded-full border-2 transition-colors transform hover:scale-110 ${sleepQuality === v
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

        <div>
          <h3 className="text-cyan-300 text-sm font-bold mb-2">
            Registro de Tempo de Tela de hoje
          </h3>
          {screenTimeLog.map((entry, index) => (
            <div
              key={entry.id}
              className="grid grid-cols-1 gap-2 p-3 mb-2 border border-cyan-400/10 rounded-lg"
            >
              <select
                value={entry.platform}
                onChange={(e) =>
                  updateScreenTimeEntry(index, "platform", e.target.value)
                }
                className="form-input bg-slate-800"
              >
                <option value="" disabled hidden>
                  Rede social...
                </option>
                <option className="text-black">Instagram</option>
                <option className="text-black">Tiktok</option>
                <option className="text-black">Shorts (Youtube)</option>
                <option className="text-black">Kwai</option>
                <option value="Outro" className="text-black">Outro (especificar)</option>
              </select>
              {entry.platform === "Outro" && (
                <input
                  type="text"
                  value={entry.otherPlatformDetail}
                  onChange={(e) =>
                    updateScreenTimeEntry(
                      index,
                      "otherPlatformDetail",
                      e.target.value
                    )
                  }
                  className="form-input"
                  placeholder="Especifique"
                />
              )}

              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs whitespace-nowrap">Tempo de uso:</span>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={entry.hours}
                  onChange={(e) =>
                    updateScreenTimeEntry(index, "hours", e.target.value)
                  }
                  className="form-input w-16 text-center"
                  placeholder="0"
                />
                <span className="text-gray-400 text-sm">h</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={entry.minutes}
                  onChange={(e) =>
                    updateScreenTimeEntry(index, "minutes", e.target.value)
                  }
                  className="form-input w-16 text-center"
                  placeholder="0"
                />
                <span className="text-gray-400 text-sm">min</span>
              </div>
            </div>
          ))}
          <button
            onClick={addScreenTimeEntry}
            className="flex items-center space-x-2 text-cyan-300 hover:text-cyan-200 text-sm p-2 rounded-md hover:bg-cyan-500/10"
          >
            <PlusIcon className="w-4 h-4" /> <span>Adicionar registro</span>
          </button>
        </div>
      </div>
      <div className="flex justify-end pt-6">
        <button
          onClick={() =>
            onComplete({ sleepQuality, stressfulEvents, screenTimeLog })
          }
          className="px-8 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors shadow-glow-blue"
        >
          Salvar Relatório
        </button>
      </div>
    </div>
  );
};
