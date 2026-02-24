import { GameState } from "@/src/components/data/GameState";
import { InstrumentResponse } from "@/src/components/data/InstrumentResponse";
import { InstrumentFlowState } from "@/src/components/states/InstrumentFlowState";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/src/components/Card";
import { CountdownTimer } from "@/src/components/CountdownTimer";
import { EmotionExplorerBadge } from "@/src/components/EmotionExplorerBadge";
import { BellIcon } from "@/src/components/icons/BellIcon";
import { CheckCircleIcon } from "@/src/components/icons/CheckCircleIcon";
import { StarIcon } from "@/src/components/icons/StarIcon";
import { UserIcon } from "@/src/components/icons/UserIcon";
import { XCircleIcon } from "@/src/components/icons/XCircleIcon";
import { ProfileMenu } from "@/src/components/menu/ProfileMenu";
import { InstrumentModal } from "@/src/components/modal/InstrumentModal";
import { PerformanceModal } from "@/src/components/modal/PerformanceModal";
import { RcleModal } from "@/src/components/modal/RcleModal";
import { SociodemographicModal } from "@/src/components/modal/SociodemographicModal";
import { PlexusFace } from "@/src/components/PlexusFace";
import { PodiumItem } from "@/src/components/PodiumItem";
import { useAuth } from "@/src/contexts/AuthContext";
import { db } from "@/src/services/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getMessaging, getToken } from "firebase/messaging";
import { useNavigate } from "react-router-dom";
import { useParticipante } from "../hooks/useParticipante";
import { doc, getDoc, setDoc } from "firebase/firestore";
import UserService from "../service/user/UserService";


