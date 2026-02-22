import React, { useState, useEffect } from "react";
import { GameState } from "./components/data/GameState";
import { SociodemographicData } from "./components/data/SocialDemographicData";
import { LandingScreen } from "./components/LandingScreen";
import { AdminDashboardScreen } from "./components/screen/AdminDashboardScreen";
import { AdminLoginScreen } from "./components/screen/AdminLoginScreen";
import { OnboardingScreen } from "./components/screen/OnboardingScreen";
import { ParticipantMainScreen } from "./components/screen/ParticipantMainScreen";
import { useAuth } from "./contexts/AuthContext";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
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

const LS_UID_KEY = "psylogos_participant_uid";

type ViewState = "LANDING" | "USER" | "ADMIN_LOGIN" | "ADMIN_DASHBOARD";

// --- START: Main App Component ---

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>("LANDING");
  const { user: firebaseUser, signInAnonymously: authSignInAnonymously, loading: authLoading } = useAuth();
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

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
        return;
      }

      setDataLoading(true);
      try {
        const currentUid = firebaseUser.uid;
        const docRef = doc(db, "users", currentUid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // Found data for current UID — normal flow
          const data = docSnap.data() as GameState;

          // Migrations / Default values check
          if (!data.responses) data.responses = [];
          if (!data.pings || !Array.isArray(data.pings)) {
            data.pings = INITIAL_GAME_STATE.pings;
          } else if (data.pings.length > 0 && Array.isArray(data.pings[0])) {
            data.pings = (data.pings as any).map((dayArr: any) => ({ statuses: dayArr }));
          }

          setGameState(data);
          setDataLoaded(true);
          // Keep localStorage in sync
          localStorage.setItem(LS_UID_KEY, currentUid);
        } else {
          // No data for current UID — check localStorage for a previous UID
          const previousUid = localStorage.getItem(LS_UID_KEY);

          if (previousUid && previousUid !== currentUid) {
            // Try to recover data from the old UID
            const oldDocRef = doc(db, "users", previousUid);
            const oldDocSnap = await getDoc(oldDocRef);

            if (oldDocSnap.exists()) {
              // Found old data! Migrate to new UID
              const oldData = oldDocSnap.data() as GameState;
              console.log("Recovering participant data from previous session...");

              // Migrations
              if (!oldData.responses) oldData.responses = [];
              if (!oldData.pings || !Array.isArray(oldData.pings)) {
                oldData.pings = INITIAL_GAME_STATE.pings;
              } else if (oldData.pings.length > 0 && Array.isArray(oldData.pings[0])) {
                oldData.pings = (oldData.pings as any).map((dayArr: any) => ({ statuses: dayArr }));
              }

              // Copy data to new UID document
              await setDoc(docRef, oldData);
              // Remove old document to avoid duplicates
              await deleteDoc(oldDocRef);

              setGameState(oldData);
              setDataLoaded(true);
              localStorage.setItem(LS_UID_KEY, currentUid);
              console.log("Participant data recovered successfully!");
            } else {
              // Old UID doc also doesn't exist — truly new user
              await setDoc(docRef, INITIAL_GAME_STATE);
              setGameState(INITIAL_GAME_STATE);
              setDataLoaded(true);
              localStorage.setItem(LS_UID_KEY, currentUid);
            }
          } else {
            // No previous UID saved — truly new user
            await setDoc(docRef, INITIAL_GAME_STATE);
            setGameState(INITIAL_GAME_STATE);
            setDataLoaded(true);
            localStorage.setItem(LS_UID_KEY, currentUid);
          }
        }
      } catch (error) {
        console.error("Error loading game state:", error);
      } finally {
        setDataLoading(false);
      }
    }

    loadData();
  }, [firebaseUser]);

  // Auto-redirect: se já existe sessão ativa e dados carregados, ir direto para USER
  useEffect(() => {
    if (firebaseUser && !dataLoading && gameState.hasOnboarded && view === "LANDING") {
      setView("USER");
    }
  }, [firebaseUser, dataLoading, gameState.hasOnboarded, view]);

  // Sync GameState to Firestore on changes
  // IMPORTANT: Only save AFTER data has been loaded from Firestore at least once.
  // This prevents a race condition where INITIAL_GAME_STATE (hasOnboarded=false)
  // would overwrite the real user data before loadData() finishes.
  useEffect(() => {
    if (!firebaseUser || !dataLoaded) return;

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
  }, [gameState, firebaseUser, dataLoaded]);


  const completeOnboarding = (
    nickname: string,
    sociodemographicData: SociodemographicData
  ) => {
    // 1. Completar onboarding SEMPRE, independente de notificações
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

    // 2. Solicitar notificação em paralelo (não bloqueia o onboarding)
    NotificationService.init().then(async (service) => {
      const token = await service.initializeNotificationsForNewUser();
      if (token && firebaseUser) {
        setGameState((prev) => ({
          ...prev,
          user: {
            ...prev.user,
            tokenNotifications: token,
          },
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
          <ParticipantMainScreen
            gameState={gameState}
            setGameState={setGameState}
            onLogout={() => setView("LANDING")}
            authUser={firebaseUser}
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
