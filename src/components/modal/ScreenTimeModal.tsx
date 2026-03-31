import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "./Modal";
import { ScreenTimeEntry, DailyScreenTimeLog } from "../screen/ScreenTimeEntry";
import { PlusIcon } from "../icons/PlusIcon";
import { getJourneyStartDate, formatDateShort } from "@/src/utils/timeUtils";

const EMPTY_ENTRY = (): ScreenTimeEntry => ({
  id: `${Date.now()}-${Math.random()}`,
  platform: "",
  otherPlatformDetail: "",
  hours: "",
  minutes: "",
  duration: "",
});

export const ScreenTimeModal: React.FC<{
  onSave: (entries: ScreenTimeEntry[], date: string) => void;
  onClose: () => void;
  studyStartDate: string | null;
  existingLogs: DailyScreenTimeLog[];
}> = ({ onSave, onClose, studyStartDate, existingLogs }) => {
  const today = new Date().toISOString().slice(0, 10);

  const journeyDays = useMemo<{ label: string; date: string }[]>(() => {
    if (!studyStartDate) return [];
    try {
      const start = getJourneyStartDate(studyStartDate);
      const now = new Date();
      const todayIso = now.toISOString().slice(0, 10);
      const days: { label: string; date: string }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        if (iso > todayIso) break;
        days.push({ label: `Dia ${i + 1}`, date: iso });
      }
      return days;
    } catch {
      return [];
    }
  }, [studyStartDate]);

  const [selectedDate, setSelectedDate] = useState<string>(today);

  const [entries, setEntries] = useState<ScreenTimeEntry[]>(() => {
    const existing = existingLogs.find(l => l.date === today);
    return existing ? existing.entries.map(e => ({ ...e })) : [EMPTY_ENTRY()];
  });

  useEffect(() => {
    const existing = existingLogs.find(l => l.date === selectedDate);
    if (existing && existing.entries.length > 0) {
      setEntries(existing.entries.map(e => ({ ...e })));
    } else {
      setEntries([EMPTY_ENTRY()]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

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

  const totalMinutes = entries.reduce((sum, e) => sum + parseInt(e.duration || "0", 10), 0);
  const totalH = Math.floor(totalMinutes / 60);
  const totalM = totalMinutes % 60;
  const totalDisplay = totalMinutes > 0
    ? `${totalH > 0 ? `${totalH}h ` : ""}${totalM > 0 ? `${totalM}min` : ""}`.trim()
    : null;

  const isEditing = existingLogs.some(l => l.date === selectedDate);
  const isToday = selectedDate === today;
  const selectedDayShort = formatDateShort(selectedDate);
  // Quando há só 1 dia (abas ocultas), mostramos a data no label do total para contexto
  const selectedDayLabel = isToday && journeyDays.length > 1
    ? "hoje"
    : journeyDays.find(d => d.date === selectedDate)?.label
      ? `${journeyDays.find(d => d.date === selectedDate)!.label} (${selectedDayShort})`
      : selectedDayShort;

  return (
    <Modal onClose={onClose} className="max-w-lg">
      <div className="p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Tempo de Tela</h2>
          <p className="text-sm text-gray-400 mt-1">
            Registre quanto tempo você usou cada rede social.
          </p>
        </div>

        {/* Day picker — só aparece se houver mais de um dia disponível */}
        {journeyDays.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {journeyDays.map(({ label, date }) => {
              const hasLog = existingLogs.some(l => l.date === date);
              const isSelected = selectedDate === date;
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className="relative px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                  style={isSelected ? {
                    background: "rgba(34,211,238,0.15)",
                    border: "1px solid rgba(34,211,238,0.6)",
                    color: "#22d3ee",
                    boxShadow: "0 0 8px rgba(34,211,238,0.25)",
                  } : {
                    background: "rgba(15,23,42,0.6)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: hasLog ? "#94a3b8" : "#475569",
                  }}
                >
                  {label} · {formatDateShort(date)}
                  {hasLog && !isSelected && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Total ao vivo */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300"
          style={{
            background: totalMinutes > 0 ? "rgba(34,211,238,0.07)" : "rgba(15,23,42,0.4)",
            border: `1px solid ${totalMinutes > 0 ? "rgba(34,211,238,0.18)" : "rgba(255,255,255,0.04)"}`,
          }}
        >
          <span className="text-slate-500 text-xs">Total {selectedDayLabel}{isEditing ? " (editando)" : ""}:</span>
          <span
            className="font-bold text-sm transition-all duration-300"
            style={{ color: totalMinutes > 0 ? "#22d3ee" : "#475569" }}
          >
            {totalDisplay ?? "—"}
          </span>
          {totalMinutes > 0 && (
            <span className="text-slate-600 text-xs ml-auto">de redes sociais</span>
          )}
        </div>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
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
            onClick={() => isValid && onSave(entries, selectedDate)}
            disabled={!isValid}
            className="px-8 py-2 font-bold text-slate-900 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ boxShadow: isValid ? "0 0 12px rgba(34,211,238,0.4)" : undefined }}
          >
            {isEditing ? "Atualizar" : "Salvar +500 XP"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
