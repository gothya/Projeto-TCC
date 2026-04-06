import React from "react";
import { CameraIcon } from "../icons/CameraIcon";
import { TrashIcon } from "../icons/TrashIcon";
import { ChartBarIcon } from "../icons/ChartBarIcon";
import { IdentificationIcon } from "../icons/IdentificationIcon";
import { DocumentTextIcon } from "../icons/DocumentTextIcon";
import { isIOS, isStandalone } from "@/src/utils/pwaUtils";

export const ProfileMenu: React.FC<{
  onUpload: () => void;
  onRemove: () => void;
  onViewRcle: () => void;
  onViewData: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  hasAvatar: boolean;
  isReportAvailable?: boolean;
  onDownloadReport?: () => void;
  isAdmin?: boolean;
  onNavigateAdmin?: () => void;
  onInstallApp?: () => void;
}> = ({
  onUpload,
  onRemove,
  onViewRcle,
  onViewData,
  onLogout,
  onDeleteAccount,
  hasAvatar,
  isReportAvailable,
  onDownloadReport,
  isAdmin,
  onNavigateAdmin,
  onInstallApp,
}) => {
  const installLabel = isStandalone()
    ? "App instalado ✓"
    : isIOS() ? "Como instalar o app" : "Instalar o app";
  const baseClass =
    "flex items-center space-x-3 w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-cyan-400/20 hover:text-cyan-300 transition-colors rounded-md";
  return (
    <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800/90 backdrop-blur-md border border-cyan-400/20 rounded-lg shadow-glow-blue p-2 z-50">
      <button onClick={onUpload} className={baseClass}>
        <CameraIcon className="w-4 h-4" /> <span>Alterar Avatar</span>
      </button>
      {hasAvatar && (
        <button onClick={onRemove} className={baseClass}>
          <TrashIcon className="w-4 h-4" /> <span>Remover Avatar</span>
        </button>
      )}
      <div className="h-px bg-cyan-400/20 my-1"></div>
      <button onClick={onViewData} className={baseClass}>
        <IdentificationIcon className="w-4 h-4" /> <span>Meus Dados</span>
      </button>
      <button onClick={onViewRcle} className={baseClass}>
        <DocumentTextIcon className="w-4 h-4" /> <span>Ver Termos</span>
      </button>
      {isReportAvailable && onDownloadReport && (
        <button onClick={onDownloadReport} className={baseClass}>
          <ChartBarIcon className="w-4 h-4 text-cyan-400" /> <span className="text-cyan-300 font-semibold">Meu Relatório</span>
        </button>
      )}
      {isAdmin && onNavigateAdmin && (
        <>
          <div className="h-px bg-cyan-400/20 my-1"></div>
          <button onClick={onNavigateAdmin} className={`${baseClass} text-amber-400 hover:text-amber-300 hover:bg-amber-500/20`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Painel Adm</span>
          </button>
        </>
      )}
      <div className="h-px bg-cyan-400/20 my-1"></div>
      <button onClick={onInstallApp} className={baseClass}>
        <span className="text-lg leading-none">📲</span>
        <span>{installLabel}</span>
      </button>
      <div className="h-px bg-cyan-400/20 my-1"></div>
      <button
        onClick={onDeleteAccount}
        className={`${baseClass} text-red-500/70 hover:text-red-400 hover:bg-red-500/10`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Excluir Participação</span>
      </button>
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
