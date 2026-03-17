import { GameState } from "@/src/components/data/GameState";
import { InstrumentResponse } from "@/src/components/data/InstrumentResponse";
import { InstrumentFlowState } from "@/src/components/states/InstrumentFlowState";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { evaluateFullJourneySchedule, getJourneyStartDate } from "@/src/utils/timeUtils";
import { InstrumentModal } from "@/src/components/modal/InstrumentModal";
import { PerformanceModal } from "@/src/components/modal/PerformanceModal";
import { ParticipantReportModal } from "@/src/components/modal/ParticipantReportModal";
import { RcleModal } from "@/src/components/modal/RcleModal";
import { SociodemographicModal } from "@/src/components/modal/SociodemographicModal";
import { isEligibleForReport } from "@/src/utils/ReportGeneratorUtils";
import { BottomNav, Tab } from "@/src/components/navigation/BottomNav";
import { HomeTab } from "@/src/components/tabs/HomeTab";
import { SocialTab } from "@/src/components/tabs/SocialTab";
import { ConquistasTab } from "@/src/components/tabs/ConquistasTab";
import { useAuth } from "@/src/contexts/AuthContext";
import { db } from "@/src/services/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getMessaging, getToken } from "firebase/messaging";
import { useNavigate } from "react-router-dom";
import { useParticipante } from "../hooks/useParticipante";
import UserService from "../service/user/UserService";
import { NotificationService } from "../services/NotificationService";