export const DashboardPage: React.FC<{

}> = () => {
  const { participante, loading, updateParticipante } = useParticipante();

  const [highlightedPing, setHighlightedPing] = useState<{
    day: number;
    ping: number;
  } | null>(null);
  const [isRcleModalOpen, setIsRcleModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSociodemographicModalOpen, setIsSociodemographicModalOpen] = useState(false);
  const [instrumentFlow, setInstrumentFlow] = useState<InstrumentFlowState>(null);
  const { user: authUser, logout } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const pings = participante?.pings ?? [];

  const navigate = useNavigate();

  const [notificationPermission, setNotificationPermission] = useState(
    Notification.permission
  );

  const requestNotificationPermission = async () => {
    // const service = await NotificationService.init();
    // const token = await service.requestPermission();

    // if (token) {
    //   setNotificationPermission("granted");
    //   if (authUser) {
    //     await service.saveTokenToFirestore(authuser?.uid, token);
    //   }
    //   alert("Notificações ativadas com sucesso!");
    // } else {
    //   setNotificationPermission("denied");
    //   alert("Não foi possível ativar as notificações. Verifique as permissões do navegador.");
    // }
  };



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
    if (!participante) return;
    const findNextPendingPing = () => {
      for (let day = 0; day < pings.length; day++) {
        for (let ping = 0; ping < pings[day].statuses.length; ping++) {
          if (pings[day].statuses[ping] === "pending") {
            return { day, ping };
          }
        }
      }
      return null;
    };
    setHighlightedPing(findNextPendingPing());
  }, [pings]);

  /**
   * ------------------------------------------------
   * UseEffect que carrega os dados do usuário logado
   * ------------------------------------------------
   */
  // useEffect(() => {
  //   async function fetchUserData() {
  //     if (!authUser) return;

  //     const userRef = doc(db, "participantes", authUser.uid);
  //     const userSnap = await getDoc(userRef);

  //     if (userSnap.exists()) {
  //       setUser(userSnap.data());
  //     }
  //   }
  //   fetchUserData();
  // }, [authUser]);

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

  const messaging = getMessaging();
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

    const newPings = participante.pings.map((dayObj) => ({
      ...dayObj,
      statuses: [...dayObj.statuses],
    }));

    newPings[day].statuses[ping] = "completed";

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
      responses: [...participante.responses, finalResponseData],
      user: {
        ...participante.user,
        points: newXp,
        level: newLevel,
      },
    };

    // 🔥 Atualiza estado local
    updateParticipante(newState);

    // 🔥 Atualiza Firestore
    await UserService.updateUser(newState);
  };

  const handleMissedPing = useCallback(() => {
    if (!instrumentFlow || !participante) return;

    const { day, ping } = instrumentFlow.ping;

    const newPings = participante.pings.map((dayObj) => ({
      ...dayObj,
      statuses: [...dayObj.statuses],
    }));

    newPings[day].statuses[ping] = "missed";

    const newState = {
      ...participante,
      pings: newPings,
    };

    // 🔥 Atualiza estado local
    updateParticipante(newState);

    setInstrumentFlow(null);
  }, [instrumentFlow, participante, updateParticipante]);

  // 5 Minute Timeout for Active Ping
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (instrumentFlow) {
      timeoutId = setTimeout(() => {
        handleMissedPing();
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [instrumentFlow, handleMissedPing]);

  useEffect(() => {
    if (loading) return;
    if (!participante) return;

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
    try {
      const currentToken = await getToken(getMessaging(), {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      })

      if (currentToken) {
        const response = await sendPush({
          token: currentToken,
          title: "Teste de Push",
          body: "Isso foi enviado ao clicar no botão!"
        });
        console.log("Push notification sent successfully:", response, new Date().toISOString());
      }
    }
    catch (error) {
      console.error("Error fetching FCM token:", error);
    }

    if (highlightedPing && !instrumentFlow) {
      startInstrumentFlow();
    }
  }, [highlightedPing, instrumentFlow, startInstrumentFlow]);

  const notificationTimes = ["9h", "11h", "13h", "15h", "17h", "19h", "21h"];

  const completedPings = pings ? pings
    .flatMap(d => d.statuses)
    .filter((p, index) => (index + 1) % 7 !== 0 && p === "completed").length : 0;
  const missedPings = pings ? pings
    .flatMap(d => d.statuses)
    .filter((p, index) => (index + 1) % 7 !== 0 && p === "missed").length : 0;
  const completedStars = pings ? pings
    .flatMap(d => d.statuses)
    .filter((p, index) => (index + 1) % 7 === 0 && p === "completed").length : 0;

  const { level, points: totalXp } = participante ? participante?.user : { level: 0, points: 0 };
  const currentLevelXpStart = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelXpTarget =
    LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

  const xpForThisLevel = nextLevelXpTarget - currentLevelXpStart;
  const xpIntoLevel = totalXp - currentLevelXpStart;

  const progressPercentage =
    xpForThisLevel > 0 && xpIntoLevel >= 0
      ? (xpIntoLevel / xpForThisLevel) * 100
      : 0;

  const pingIconClasses = "transition-transform duration-150 ease-in-out";

  // Use real data
  const allPlayers = leaderboardData.length > 0 ? leaderboardData : [{ nickname: participante?.nickname, points: participante?.points }];

  // Fallback if empty (shouldn't happen if user exists)
  // const allPlayers = [
  //   ...MOCK_PLAYERS,
  //   { nickname: user?.nickname, points: user?.points },
  // ].sort((a, b) => b.points - a.points);

  const topThree = allPlayers.slice(0, 3);
  const restOfPlayers = allPlayers.slice(3);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-fade-in">
      {instrumentFlow && (
        <InstrumentModal
          flow={instrumentFlow}
          onStep={handleInstrumentStep}
          onCancel={handleMissedPing}
        />
      )}
      {isRcleModalOpen && (
        <RcleModal onClose={() => setIsRcleModalOpen(false)} />
      )}
      {isSociodemographicModalOpen && participante.sociodemographicData && (
        <SociodemographicModal
          onClose={() => setIsSociodemographicModalOpen(false)}
          data={participante.sociodemographicData}
        />
      )}
      {isPerformanceModalOpen && (
        <PerformanceModal
          onClose={() => setIsPerformanceModalOpen(false)}
          gameState={participante}
        />
      )}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="relative group w-16 h-16 rounded-full bg-slate-800 border-2 border-cyan-400 flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-cyan-300 hover:shadow-glow-blue-sm"
              aria-label="Menu do perfil"
            >
              {participante?.user ? (
                <img
                  src={participante?.user?.avatar}
                  alt="Avatar do usuário"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-8 h-8 text-cyan-400" />
              )}
            </button>
            {isProfileMenuOpen && (
              <ProfileMenu
                onUpload={() => fileInputRef.current?.click()}
                onRemove={handleRemoveAvatar}
                onViewRcle={() => {
                  setIsRcleModalOpen(true);
                  setIsProfileMenuOpen(false);
                }}
                onViewPerformance={() => {
                  setIsPerformanceModalOpen(true);
                  setIsProfileMenuOpen(false);
                }}
                onViewData={() => {
                  setIsSociodemographicModalOpen(true);
                  setIsProfileMenuOpen(false);
                }}
                hasAvatar={!!participante?.avatar}
              />
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/png, image/jpeg"
            className="hidden"
          />
          <div>
            <h1 className="text-xl font-bold text-cyan-400">{participante?.user?.nickname}</h1>
            <p className="text-gray-400">Nível {participante?.user?.level} - Mente Curiosa</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {notificationPermission === "default" && (
            <button
              onClick={requestNotificationPermission}
              className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 px-3 py-1 rounded hover:bg-cyan-500/30 transition-colors"
            >
              Ativar Notificações
            </button>
          )}
          <CountdownTimer onTimerEnd={handleTimerEnd} />
          <button
            className="p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={startInstrumentFlow}
            disabled={!highlightedPing || !!instrumentFlow}
            aria-label="Responder próximo ping"
          >
            <BellIcon className="w-6 h-6 text-cyan-400" />
          </button>
          <button
            onClick={handleLogout}
            className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 px-3 py-1 rounded hover:bg-cyan-500/30 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3">
          <Card>
            <div className="p-2 text-center">
              <h2 className="text-lg font-semibold text-cyan-400 mb-4">
                "Psylogos, uma inteligência buscando compreender o coração da
                Humanidade."
              </h2>
              <div className="w-64 h-64 mx-auto cursor-grab active:cursor-grabbing">
                <PlexusFace />
              </div>
            </div>
          </Card>
        </div>

        <Card className="md:col-span-2">
          <h3 className="card-title">XP / LVL</h3>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div
              className="bg-cyan-400 h-4 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-sm text-cyan-300">
            <span>Nível {level}</span>
            <span>
              {totalXp} / {nextLevelXpTarget} XP
            </span>
            <span>Nível {level + 1}</span>
          </div>
          <p className="text-center text-gray-400 text-xs mt-2">
            XP total acumulado / XP para próximo nível
          </p>
        </Card>

        <Card className="md:col-span-1">
          <h3 className="card-title">Badges</h3>
          <div className="flex justify-around items-center">
            <EmotionExplorerBadge className="w-16 h-16" unlocked={true} />
            <EmotionExplorerBadge className="w-16 h-16" />
            <EmotionExplorerBadge className="w-16 h-16" />
          </div>
        </Card>

        <div className="md:col-span-3">
          <Card>
            <h3 className="card-title text-center mb-4">Resumo da Semana</h3>
            <div className="flex justify-around items-start text-center">
              <div className="flex flex-col items-center space-y-2">
                <CheckCircleIcon className="w-10 h-10 text-green-400" />
                <h4 className="text-sm font-semibold text-gray-300">
                  Pings Respondidos
                </h4>
                <p className="text-2xl font-bold text-green-400">
                  {completedPings}
                  <span className="text-sm font-normal text-gray-500">/42</span>
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <XCircleIcon className="w-10 h-10 text-red-500" />
                <h4 className="text-sm font-semibold text-gray-300">
                  Pings Perdidos
                </h4>
                <p className="text-2xl font-bold text-red-500">
                  {missedPings}
                  <span className="text-sm font-normal text-gray-500">/13</span>
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <StarIcon className="w-10 h-10 text-yellow-400" />
                <h4 className="text-sm font-semibold text-gray-300">
                  Dias Completos
                </h4>
                <p className="text-2xl font-bold text-yellow-400">
                  {completedStars}
                  <span className="text-sm font-normal text-gray-500">/5</span>
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="md:col-span-1">
          <h3 className="card-title">Leaderboard</h3>
          <div className="flex justify-center items-end gap-2 mb-6">
            {topThree[1] && (
              <PodiumItem
                player={topThree[1]}
                rank={2}
                isCurrentUser={topThree[1].nickname === participante?.user?.nickname}
              />
            )}
            {topThree[0] && (
              <PodiumItem
                player={topThree[0]}
                rank={1}
                isCurrentUser={topThree[0].nickname === participante?.user?.nickname}
              />
            )}
            {topThree[2] && (
              <PodiumItem
                player={topThree[2]}
                rank={3}
                isCurrentUser={topThree[2].nickname === participante?.user?.nickname}
              />
            )}
          </div>
          <ul className="space-y-2">
            {restOfPlayers.map((player, index) => {
              const isCurrentUser = player.nickname === participante?.user?.nickname;
              const rank = index + 4;
              const userHighlight = isCurrentUser
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold"
                : "border-transparent";

              return (
                <li
                  key={`${player.nickname}-${index}`}
                  className={`flex items-center justify-between p-2 rounded-md border-l-4 transition-all ${userHighlight}`}
                >
                  <span className="flex items-center">
                    <span className="w-6 text-center text-gray-400 mr-2">
                      {rank}
                    </span>
                    {player.nickname}
                  </span>
                  <span className="font-mono">{player.points}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="md:col-span-2">
          <h3 className="card-title">Pings (Notificações)</h3>
          <div className="grid grid-cols-7 gap-y-3 items-center text-center">
            {notificationTimes.map((time) => (
              <div
                key={time}
                className="font-semibold text-sm text-cyan-300/80"
              >
                {time}
              </div>
            ))}
            {pings && pings.map((day, dayIndex) => (
              <React.Fragment key={dayIndex}>
                {day.statuses.map((status, pingIndex) => {
                  const isLastColumn =
                    pingIndex === notificationTimes.length - 1;
                  const isHighlighted =
                    highlightedPing?.day === dayIndex &&
                    highlightedPing?.ping === pingIndex;

                  return (
                    <div
                      key={`${dayIndex}-${pingIndex}`}
                      className={`h-6 flex items-center justify-center relative`}
                    >
                      {isHighlighted && (
                        <div className="absolute inset-0 rounded-full bg-cyan-400/50 animate-ping-glow"></div>
                      )}
                      <div className="relative z-10">
                        {isLastColumn ? (
                          status === "completed" ? (
                            <StarIcon
                              className={`w-5 h-5 text-yellow-400 ${pingIconClasses}`}
                            />
                          ) : status === "missed" ? (
                            <div
                              className={`w-3 h-1 bg-gray-500 rounded-full ${pingIconClasses}`}
                            ></div>
                          ) : (
                            <StarIcon
                              className={`w-5 h-5 text-gray-700 ${pingIconClasses}`}
                            />
                          )
                        ) : status === "completed" ? (
                          <div
                            className={`w-4 h-4 rounded-full bg-green-400 ${pingIconClasses}`}
                          ></div>
                        ) : status === "missed" ? (
                          <div
                            className={`w-4 h-4 rounded-full bg-red-500 ${pingIconClasses}`}
                          ></div>
                        ) : (
                          <div
                            className={`w-4 h-4 rounded-full bg-gray-700 ${pingIconClasses}`}
                          ></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Progresso de 7 dias. Verde: Respondido, Vermelho: Perdido, Cinza:
            Pendente.
          </p>
        </Card>
      </main>
      {/* Fix: Removed non-standard 'jsx' and 'global' props from the style tag. Standard React does not support styled-jsx syntax without special configuration. A regular <style> tag will achieve the desired global styling. */}
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
        textarea.form-input {
            min-height: 80px;
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slow-spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-fade-in-down { animation: fade-in-down 0.5s ease-out; }
        .animate-slow-spin-slow { animation: slow-spin-slow 20s linear infinite; }
      `}</style>
    </div>
  );
};