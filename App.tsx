import React, { useState, useEffect } from "react";
import { GameState } from "./components/data/GameState";
import { SociodemographicData } from "./components/data/SocialDemographicData";
import { LandingScreen } from "./components/LandingScreen";
import { AdminDashboardScreen } from "./components/screen/AdminDashboardScreen";
import { AdminLoginScreen } from "./components/screen/AdminLoginScreen";
import { OnboardingScreen } from "./components/screen/OnboardingScreen";
import { ParticipantMainScreen } from "./components/screen/ParticipantMainScreen";
import { useAuth } from "./contexts/AuthContext";
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "./services/firebase";
import { NotificationService } from "./services/NotificationService";
import { RecoveryLoginScreen } from "./components/screen/RecoveryLoginScreen";

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

type ViewState = "LANDING" | "USER" | "ADMIN_LOGIN" | "ADMIN_DASHBOARD" | "RECOVERY_LOGIN";

// --- START: Main App Component ---

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>("LANDING");
  const { user: firebaseUser, signInAnonymously: authSignInAnonymously, logout: authLogout, loading: authLoading } = useAuth();
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
      if (!firebaseUser || (firebaseUser.email && firebaseUser.email === import.meta.env.VITE_ADMIN_EMAIL)) {
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
          if (!data.responses) {
            data.responses = [];
          } else if (!Array.isArray(data.responses)) {
            data.responses = Object.values(data.responses);
          }

          if (!data.pings || !Array.isArray(data.pings)) {
            data.pings = INITIAL_GAME_STATE.pings;
          } else if (data.pings.length > 0 && Array.isArray(data.pings[0])) {
            data.pings = (data.pings as any).map((dayArr: any) => ({ statuses: dayArr }));
          }

          setGameState(data);
          setDataLoaded(true);
          localStorage.setItem(LS_UID_KEY, currentUid);
        } else {
          // No data for current UID — check if there's a previous UID with data
          const previousUid = localStorage.getItem(LS_UID_KEY);
          if (previousUid && previousUid !== currentUid) {
            // Try to recover data from the previous anonymous session
            const previousDocRef = doc(db, "users", previousUid);
            const previousDocSnap = await getDoc(previousDocRef);
            if (previousDocSnap.exists()) {
              const previousData = previousDocSnap.data() as GameState;
              if (!previousData.responses) {
                previousData.responses = [];
              } else if (!Array.isArray(previousData.responses)) {
                previousData.responses = Object.values(previousData.responses);
              }
              if (!previousData.pings || !Array.isArray(previousData.pings)) {
                previousData.pings = INITIAL_GAME_STATE.pings;
              }
              // Migrate data to new UID
              await setDoc(docRef, previousData, { merge: true });
              setGameState(previousData);
              setDataLoaded(true);
              localStorage.setItem(LS_UID_KEY, currentUid);
              console.log("Migrated participant data from previous UID to new UID.");
            } else {
              // Previous UID also has no data — create fresh document
              await setDoc(docRef, INITIAL_GAME_STATE);
              setGameState(INITIAL_GAME_STATE);
              setDataLoaded(true);
              localStorage.setItem(LS_UID_KEY, currentUid);
              console.log("New participant document created in Firestore.");
            }
          } else {
            // No previous UID — genuinely new user
            await setDoc(docRef, INITIAL_GAME_STATE);
            setGameState(INITIAL_GAME_STATE);
            setDataLoaded(true);
            localStorage.setItem(LS_UID_KEY, currentUid);
            console.log("New participant document created in Firestore.");
          }
        }
      } catch (error) {
        console.error("Error loading game state from Firestore:", error);
        // On read error, still set dataLoaded to allow the app to function
        setDataLoaded(true);
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
        // Strip out any undefined or complex objects (React events, functions, etc)
        const sanitizedData = JSON.parse(JSON.stringify(gameState));
        const docRef = doc(db, "users", firebaseUser.uid);
        await setDoc(docRef, sanitizedData, { merge: true });
      } catch (error) {
        console.error("Error saving game state:", error);
      }
    };

    // Debounce could be added here, but for now direct save is safer for data integrity
    const timeoutId = setTimeout(saveState, 1000);
    return () => clearTimeout(timeoutId);
  }, [gameState, firebaseUser, dataLoaded]);


  const completeOnboarding = async (
    nickname: string,
    sociodemographicData: SociodemographicData,
    accessCode: string
  ) => {
    const newState = {
      ...gameState,
      hasOnboarded: true,
      studyStartDate: new Date().toISOString(),
      user: {
        ...gameState.user,
        nickname,
        accessCode
      },
      sociodemographicData,
    };

    // 1. Update React state
    setGameState(newState);

    // 2. IMMEDIATELY save to Firestore — do not rely on the debounced useEffect,
    //    which could be missed if the session ends within the 1-second window.
    if (firebaseUser) {
      try {
        const sanitizedData = JSON.parse(JSON.stringify(newState));
        const docRef = doc(db, "users", firebaseUser.uid);
        await setDoc(docRef, sanitizedData, { merge: true });
        console.log("Onboarding data saved to Firestore immediately.");
      } catch (error) {
        console.error("Error saving onboarding data:", error);
      }
    }

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

  const handleLogout = async () => {
    await authLogout();
    // Clear local storage for next anonymous user
    localStorage.removeItem(LS_UID_KEY);
    setGameState(INITIAL_GAME_STATE);
    setDataLoaded(false);
    setView("LANDING");
  };

  const handleUserEnter = async () => {
    if (!firebaseUser) {
      await authSignInAnonymously();
    }
    setView("USER");
  };

  const handleRecoverAccount = async (code: string): Promise<boolean> => {
    try {
      const q = query(collection(db, "users"), where("user.accessCode", "==", code));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Found user with this access code
        const recoveredDoc = querySnapshot.docs[0];
        const recoveredData = recoveredDoc.data() as GameState;

        // Sign in anonymously to ensure we have a current uid if dropped
        if (!firebaseUser) {
          await authSignInAnonymously();
          // wait a tiny bit to let auth propagate if needed
          await new Promise(r => setTimeout(r, 1000));
        }

        const uidToSave = firebaseUser ? firebaseUser.uid : auth.currentUser?.uid;
        if (!uidToSave) throw new Error("Could not authenticate");

        // Clone recovered data to new UID doc
        const docRef = doc(db, "users", uidToSave);
        await setDoc(docRef, recoveredData, { merge: true });

        // Update local state
        setGameState(recoveredData);
        setDataLoaded(true);
        localStorage.setItem(LS_UID_KEY, uidToSave);
        setView("USER");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error recovering account:", error);
      return false;
    }
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
            onRecoverSelect={() => setView("RECOVERY_LOGIN")}
          />
        );
      case "RECOVERY_LOGIN":
        return (
          <RecoveryLoginScreen
            onRecover={handleRecoverAccount}
            onCancel={() => setView("LANDING")}
          />
        );
      case "ADMIN_LOGIN":
        return (
          <AdminLoginScreen
            onLoginSuccess={handleAdminLoginSuccess}
            onBack={handleLogout}
          />
        );
      case "ADMIN_DASHBOARD":
        return (
          <AdminDashboardScreen
            onLogout={handleLogout}
          />
        );
      case "USER":
        return !gameState.hasOnboarded ? (
          <OnboardingScreen onComplete={completeOnboarding} />
        ) : (
          <ParticipantMainScreen
            gameState={gameState}
            setGameState={setGameState}
            onLogout={handleLogout}
            authUser={firebaseUser}
          />
        );
      default:
        return (
          <LandingScreen
            onUserSelect={handleUserEnter}
            onAdminSelect={() => setView("ADMIN_LOGIN")}
            onRecoverSelect={() => setView("RECOVERY_LOGIN")}
          />
        );
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-brand-dark bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,128,128,0.3),rgba(255,255,255,0))] text-gray-200 font-sans">
      {renderView()}
    </div>
  );
};

export default App;
