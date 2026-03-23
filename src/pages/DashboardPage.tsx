import { GameState } from "@/src/components/data/GameState";
import { InstrumentResponse } from "@/src/components/data/InstrumentResponse";
import { InstrumentFlowState } from "@/src/components/states/InstrumentFlowState";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { evaluateFullJourneySchedule, getJourneyStartDate } from "@/src/utils/timeUtils";
import { InstrumentModal } from "@/src/components/modal/InstrumentModal";
import { PerformanceModal } from "@/src/components/modal/PerformanceModal";
import { ParticipantReportModal } from "@/src/components/modal/ParticipantReportModal";
import { ScreenTimeModal } from "@/src/components/modal/ScreenTimeModal";
import { ScreenTimeEntry } from "@/src/components/screen/ScreenTimeEntry";
import { RcleModal } from "@/src/components/modal/RcleModal";
import { SociodemographicModal } from "@/src/components/modal/SociodemographicModal";
import { isEligibleForReport } from "@/src/utils/ReportGeneratorUtils";
import { BottomNav, Tab } from "@/src/components/navigation/BottomNav";
import { HomeTab } from "@/src/components/tabs/HomeTab";
import { ProfileMenu } from "@/src/components/menu/ProfileMenu";
import { SocialTab } from "@/src/components/tabs/SocialTab";
import { ConquistasTab } from "@/src/components/tabs/ConquistasTab";
import { TutoriaisTab } from "@/src/components/tabs/TutoriaisTab";
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
  const [hasSeenTutorial, setHasSeenTutorial] = useState(
    () => localStorage.getItem("psylogos_tutorial_seen") === "true"
  );

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "tutoriais" && !hasSeenTutorial) {
      setHasSeenTutorial(true);
      localStorage.setItem("psylogos_tutorial_seen", "true");
    }
  };
  const [isRcleModalOpen, setIsRcleModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSociodemographicModalOpen, setIsSociodemographicModalOpen] = useState(false);
  const [instrumentFlow, setInstrumentFlow] = useState<InstrumentFlowState>(null);
  const [isInstrumentModalVisible, setIsInstrumentModalVisible] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [isScreenTimeModalOpen, setIsScreenTimeModalOpen] = useState(false);
  const [timerTargetDate, setTimerTargetDate] = useState<Date | null>(null);
  const [timerLabel, setTimerLabel] = useState<string>("");
  const [isActiveWindow, setIsActiveWindow] = useState(false);
  const [isBeforeStudyStart, setIsBeforeStudyStart] = useState(false);
  const [firstPingDate, setFirstPingDate] = useState<Date | null>(null);
  const { logout, user } = useAuth();
  const isAdmin = user?.email === 'gothya@gmail.com';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const pings = participante?.pings ?? [];
  const screenTimeLogs = participante?.dailyScreenTimeLogs ?? [];
  const today = new Date().toISOString().slice(0, 10);
  // Dias DISTINTOS registrados (evita unlock por múltiplas submissões no mesmo dia)
  const screenTimeCount = new Set(screenTimeLogs.map(l => l.date)).size;
  const screenTimeToday = screenTimeLogs.some(l => l.date === today);
  const isReportAvailable = pings.length > 0 && isEligibleForReport(pings) && screenTimeCount >= 3;

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
      const now = new Date();
      setFirstPingDate(journeyStart);
      setIsBeforeStudyStart(now < journeyStart);

      const result = evaluateFullJourneySchedule(
        journeyStart,
        participante.pings,
        now
      );

      // Se o modal está visível e sendo respondido, não altera o schedule
      if (instrumentFlow && isInstrumentModalVisible) return;

      // Flow em memória mas modal oculto — verifica se o ping ainda está na janela ativa
      if (instrumentFlow && !isInstrumentModalVisible) {
        const isFlowPingStillActive =
          (result.currentActivePing?.day === instrumentFlow.ping.day && result.currentActivePing?.ping === instrumentFlow.ping.ping) ||
          (result.currentTimeWindowPing?.day === instrumentFlow.ping.day && result.currentTimeWindowPing?.ping === instrumentFlow.ping.ping);
        if (!isFlowPingStillActive) {
          setInstrumentFlow(null);
          // Continua a avaliação para marcar o ping como missed normalmente
        } else {
          return; // Ping ainda ativo, usuário pode retomar
        }
      }

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

        result.newlyMissedPings.forEach(({ day, ping }) => {
          newPings[day].statuses[ping] = "missed";
        });

        // Atualiza SOMENTE pings — nunca responses.
        // Escrever responses aqui causaria perda de dados se o estado local estiver stale
        // (ex: outro dispositivo/aba com fetch anterior à resposta do participante).
        updateParticipante({ ...participante, pings: newPings });
        try {
          if (participante.firebaseId) {
            await UserService.updatePingsOnly(participante.firebaseId, newPings);
          }
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

  }, [participante, instrumentFlow, isInstrumentModalVisible, updateParticipante]);

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

  const savePartialResponse = useCallback(async (data: Partial<InstrumentResponse>, completedStep: string) => {
    if (!participante?.firebaseId) return;

    const partial: InstrumentResponse = {
      ...(data as InstrumentResponse),
      isPartial: true,
      lastCompletedStep: completedStep,
    };

    const newResponses = participante.responses.some(
      r => r.pingDay === partial.pingDay && r.pingIndex === partial.pingIndex && r.isPartial === true
    )
      ? participante.responses.map(r =>
        r.pingDay === partial.pingDay && r.pingIndex === partial.pingIndex && r.isPartial === true
          ? partial : r
      )
      : [...participante.responses, partial];

    updateParticipante({ ...participante, responses: newResponses });
    try {
      await UserService.saveResponses(participante.firebaseId, newResponses);
    } catch (e) {
      console.error("Erro ao salvar resposta parcial:", e);
    }
  }, [participante, updateParticipante]);

  const startInstrumentFlow = useCallback(async (force = false) => {
    if (!highlightedPing || !participante) return;

    // Se já existe um flow em memória para o mesmo ping, apenas reexibe o modal
    if (
      instrumentFlow &&
      instrumentFlow.ping.day === highlightedPing.day &&
      instrumentFlow.ping.ping === highlightedPing.ping
    ) {
      setIsInstrumentModalVisible(true);
      return;
    }

    const previousStatus = participante.pings[highlightedPing.day]?.statuses[highlightedPing.ping];
    if (!force && previousStatus === "completed") {
      setShowOverwriteConfirm(true);
      return;
    }

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
    setIsInstrumentModalVisible(true);
  }, [highlightedPing, participante, instrumentFlow]);

  // Listener for Notification Clicks (Deep Linking)
  useEffect(() => {
    const handleOpenIntent = () => {
      if (highlightedPing) {
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

  const calculateLevel = (xp: number): number => Math.floor(xp / 160) + 1;

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

    // Remove resposta parcial deste ping (se existir) antes de finalizar
    const responsesWithoutPartial = participante.responses.filter(
      r => !(r.pingDay === day && r.pingIndex === ping && r.isPartial === true)
    );

    // Se o ping já havia sido respondido, invalida a resposta anterior e mantém ambas.
    // Se era missed ou pending, apenas adiciona a nova resposta como válida.
    const newResponses: InstrumentResponse[] =
      previousStatus === "completed"
        ? [
          ...responsesWithoutPartial.map((r) =>
            r.pingDay === day && r.pingIndex === ping
              ? { ...r, isValid: false }
              : r
          ),
          { ...finalResponseData, isValid: true, isPartial: false },
        ]
        : [...responsesWithoutPartial, { ...finalResponseData, isValid: true, isPartial: false }];

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

  // Restaura formulário parcialmente respondido ao carregar o participante
  useEffect(() => {
    if (!participante || !highlightedPing || instrumentFlow) return;

    const partial = participante.responses.find(
      r => r.pingDay === highlightedPing.day && r.pingIndex === highlightedPing.ping && r.isPartial === true
    );
    if (!partial?.lastCompletedStep) return;

    const stepMap: Record<string, "feed_context" | "panas_contextual" | "end_of_day_log"> = {
      sam: "feed_context",
      feed_context: "panas_contextual",
      panas_daily: "end_of_day_log",
    };
    const nextStep = stepMap[partial.lastCompletedStep];
    if (!nextStep) return;

    const isEndOfDay = (highlightedPing.ping + 1) % 7 === 0;
    setInstrumentFlow({
      ping: highlightedPing,
      type: isEndOfDay ? "end_of_day" : "regular",
      step: nextStep,
      data: partial,
    });
    setIsInstrumentModalVisible(true);
  }, [participante, highlightedPing, instrumentFlow]);

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
        setInstrumentFlow({ ...instrumentFlow, step: "feed_context", data: newData });
        savePartialResponse(newData, "sam");
      } else if (instrumentFlow.step === "feed_context") {
        setInstrumentFlow({ ...instrumentFlow, step: "panas_contextual", data: newData });
        savePartialResponse(newData, "feed_context");
      } else if (instrumentFlow.step === "panas_contextual") {
        handleInstrumentFlowFinish(newData as InstrumentResponse);
      }
    } else {
      // end_of_day
      if (instrumentFlow.step === "panas_daily") {
        setInstrumentFlow({ ...instrumentFlow, step: "end_of_day_log", data: newData });
        savePartialResponse(newData, "panas_daily");
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

  const handleSaveScreenTime = async (entries: ScreenTimeEntry[], date: string) => {
    if (!participante) return;
    const existing = participante.dailyScreenTimeLogs ?? [];
    const newLogs = existing.some(l => l.date === date)
      ? existing.map(l => l.date === date ? { ...l, entries } : l)
      : [...existing, { date, entries }];

    // XP apenas no primeiro registro desse dia específico
    const alreadyLoggedThatDay = existing.some(l => l.date === date);
    const newXp = alreadyLoggedThatDay
      ? (participante.user.points ?? 0)
      : (participante.user.points ?? 0) + 500;
    const newLevel = calculateLevel(newXp);
    const newState = {
      ...participante,
      dailyScreenTimeLogs: newLogs,
      user: { ...participante.user, points: newXp, level: newLevel },
    };
    updateParticipante(newState);
    setIsScreenTimeModalOpen(false);
    try {
      await UserService.saveDailyScreenTimeLogs(newState);
    } catch (e) {
      console.error("Erro ao salvar tempo de tela:", e);
    }
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

      {/* ── Modal de confirmação de sobrescrita ── */}
      {showOverwriteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-sm mx-4 text-center">
            <p className="text-white font-semibold mb-2">Ping já respondido</p>
            <p className="text-gray-400 text-sm mb-6">
              Você já respondeu este ping. Deseja substituir suas respostas?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowOverwriteConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-slate-700 text-gray-300 hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setShowOverwriteConfirm(false); startInstrumentFlow(true); }}
                className="flex-1 py-2 rounded-lg bg-cyan-500 text-slate-900 font-semibold hover:bg-cyan-400 transition-colors"
              >
                Substituir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modais (preservados, sem alteração) ── */}
      {instrumentFlow && isInstrumentModalVisible && (
        <InstrumentModal
          flow={instrumentFlow}
          onStep={handleInstrumentStep}
          onCancel={() => setIsInstrumentModalVisible(false)}
          onMinimize={() => setIsInstrumentModalVisible(false)}
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
          testMode={false}
        />
      )}
      {isScreenTimeModalOpen && (
        <ScreenTimeModal
          onSave={handleSaveScreenTime}
          onClose={() => setIsScreenTimeModalOpen(false)}
          studyStartDate={participante?.studyStartDate ?? null}
          existingLogs={screenTimeLogs}
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

      {/* ── Menu global (todas as abas) ── */}
      <div ref={profileMenuRef} className="relative flex-shrink-0 px-4 pt-3 pb-1 flex items-center">
        <button
          onClick={() => setIsProfileMenuOpen(prev => !prev)}
          className="p-2 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
          aria-label="Menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {isProfileMenuOpen && participante && (
          <ProfileMenu
            onUpload={() => fileInputRef.current?.click()}
            onRemove={handleRemoveAvatar}
            onViewRcle={() => { setIsRcleModalOpen(true); setIsProfileMenuOpen(false); }}
            onViewPerformance={() => { setIsPerformanceModalOpen(true); setIsProfileMenuOpen(false); }}
            onViewData={() => { setIsSociodemographicModalOpen(true); setIsProfileMenuOpen(false); }}
            onLogout={handleLogout}
            hasAvatar={!!participante.user?.avatar}
            isReportAvailable={isReportAvailable}
            onDownloadReport={() => { setIsReportModalOpen(true); setIsProfileMenuOpen(false); }}
            isAdmin={isAdmin}
            onNavigateAdmin={() => { setIsProfileMenuOpen(false); navigate('/admin'); }}
          />
        )}
      </div>

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
            onLogout={handleLogout}
            isReportAvailable={isReportAvailable}
            onOpenScreenTime={() => setIsScreenTimeModalOpen(true)}
            screenTimeCount={screenTimeCount}
            screenTimeToday={screenTimeToday}
            hasSeenTutorial={hasSeenTutorial}
            onNavigateToTutorial={() => handleTabChange("tutoriais")}
            isBeforeStudyStart={isBeforeStudyStart}
            firstPingDate={firstPingDate}
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
            screenTimeCount={screenTimeCount}
            highlightedPing={highlightedPing}
          />
        )}

        {/* TutoriaisTab — mantido montado para preservar estado do accordion */}
        <div className={activeTab === "tutoriais" ? "" : "hidden"}>
          <TutoriaisTab />
        </div>
      </div>

      {/* ── Bottom Navigation ── */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasUnseenTutorial={!hasSeenTutorial}
        isBellVisible={isBellVisible}
        onBellClick={startInstrumentFlow}
        bellDisabled={!highlightedPing || (!!instrumentFlow && isInstrumentModalVisible)}
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