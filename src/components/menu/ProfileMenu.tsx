import React from "react";
import { CameraIcon } from "../icons/CameraIcon";
import { TrashIcon } from "../icons/TrashIcon";
import { ChartBarIcon } from "../icons/ChartBarIcon";
import { IdentificationIcon } from "../icons/IdentificationIcon";
import { DocumentTextIcon } from "../icons/DocumentTextIcon";

export const ProfileMenu: React.FC<{
  onUpload: () => void;
  onRemove: () => void;
  onViewRcle: () => void;
  onViewPerformance: () => void;
  onViewData: () => void;
  onLogout: () => void;
  hasAvatar: boolean;
}> = ({
  onUpload,
  onRemove,
  onViewRcle,
  onViewPerformance,
  onViewData,
  onLogout,
  hasAvatar,
}) => {
  const baseClass =
    "flex items-center space-x-3 w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-cyan-400/20 hover:text-cyan-300 transition-colors rounded-md";
  return (
    <div className="absolute top-full mt-2 w-56 bg-slate-800/90 backdrop-blur-md border border-cyan-400/20 rounded-lg shadow-glow-blue p-2 z-20">
      <button onClick={onUpload} className={baseClass}>
        <CameraIcon className="w-4 h-4" /> <span>Alterar Avatar</span>
      </button>
      {hasAvatar && (
        <button onClick={onRemove} className={baseClass}>
          <TrashIcon className="w-4 h-4" /> <span>Remover Avatar</span>
        </button>
      )}
      <div className="h-px bg-cyan-400/20 my-1"></div>
      <button onClick={onViewPerformance} className={baseClass}>
        <ChartBarIcon className="w-4 h-4" /> <span>Desempenho</span>
      </button>
      <button onClick={onViewData} className={baseClass}>
        <IdentificationIcon className="w-4 h-4" /> <span>Meus Dados</span>
      </button>
      <button onClick={onViewRcle} className={baseClass}>
        <DocumentTextIcon className="w-4 h-4" /> <span>Ver Termos</span>
      </button>
      <div className="h-px bg-cyan-400/20 my-1"></div>
      <button
        onClick={onLogout}
        className={`${baseClass} text-red-400 hover:text-red-300 hover:bg-red-500/20`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>{" "}
        <span>Sair</span>
      </button>
    </div>
  );
};
