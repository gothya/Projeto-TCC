import React from "react";

export const FeedContextComponent: React.FC<{
  onComplete: (wasWatching: boolean) => void;
}> = ({ onComplete }) => {
  return (
    <div className="py-8 text-center min-h-[200px] flex flex-col justify-center">
      <h2 className="text-2xl font-bold text-cyan-400 mb-8">
        E aí? Você estava "rolando o feed"?
      </h2>
      <div className="flex justify-center space-x-6">
        <button
          onClick={() => onComplete(false)}
          className="px-12 py-3 font-bold text-white bg-red-600/80 rounded-lg hover:bg-red-500/80 transition-all transform hover:scale-105"
        >
          Não
        </button>
        <button
          onClick={() => onComplete(true)}
          className="px-12 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all shadow-glow-blue transform hover:scale-105"
        >
          Sim
        </button>
      </div>
    </div>
  );
};
