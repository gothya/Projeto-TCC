import React from "react";
import { AppRoutes } from "./routes";
import { ToastProvider } from "./contexts/ToastContext";

const App: React.FC = () => {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-brand-dark bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,128,128,0.3),rgba(255,255,255,0))] text-gray-200 font-sans">
        <AppRoutes />
      </div>
    </ToastProvider>
  );
};

export default App;
