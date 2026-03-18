import React, { useState } from "react";
import { Modal } from "./Modal";
import { ScreenTimeEntry } from "../screen/ScreenTimeEntry";
import { PlusIcon } from "../icons/PlusIcon";

const EMPTY_ENTRY = (): ScreenTimeEntry => ({
  id: `${Date.now()}-${Math.random()}`,
  platform: "",
  otherPlatformDetail: "",
  hours: "",
  minutes: "",
  duration: "",
});

export const ScreenTimeModal: React.FC<{
  onSave: (entries: ScreenTimeEntry[]) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const [entries, setEntries] = useState<ScreenTimeEntry[]>([EMPTY_ENTRY()]);

  const addEntry = () => setEntries((prev) => [...prev, EMPTY_ENTRY()]);

  const updateEntry = (index: number, field: keyof ScreenTimeEntry, value: string) => {
    setEntries((prev) => {
      const next = prev.map((e, i) => (i === index ? { ...e, [field]: value } : e));
      if (field === "hours" || field === "minutes") {
        const h = parseInt(next[index].hours || "0", 10);
        const m = parseInt(next[index].minutes || "0", 10);
        next[index] = { ...next[index], duration: String(h * 60 + m) };
      }
      return next;
    });
  };

  const removeEntry = (index: number) =>
    setEntries((prev) => prev.filter((_, i) => i !== index));

  const isValid = entries.some((e) => e.platform !== "" && (e.hours !== "" || e.minutes !== ""));

  return (
    <Modal onClose={onClose} className="max-w-lg">
      <div className="p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Tempo de Tela de Hoje</h2>
          <p className="text-sm text-gray-400 mt-1">
            Registre quanto tempo você usou cada rede social hoje.
          </p>
        </div>

        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="grid grid-cols-1 gap-2 p-3 rounded-xl"
              style={{ border: "1px solid rgba(34,211,238,0.12)", background: "rgba(15,23,42,0.6)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <select
                  value={entry.platform}
                  onChange={(e) => updateEntry(index, "platform", e.target.value)}
                  className="form-input flex-1 bg-slate-800"
                >
                  <option value="" disabled hidden>Rede social...</option>
                  <option className="text-black">Instagram</option>
                  <option className="text-black">TikTok</option>
                  <option className="text-black">Shorts (YouTube)</option>
                  <option className="text-black">Kwai</option>
                  <option value="Outro" className="text-black">Outro</option>
                </select>
                {entries.length > 1 && (
                  <button
                    onClick={() => removeEntry(index)}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>

              {entry.platform === "Outro" && (
                <input
                  type="text"
                  value={entry.otherPlatformDetail}
                  onChange={(e) => updateEntry(index, "otherPlatformDetail", e.target.value)}
                  className="form-input"
                  placeholder="Qual rede social?"
                />
              )}

              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs whitespace-nowrap">Tempo de uso:</span>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={entry.hours}
                  onChange={(e) => updateEntry(index, "hours", e.target.value)}
                  className="form-input w-16 text-center"
                  placeholder="0"
                />
                <span className="text-gray-400 text-sm">h</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={entry.minutes}
                  onChange={(e) => updateEntry(index, "minutes", e.target.value)}
                  className="form-input w-16 text-center"
                  placeholder="0"
                />
                <span className="text-gray-400 text-sm">min</span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addEntry}
          className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 text-sm p-2 rounded-md hover:bg-cyan-500/10 transition-colors self-start"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Adicionar rede social</span>
        </button>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-700 text-gray-300 hover:bg-slate-600 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={() => isValid && onSave(entries)}
            disabled={!isValid}
            className="px-8 py-2 font-bold text-slate-900 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ boxShadow: isValid ? "0 0 12px rgba(34,211,238,0.4)" : undefined }}
          >
            Salvar +20 XP
          </button>
        </div>
      </div>
    </Modal>
  );
};
