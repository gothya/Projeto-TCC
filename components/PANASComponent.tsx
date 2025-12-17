import React, { useState } from "react";
import { PanasResponse } from "./data/PanasResponse";
import { PANAS_ITEMS } from "./data/PanasItems";

export const PANASComponent: React.FC<{
  question: string;
  onComplete: (data: PanasResponse) => void;
}> = ({ question, onComplete }) => {
  const [responses, setResponses] = useState<PanasResponse>(() => {
    const initialResponses: PanasResponse = {};
    PANAS_ITEMS.forEach((item) => {
      initialResponses[item] = 1; // Default to 1 (Nem um pouco)
    });
    return initialResponses;
  });

  const scale = [
    { label: "Nem um pouco", value: 1 },
    { label: "Um pouco", value: 2 },
    { label: "Moderadamente", value: 3 },
    { label: "Bastante", value: 4 },
    { label: "Extremamente", value: 5 },
  ];

  const handleResponse = (item: string, value: number) => {
    setResponses((prev) => ({ ...prev, [item]: value }));
  };

  const handleSubmit = () => {
    onComplete(responses);
  };

  // Fix: Explicitly type `val` as `number`. `Object.values` on an object with an
  // index signature can be inferred as `unknown[]`, causing a type error on comparison.
  const isComplete = Object.values(responses).every((val: number) => val > 0);

  return (
    <div
      className="py-4 flex flex-col"
      style={{ minHeight: "400px", maxHeight: "80vh" }}
    >
      <div className="flex-shrink-0 text-center">
        <p className="text-gray-300 mb-4 px-4">{question}</p>
      </div>

      <div className="flex-grow overflow-y-auto border border-cyan-400/20 rounded-lg">
        <table className="w-full text-sm text-left table-fixed">
          <thead className="sticky top-0 bg-teal-800 text-gray-200 z-10">
            <tr>
              <th className="p-2 w-[25%] font-semibold">Item</th>
              {scale.map(({ label, value }) => (
                <th
                  key={value}
                  className="p-2 text-center w-[15%] font-normal text-xs sm:text-sm"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-400/10">
            {PANAS_ITEMS.map((item, index) => (
              <tr
                key={item}
                className={
                  index % 2 === 0 ? "bg-slate-800/50" : "bg-slate-900/50"
                }
              >
                <td className="p-2 font-medium text-cyan-300">{item}</td>
                {scale.map(({ value }) => (
                  <td key={value} className="p-2 text-center">
                    <button
                      onClick={() => handleResponse(item, value)}
                      className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto flex items-center justify-center rounded border-2 transition-all duration-150 transform hover:scale-110
                                                ${
                                                  responses[item] === value
                                                    ? "bg-brand-blue border-brand-light-blue"
                                                    : "border-gray-600 hover:border-brand-light-blue"
                                                }
                                            `}
                      aria-label={`${item} - ${
                        scale.find((s) => s.value === value)?.label
                      }`}
                    >
                      {responses[item] === value && (
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-brand-dark"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-4 flex-shrink-0">
        <button
          onClick={handleSubmit}
          disabled={!isComplete}
          className="px-8 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors shadow-glow-blue disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
        >
          Próximo
        </button>
      </div>
    </div>
  );
};
