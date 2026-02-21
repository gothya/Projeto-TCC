import React from "react";

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-cyan-400/20 shadow-lg ${className}`}
    >
      {children}
    </div>
  );
};
