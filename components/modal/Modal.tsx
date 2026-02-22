import React from "react";
import { XIcon } from "../icons/XIcon";

export const Modal: React.FC<{
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ onClose, children, className }) => {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className={`bg-slate-900 border border-cyan-400/30 rounded-2xl shadow-glow-blue w-full relative ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Fechar modal"
        >
          <XIcon className="w-6 h-6" />
        </button>
        {children}
      </div>
    </div>
  );
};
