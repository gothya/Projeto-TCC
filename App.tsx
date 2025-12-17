import React, { useState, useEffect, useId, useRef, useCallback } from "react";
import { GameState } from "./components/data/GameState";
import { SociodemographicData } from "./components/data/SocialDemographicData";
import { LandingScreen } from "./components/LandingScreen";
import { AdminDashboardScreen } from "./components/screen/AdminDashboardScreen";
import { AdminLoginScreen } from "./components/screen/AdminLoginScreen";
import { OnboardingScreen } from "./components/screen/OnboardingScreen";
import { DashboardScreen } from "./components/screen/DashboardScreen";

const INITIAL_GAME_STATE: GameState = {
  user: {
    nickname: "Iniciante",
    points: 0,
    level: 1,
    responseRate: 0,
    currentStreak: 0,
    completedDays: 0,
    avatar: null,
  },
  badges: [
    {
      id: "punctual",
      name: "Pontualidade",
      description: "Responder 80% das notificações em 10 minutos",
      unlocked: false,
    },
    {
      id: "week_streak",
      name: "Streak Semanal",
      description: "Completar todos os 7 dias",
      unlocked: false,
    },
  ],
  hasOnboarded: false,
  studyStartDate: null,
  responses: [],
  pings: Array(7)
    .fill(0)
    .map(() => Array(7).fill("pending")),
  sociodemographicData: null,
};

type ViewState = "LANDING" | "USER" | "ADMIN_LOGIN" | "ADMIN_DASHBOARD";

// --- END: Mock Data & Types ---

// --- START: Main App Component ---

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>("LANDING");
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const savedState = localStorage.getItem("gameState");
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Simple migrations for new/changed state properties
        if (!parsed.pings || !Array.isArray(parsed.pings[0])) {
          parsed.pings = INITIAL_GAME_STATE.pings;
        }
        if (parsed.user && !("avatar" in parsed.user)) {
          parsed.user.avatar = null;
        }
        if (!("sociodemographicData" in parsed)) {
          parsed.sociodemographicData = null;
        }
        if (!parsed.responses) {
          parsed.responses = [];
        }
        return parsed;
      }
    } catch (error) {
      console.error("Could not parse saved game state:", error);
      return INITIAL_GAME_STATE;
    }
    return INITIAL_GAME_STATE;
  });

  useEffect(() => {
    localStorage.setItem("gameState", JSON.stringify(gameState));
  }, [gameState]);

  const completeOnboarding = (
    nickname: string,
    sociodemographicData: SociodemographicData
  ) => {
    setGameState((prev) => ({
      ...prev,
      hasOnboarded: true,
      studyStartDate: new Date().toISOString(),
      user: {
        ...prev.user,
        nickname,
      },
      sociodemographicData,
    }));
  };

  const handleAdminLoginSuccess = () => {
    setView("ADMIN_DASHBOARD");
  };

  const renderView = () => {
    switch (view) {
      case "LANDING":
        return (
          <LandingScreen
            onUserSelect={() => setView("USER")}
            onAdminSelect={() => setView("ADMIN_LOGIN")}
          />
        );
      case "ADMIN_LOGIN":
        return (
          <AdminLoginScreen
            onLoginSuccess={handleAdminLoginSuccess}
            onBack={() => setView("LANDING")}
          />
        );
      case "ADMIN_DASHBOARD":
        return <AdminDashboardScreen onLogout={() => setView("LANDING")} />;
      case "USER":
        return !gameState.hasOnboarded ? (
          <OnboardingScreen onComplete={completeOnboarding} />
        ) : (
          <DashboardScreen
            gameState={gameState}
            setGameState={setGameState}
            onLogout={() => setView("LANDING")}
          />
        );
      default:
        return (
          <LandingScreen
            onUserSelect={() => setView("USER")}
            onAdminSelect={() => setView("ADMIN_LOGIN")}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,128,128,0.3),rgba(255,255,255,0))] text-gray-200 font-sans">
      {renderView()}
    </div>
  );
};

export default App;