export const DashboardPage: React.FC<{

}> = () => {
  const { participante, loading, updateParticipante } = useParticipante();

  const [highlightedPing, setHighlightedPing] = useState<{
    day: number;
    ping: number;
  } | null>(null);
  const [isBellVisible, setIsBellVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [isRcleModalOpen, setIsRcleModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSociodemographicModalOpen, setIsSociodemographicModalOpen] = useState(false);
  const [instrumentFlow, setInstrumentFlow] = useState<InstrumentFlowState>(null);
  const [timerTargetDate, setTimerTargetDate] = useState<Date | null>(null);
  const [timerLabel, setTimerLabel] = useState<string>("");
  const [isActiveWindow, setIsActiveWindow] = useState(false);
  const { logout } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const pings = participante?.pings ?? [];
  const isReportAvailable = pings.length > 0 && isEligibleForReport(pings);

  const navigate = useNavigate();



  // Leaderboard State
  const [leaderboardData, setLeaderboardData] = useState<{ nickname: string, points: number }[]>([]);

  // Fetch Leaderboard Real-time
  useEffect(() => {
    const q = query(collection(db, "participantes"), orderBy("user.points", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const players: { nickname: string, points: number }[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as GameState;
        players.push({
          nickname: data.user?.nickname,
          points: data.user?.points
        });
      });
      setLeaderboardData(players);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!participante || !participante.studyStartDate) return;

    const journeyStart = getJourneyStartDate(participante.studyStartDate);

    const evaluateSchedule = async () => {
      // Don't evaluate if we are currently answering a ping
      if (instrumentFlow) return;

      const result = evaluateFullJourneySchedule(
        journeyStart,
        participante.pings,
        new Date()
      );

      console.log("[Schedule]", new Date().toLocaleTimeString(), {
        currentActivePing: result.currentActivePing,
        currentTimeWindowPing: result.currentTimeWindowPing,
        nextFuturePing: result.nextFuturePing,
        isBellVisible,
        highlightedPing,
        isActiveWindow,
      });

      // 1. Handle Newly Missed Pings
      if (result.newlyMissedPings.length > 0) {
        console.log("Found missed pings:", result.newlyMissedPings);
        
        const newPings = participante.pings.map((dayObj) => ({
          ...dayObj,
          statuses: [...dayObj.statuses],
        }));

        result.newlyMissedPings.forEach(({day, ping}) => {
          newPings[day].statuses[ping] = "missed";
        });

        const newState = {
          ...participante,
          pings: newPings,
        };

        updateParticipante(newState);
        try {
          await UserService.updateUser(newState);
        } catch (error) {
          console.error("Erro ao salvar pings perdidos:", error);
        }
        return; // wait for next render with new state
      }

      // 2. Journey Complete
      if (result.isJourneyComplete) {
         setTimerLabel("Jornada Concluída");
         setTimerTargetDate(null);
         setIsActiveWindow(false);
         setHighlightedPing(null);
         setIsBellVisible(false);
         return;
      }

      // 3. Active Ping (pendente — sino aparece)
      if (result.currentActivePing) {
         setHighlightedPing({ day: result.currentActivePing.day, ping: result.currentActivePing.ping });
         setIsBellVisible(true);
         setTimerLabel("Responder até:");
         setTimerTargetDate(result.currentActivePing.expiresAt);
         setIsActiveWindow(true);
         return;
      }

      // 3.5. Janela ativa mas ping já respondido/perdido — sino permanece visível para re-resposta
      if (result.currentTimeWindowPing) {
         setHighlightedPing({ day: result.currentTimeWindowPing.day, ping: result.currentTimeWindowPing.ping });
         setIsBellVisible(true);
         setTimerLabel("Responder até:");
         setTimerTargetDate(result.currentTimeWindowPing.expiresAt);
         setIsActiveWindow(true);
         return;
      }

      // 4. Future Ping
      if (result.nextFuturePing) {
         setHighlightedPing({ day: result.nextFuturePing.day, ping: result.nextFuturePing.ping });
         setIsBellVisible(false);
         setTimerLabel("Próximo Ping:");
         setTimerTargetDate(result.nextFuturePing.startsAt);
         setIsActiveWindow(false);
      }
    };

    evaluateSchedule();

    const intervalId = setInterval(evaluateSchedule, 5000); // Check every 5 seconds
    return () => clearInterval(intervalId);

  }, [participante, instrumentFlow, updateParticipante]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function handlePushPermission() {
      if (!("Notification" in window)) return;

      const currentPermission = Notification.permission;

      // Se nunca decidiu ainda
      if (currentPermission === "default") {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
          await registerPushToken();
        }
      }

      // Se já está granted
      if (currentPermission === "granted") {
        await registerPushToken();
      }
    }

    handlePushPermission();
  }, []);

  const registerPushToken = async () => {
    try {
      const service = await NotificationService.init();
      const token = await service.requestPermission();

      if (token && participante?.firebaseId) {
        await service.saveTokenToFirestore(participante.firebaseId, token);
      }
    } catch (error) {
      console.error("Erro ao registrar push:", error);
    }
  };

  const functions = getFunctions();
  const sendPush = httpsCallable(functions, 'sendPushNotification');

  const startInstrumentFlow = useCallback(async () => {
    if (!highlightedPing) return;
    const isEndOfDay = (highlightedPing.ping + 1) % 7 === 0;

    if (isEndOfDay) {
      setInstrumentFlow({
        ping: highlightedPing,
        type: "end_of_day",
        step: "panas_daily",
        data: {
          timestamp: new Date().toISOString(),
          pingDay: highlightedPing.day,
          pingIndex: highlightedPing.ping,
          type: "end_of_day",
        },
      });
    } else {
      setInstrumentFlow({
        ping: highlightedPing,
        type: "regular",
        step: "sam",
        data: {
          timestamp: new Date().toISOString(),
          pingDay: highlightedPing.day,
          pingIndex: highlightedPing.ping,
          type: "regular",
        },
      });
    }
  }, [highlightedPing]);

  // Listener for Notification Clicks (Deep Linking)
  useEffect(() => {
    const handleOpenIntent = () => {
      if (highlightedPing && !instrumentFlow) {
        console.log("Opening ping via notification interaction");
        startInstrumentFlow();

        // Clean up URL param if present
        const url = new URL(window.location.href);
        if (url.searchParams.get('open_ping')) {
          url.searchParams.delete('open_ping');
          window.history.replaceState({}, '', url);
        }
      }
    };

    // 1. Check URL param on mount
    const params = new URLSearchParams(window.location.search);
    if (params.get('open_ping') === 'true') {
      setTimeout(handleOpenIntent, 1000);
    }

    // 2. Listen for SW messages
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.action === 'open_ping') {
        handleOpenIntent();
      }
    };
    navigator.serviceWorker?.addEventListener('message', messageHandler);

    // 3. Listen for Foreground intent
    const customEventHandler = () => handleOpenIntent();
    window.addEventListener('open_ping_intent', customEventHandler);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', messageHandler);
      window.removeEventListener('open_ping_intent', customEventHandler);
    };
  }, [highlightedPing, instrumentFlow, startInstrumentFlow]);

  const LEVEL_THRESHOLDS = [
    0, 160, 320, 480, 640, 800, 960, 1120, 1280, 1440, 1600, 1760, 1920, 2080,
    2240, 2400, 2560, 2720, 2880, 3040, 3200,
  ];

  const calculateLevel = (xp: number): number => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  };

  const handleInstrumentFlowFinish = async (
    finalResponseData: InstrumentResponse
  ) => {
    if (!instrumentFlow || !participante) return;

    const { day, ping } = instrumentFlow.ping;
    const previousStatus = participante.pings[day].statuses[ping];

    const newPings = participante.pings.map((dayObj) => ({
      ...dayObj,
      statuses: [...dayObj.statuses],
    }));

    newPings[day].statuses[ping] = "completed";

    // Se o ping já havia sido respondido, invalida a resposta anterior e mantém ambas.
    // Se era missed ou pending, apenas adiciona a nova resposta como válida.
    const newResponses: InstrumentResponse[] =
      previousStatus === "completed"
        ? [
            ...participante.responses.map((r) =>
              r.pingDay === day && r.pingIndex === ping
                ? { ...r, isValid: false }
                : r
            ),
            { ...finalResponseData, isValid: true },
          ]
        : [...participante.responses, { ...finalResponseData, isValid: true }];

    const newXp = newPings.reduce((acc, dayObj) => {
      return (
        acc +
        dayObj.statuses.reduce((dayAcc, status, pingIndex) => {
          if (status === "completed") {
            const isStar = pingIndex === 6;
            return dayAcc + (isStar ? 100 : 50);
          }
          return dayAcc;
        }, 0)
      );
    }, 0);

    const newLevel = calculateLevel(newXp);

    const newState = {
      ...participante,
      pings: newPings,
      responses: newResponses,
      user: {
        ...participante.user,
        points: newXp,
        level: newLevel,
      },
    };

    try {
      await UserService.updateUser(newState);
      updateParticipante(newState);
      setInstrumentFlow(null);
      // Sino permanece visível — o evaluateSchedule controla via currentTimeWindowPing
    }
    catch (error) {
      console.error("Erro ao finalizar instrumento:", error);
    }
  };

  // Note: 5 Minute Timeout for Active Ping was removed
  // The schedule evaluator completely handles missed pings on a fixed real-world timeline.

  useEffect(() => {
    if (loading) return;
    
    // Se não há dados do participante no banco, forçamos o onboarding
    if (!participante) {
      console.log("Usuário autenticado, mas sem dados de participante. Redirecionando para onboarding.");
      navigate("/onboarding");
      return;
    }

    if (participante.user?.nickname === "Iniciante") {
      navigate("/onboarding");
    }
  }, [participante, loading, navigate]);

  const handleInstrumentStep = (stepData: Partial<InstrumentResponse>) => {
    if (!instrumentFlow) return;

    const newData = { ...instrumentFlow.data, ...stepData };

    if (instrumentFlow.type === "regular") {
      if (instrumentFlow.step === "sam") {
        setInstrumentFlow({
          ...instrumentFlow,
          step: "feed_context",
          data: newData,
        });
      } else if (instrumentFlow.step === "feed_context") {
        setInstrumentFlow({
          ...instrumentFlow,
          step: "panas_contextual",
          data: newData,
        });
      } else if (instrumentFlow.step === "panas_contextual") {
        handleInstrumentFlowFinish(newData as InstrumentResponse);
      }
    } else {
      // end_of_day
      if (instrumentFlow.step === "panas_daily") {
        setInstrumentFlow({
          ...instrumentFlow,
          step: "end_of_day_log",
          data: newData,
        });
      } else if (instrumentFlow.step === "end_of_day_log") {
        handleInstrumentFlowFinish(newData as InstrumentResponse);
      }
    }
  };

  const handleAvatarChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!participante) return;

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onloadend = async () => {
        const newState = {
          ...participante,
          user: {
            ...participante.user,
            avatar: reader.result as string,
          },
        };

        // 🔥 Atualiza estado local
        updateParticipante(newState);

        // 🔥 (Recomendado) Salva no Firestore
        await UserService.updateUser(newState);
      };

      reader.readAsDataURL(file);
    }

    setIsProfileMenuOpen(false);
  };

  const handleRemoveAvatar = async () => {
    if (!participante) return;

    const newState = {
      ...participante,
      user: {
        ...participante.user,
        avatar: null,
      },
    };

    // 🔥 Atualiza estado local
    updateParticipante(newState);

    // 🔥 Persistir no Firestore (IMPORTANTE)
    await UserService.updateUser(newState);

    setIsProfileMenuOpen(false);
  };

  const handleTimerEnd = useCallback(async () => {
    console.log("[TimerEnd]", new Date().toLocaleTimeString(), { isActiveWindow, highlightedPing });
    if (!isActiveWindow) {
      // It was waiting for a future ping, which just started.
      setIsBellVisible(true);
      try {
        const currentToken = await getToken(getMessaging(), {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        })

        if (currentToken) {
          const response = await sendPush({
            token: currentToken,
            title: "É hora do Ping!",
            body: "Você tem 25 minutos para responder ao seu ping do Psylogos."
          });
          console.log("Push notification sent successfully:", response, new Date().toISOString());
        }
      }
      catch (error) {
        console.error("Error fetching FCM token:", error);
      }
    }
  }, [isActiveWindow, sendPush]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleUpdateNickname = async (newNickname: string) => {
    if (!participante) return;
    const newState = {
      ...participante,
      user: {
        ...participante.user,
        nickname: newNickname,
      },
    };

    updateParticipante(newState);
    await UserService.updateUser(newState);
  };

  const handleUpdateSocio = async (newData: any) => {
    if (!participante) return;
    const newState = {
      ...participante,
      sociodemographicData: newData,
    };

    updateParticipante(newState);
    await UserService.updateUser(newState);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-brand-dark">

      {/* ── Modais (preservados, sem alteração) ── */}
      {instrumentFlow && (
        <InstrumentModal
          flow={instrumentFlow}
          onStep={handleInstrumentStep}
          onCancel={() => setInstrumentFlow(null)}
        />
      )}
      {isRcleModalOpen && (
        <RcleModal onClose={() => setIsRcleModalOpen(false)} />
      )}
      {isSociodemographicModalOpen && participante.sociodemographicData && participante.user && (
        <SociodemographicModal
          onClose={() => setIsSociodemographicModalOpen(false)}
          data={participante.sociodemographicData}
          nickname={participante.user.nickname}
          onSaveNickname={handleUpdateNickname}
          onSaveSocio={handleUpdateSocio}
        />
      )}
      {isPerformanceModalOpen && (
        <PerformanceModal
          onClose={() => setIsPerformanceModalOpen(false)}
          gameState={participante}
        />
      )}
      {isReportModalOpen && participante && (
        <ParticipantReportModal
          gameState={participante}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {/* Hidden file input for avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/png, image/jpeg"
        className="hidden"
      />

      {/* ── Conteúdo da aba ativa (scrollável) ── */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "5rem" }}>
        {activeTab === "home" && participante && (
          <HomeTab
            participante={participante}
            highlightedPing={highlightedPing}
            timerTargetDate={timerTargetDate}
            timerLabel={timerLabel}
            isActiveWindow={isActiveWindow}
            onTimerEnd={handleTimerEnd}
            isProfileMenuOpen={isProfileMenuOpen}
            onToggleProfileMenu={() => setIsProfileMenuOpen(prev => !prev)}
            onCloseProfileMenu={() => setIsProfileMenuOpen(false)}
            onUpload={() => fileInputRef.current?.click()}
            onRemove={handleRemoveAvatar}
            onViewRcle={() => { setIsRcleModalOpen(true); setIsProfileMenuOpen(false); }}
            onViewPerformance={() => { setIsPerformanceModalOpen(true); setIsProfileMenuOpen(false); }}
            onViewData={() => { setIsSociodemographicModalOpen(true); setIsProfileMenuOpen(false); }}
            onLogout={handleLogout}
            isReportAvailable={isReportAvailable}
            onDownloadReport={() => { setIsReportModalOpen(true); setIsProfileMenuOpen(false); }}
          />
        )}
        {activeTab === "social" && (
          <SocialTab
            leaderboardData={leaderboardData}
            currentNickname={participante?.user?.nickname}
          />
        )}
        {activeTab === "conquistas" && participante && (
          <ConquistasTab
            participante={participante}
            isReportAvailable={isReportAvailable}
            onOpenReport={() => setIsReportModalOpen(true)}
          />
        )}
      </div>

      {/* ── Bottom Navigation ── */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isBellVisible={isBellVisible}
        onBellClick={startInstrumentFlow}
        bellDisabled={!highlightedPing || !!instrumentFlow}
      />

      <style>{`
        .form-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          color: white;
          background-color: rgba(0, 255, 255, 0.05);
          border: 1px solid rgba(0, 255, 255, 0.2);
          border-radius: 0.375rem;
          transition: all 0.2s;
        }
        .form-input:focus {
          outline: none;
          border-color: rgba(0, 255, 255, 0.6);
          box-shadow: 0 0 8px rgba(0, 255, 255, 0.4), 0 0 3px rgba(0, 255, 255, 0.6);
        }
        textarea.form-input { min-height: 80px; }
      `}</style>
    </div>
  );
};