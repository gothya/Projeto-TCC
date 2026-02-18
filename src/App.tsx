import React from "react";
import { AppRoutes } from "./routes";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-dark bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,128,128,0.3),rgba(255,255,255,0))] text-gray-200 font-sans">
      <AppRoutes />
    </div>
  );
};

export default App;
