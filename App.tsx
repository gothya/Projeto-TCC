import React, { useState, useEffect } from "react";
import { GameState } from "./components/data/GameState";
import { SociodemographicData } from "./components/data/SocialDemographicData";
import { LandingScreen } from "./components/LandingScreen";
import { AdminDashboardScreen } from "./components/screen/AdminDashboardScreen";
import { AdminLoginScreen } from "./components/screen/AdminLoginScreen";
import { OnboardingScreen } from "./components/screen/OnboardingScreen";
import { DashboardScreen } from "./components/screen/DashboardScreen";
import { useAuth } from "./contexts/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./services/firebase";
import { NotificationService } from "./services/NotificationService";

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
    .map(() => ({ statuses: Array(7).fill("pending") })),
  sociodemographicData: null,
};

type ViewState = "LANDING" | "USER" | "ADMIN_LOGIN" | "ADMIN_DASHBOARD";

// --- START: Main App Component ---

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>("LANDING");
  const { user: firebaseUser, signInAnonymously: authSignInAnonymously, loading: authLoading } = useAuth();
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [dataLoading, setDataLoading] = useState(false);

  // Load GameState from Firestore when user authenticates
  useEffect(() => {
    // Initialize Notification Service for foreground messages
    if (firebaseUser) {
      NotificationService.init().then(async (service) => {
        service.onMessageListener();
        // Check if we already have permission/token and save it to ensure it's up to date
        if (Notification.permission === "granted") {
          const token = await service.requestPermission();
          if (token) {
            await service.saveTokenToFirestore(firebaseUser.uid, token);
          }
        }
      });
    }

    async function loadData() {
      if (!firebaseUser) {
        // Reset to initial if logged out, or keep basic state
        // setGameState(INITIAL_GAME_STATE); 
        return;
      }

      setDataLoading(true);
      try {
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as GameState;

          // Migrations / Default values check
          if (!data.responses) data.responses = [];

          // Migration: Convert old nested array to new object structure if needed
          if (!data.pings || !Array.isArray(data.pings)) {
            data.pings = INITIAL_GAME_STATE.pings;
          } else if (data.pings.length > 0 && Array.isArray(data.pings[0])) {
            data.pings = (data.pings as any).map((dayArr: any) => ({ statuses: dayArr }));
          }

          setGameState(data);
        } else {
          // New User: Save initial state
          await setDoc(docRef, INITIAL_GAME_STATE);
          setGameState(INITIAL_GAME_STATE);
        }
      } catch (error) {
        console.error("Error loading game state:", error);
      } finally {
        setDataLoading(false);
      }
    }

    loadData();
  }, [firebaseUser]);

  // Sync GameState to Firestore on changes
  useEffect(() => {
    if (!firebaseUser || dataLoading) return;

    const saveState = async () => {
      try {
        const docRef = doc(db, "users", firebaseUser.uid);
        await setDoc(docRef, gameState, { merge: true });
      } catch (error) {
        console.error("Error saving game state:", error);
      }
    };

    // Debounce could be added here, but for now direct save is safer for data integrity
    const timeoutId = setTimeout(saveState, 1000);
    return () => clearTimeout(timeoutId);
  }, [gameState, firebaseUser, dataLoading]);


  const completeOnboarding = (
    nickname: string,
    sociodemographicData: SociodemographicData
  ) => {
    // Solicitar permissão de notificações para novos usuários
    NotificationService.init().then(async (service) => {
      const token = await service.initializeNotificationsForNewUser();
      if (token && firebaseUser) {

        setGameState((prev) => ({
          ...prev,
          hasOnboarded: true,
          studyStartDate: new Date().toISOString(),
          user: {
            ...prev.user,
            nickname,
            tokenNotifications: token
          },
          sociodemographicData,
        }));

        await service.saveTokenToFirestore(firebaseUser.uid, token);
      }
    });
  };

  const handleAdminLoginSuccess = () => {
    setView("ADMIN_DASHBOARD");
  };

  const handleUserEnter = async () => {
    if (!firebaseUser) {
      await authSignInAnonymously();
    }
    setView("USER");
  };

  const renderView = () => {
    if (authLoading || (firebaseUser && dataLoading && view === "USER")) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      );
    }

    switch (view) {
      case "LANDING":
        return (
          <LandingScreen
            onUserSelect={handleUserEnter}
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
        return (
          <AdminDashboardScreen
            onLogout={() => setView("LANDING")}
          />
        );
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
            onUserSelect={handleUserEnter}
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
