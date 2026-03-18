import React, { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = { id: number; message: string; type: ToastType };

type ToastContextType = { showToast: (message: string, type?: ToastType) => void };

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastType, string> = {
  success: "✦",
  error: "✕",
  info: "◈",
};

const COLORS: Record<ToastType, { border: string; text: string; glow: string }> = {
  success: {
    border: "rgba(34,211,238,0.35)",
    text: "#22d3ee",
    glow: "0 0 20px rgba(34,211,238,0.15)",
  },
  error: {
    border: "rgba(239,68,68,0.35)",
    text: "#f87171",
    glow: "0 0 20px rgba(239,68,68,0.15)",
  },
  info: {
    border: "rgba(148,163,184,0.3)",
    text: "#94a3b8",
    glow: "none",
  },
};

const TOAST_KEYFRAMES = `
@keyframes toastIn {
  from { opacity: 0; transform: translateY(-12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}
@keyframes toastOut {
  from { opacity: 1; }
  to   { opacity: 0; transform: translateY(-8px) scale(0.97); }
}
`;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <style>{TOAST_KEYFRAMES}</style>
      <div className="fixed top-5 left-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4"
        style={{ transform: "translateX(-50%)" }}>
        {toasts.map(toast => {
          const c = COLORS[toast.type];
          return (
            <div
              key={toast.id}
              style={{
                background: "rgba(15,23,42,0.95)",
                border: `1px solid ${c.border}`,
                boxShadow: c.glow,
                backdropFilter: "blur(12px)",
                borderRadius: "14px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                animation: "toastIn 0.25s ease-out both",
              }}
            >
              <span style={{ color: c.text, fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>
                {ICONS[toast.type]}
              </span>
              <span style={{ color: "#e2e8f0", fontSize: "13px", lineHeight: 1.45 }}>
                {toast.message}
              </span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
