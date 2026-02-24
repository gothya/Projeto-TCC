import React, { useState, useEffect, useCallback, useRef } from "react";
import { GameState } from "../data/GameState";
import { InstrumentFlowState } from "../states/InstrumentFlowState";
import { InstrumentResponse } from "../data/InstrumentResponse";
import { NotificationService } from "../../services/NotificationService";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { InstrumentModal } from "../modal/InstrumentModal";
import { RcleModal } from "../modal/RcleModal";
import { SociodemographicModal } from "../modal/SociodemographicModal";
import { PerformanceModal } from "../modal/PerformanceModal";
import { ProfileMenu } from "../menu/ProfileMenu";
import { BottomNavigation, TabType } from "../navigation/BottomNavigation";
import { HomeScreen } from "./HomeScreen";
import { AchievementsScreen } from "./AchievementsScreen";
import { LeaderboardScreen } from "./LeaderboardScreen";

export const ParticipantMainScreen: React.FC<{
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    onLogout: () => void;
    authUser: any; // User from AuthContext
}> = ({ gameState, setGameState, onLogout, authUser }) => {
    const { user, pings } = gameState;
    const [currentTab, setCurrentTab] = useState<TabType>("home");

    const [highlightedPing, setHighlightedPing] = useState<{
        day: number;
        ping: number;
    } | null>(null);

    const [isRcleModalOpen, setIsRcleModalOpen] = useState(false);
    const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isSociodemographicModalOpen, setIsSociodemographicModalOpen] = useState(false);
    const [instrumentFlow, setInstrumentFlow] = useState<InstrumentFlowState>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    const requestNotificationPermission = async () => {
        const service = await NotificationService.init();
        const token = await service.requestPermission();

        if (token) {
            setNotificationPermission("granted");
            if (authUser) {
                await service.saveTokenToFirestore(authUser.uid, token);
            }
            alert("Notificações ativadas com sucesso!");
        } else {
            setNotificationPermission("denied");
            alert("Não foi possível ativar as notificações. Verifique as permissões do navegador.");
        }
    };

    useEffect(() => {
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

    const startInstrumentFlow = useCallback(() => {
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
                // Se vier notificação, força tab home para focar
                setCurrentTab("home");
                startInstrumentFlow();

                const url = new URL(window.location.href);
                if (url.searchParams.get('open_ping')) {
                    url.searchParams.delete('open_ping');
                    window.history.replaceState({}, '', url);
                }
            }
        };

        const params = new URLSearchParams(window.location.search);
        if (params.get('open_ping') === 'true') {
            setTimeout(handleOpenIntent, 1000);
        }

        const messageHandler = (event: MessageEvent) => {
            if (event.data?.action === 'open_ping') {
                handleOpenIntent();
            }
        };
        navigator.serviceWorker?.addEventListener('message', messageHandler);

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

    const handleInstrumentFlowFinish = (finalResponseData: InstrumentResponse) => {
        if (!instrumentFlow) return;
        const { day, ping } = instrumentFlow.ping;

        // Compute new state using current gameState prop
        const newPings = gameState.pings.map((dayObj) => ({
            ...dayObj,
            statuses: [...dayObj.statuses],
        }));
        newPings[day].statuses[ping] = "completed";

        let newStreak = gameState.user.currentStreak || 0;
        let newResponseRate = gameState.user.responseRate || 0;
        let newCompletedDays = gameState.user.completedDays || 0;

        const isEndOfDay = ping === 6;
        if (isEndOfDay) newCompletedDays += 1;
        newStreak += 1;

        const totalRespondedGlobally = newPings.flatMap(d => d.statuses).filter(s => s === "completed").length;
        const totalPossibleGlobally = 49;
        newResponseRate = Number((totalRespondedGlobally / totalPossibleGlobally).toFixed(2));

        const newXp = newPings.reduce((acc, dayObj) => {
            return acc + dayObj.statuses.reduce((dayAcc, status, pingIndex) => {
                if (status === "completed") {
                    return dayAcc + (pingIndex === 6 ? 100 : 50);
                }
                return dayAcc;
            }, 0);
        }, 0);

        const newLevel = calculateLevel(newXp);

        const newState = {
            ...gameState,
            pings: newPings,
            responses: [...gameState.responses, finalResponseData],
            user: {
                ...gameState.user,
                points: newXp,
                level: newLevel,
                currentStreak: newStreak,
                responseRate: newResponseRate,
                completedDays: newCompletedDays
            },
        };

        // 1. Update React state
        setGameState(newState);

        // 2. Immediately persist to Firestore (outside setState — state updaters must be pure)
        if (authUser) {
            console.log("Saving ping response to Firestore for user:", authUser.uid);
            const sanitized = JSON.parse(JSON.stringify(newState));
            const docRef = doc(db, "users", authUser.uid);
            setDoc(docRef, sanitized, { merge: true })
                .then(() => console.log("Ping response saved successfully."))
                .catch((err) => console.error("Error saving ping response to Firestore:", err));
        } else {
            console.error("Cannot save ping: authUser is null!");
        }

        setInstrumentFlow(null);
    };

    const handleMissedPing = useCallback(() => {
        if (!instrumentFlow) return;
        const { day, ping } = instrumentFlow.ping;

        setGameState((prev) => {
            const newPings = prev.pings.map((dayObj) => ({
                ...dayObj,
                statuses: [...dayObj.statuses],
            }));
            newPings[day].statuses[ping] = "missed";

            // Reset Streak on miss
            return {
                ...prev,
                pings: newPings,
                user: {
                    ...prev.user,
                    currentStreak: 0
                }
            };
        });
        setInstrumentFlow(null);
    }, [instrumentFlow, setGameState]);

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

    const handleInstrumentStep = (stepData: Partial<InstrumentResponse>) => {
        if (!instrumentFlow) return;

        const newData = { ...instrumentFlow.data, ...stepData };

        if (instrumentFlow.type === "regular") {
            if (instrumentFlow.step === "sam") {
                setInstrumentFlow({ ...instrumentFlow, step: "feed_context", data: newData });
            } else if (instrumentFlow.step === "feed_context") {
                setInstrumentFlow({ ...instrumentFlow, step: "panas_contextual", data: newData });
            } else if (instrumentFlow.step === "panas_contextual") {
                handleInstrumentFlowFinish(newData as InstrumentResponse);
            }
        } else {
            if (instrumentFlow.step === "panas_daily") {
                setInstrumentFlow({ ...instrumentFlow, step: "end_of_day_log", data: newData });
            } else if (instrumentFlow.step === "end_of_day_log") {
                handleInstrumentFlowFinish(newData as InstrumentResponse);
            }
        }
    };

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 256;
                    const MAX_HEIGHT = 256;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height = Math.round((height * MAX_WIDTH) / width);
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width = Math.round((width * MAX_HEIGHT) / height);
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
                        setGameState((prev) => ({
                            ...prev,
                            user: { ...prev.user, avatar: compressedDataUrl },
                        }));
                    }
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
        setIsProfileMenuOpen(false);
    };

    const handleRemoveAvatar = () => {
        setGameState((prev) => ({
            ...prev,
            user: { ...prev.user, avatar: null },
        }));
        setIsProfileMenuOpen(false);
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-brand-dark bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,128,128,0.3),rgba(255,255,255,0))] text-gray-200 font-sans pb-16">

            {/* Global Modals */}
            {instrumentFlow && (
                <InstrumentModal
                    flow={instrumentFlow}
                    onStep={handleInstrumentStep}
                    onCancel={handleMissedPing}
                />
            )}
            {isRcleModalOpen && <RcleModal onClose={() => setIsRcleModalOpen(false)} />}
            {isSociodemographicModalOpen && gameState.sociodemographicData && (
                <SociodemographicModal
                    onClose={() => setIsSociodemographicModalOpen(false)}
                    data={gameState.sociodemographicData}
                />
            )}
            {isPerformanceModalOpen && (
                <PerformanceModal
                    onClose={() => setIsPerformanceModalOpen(false)}
                    gameState={gameState}
                />
            )}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/png, image/jpeg"
                className="hidden"
            />

            {/* Global Profile Menu Overlay (If triggered from HomeScreen Avatar) */}
            {isProfileMenuOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsProfileMenuOpen(false)}>
                    <div className="relative z-[101]" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-900 border border-cyan-500/50 p-2 rounded-xl shadow-2xl relative w-64 max-w-full">
                            <button onClick={() => setIsProfileMenuOpen(false)} className="absolute top-2 right-2 text-gray-400 hover:text-white pb-2 pl-2">✕</button>
                            <ProfileMenu
                                onUpload={() => fileInputRef.current?.click()}
                                onRemove={handleRemoveAvatar}
                                onViewRcle={() => { setIsRcleModalOpen(true); setIsProfileMenuOpen(false); }}
                                onViewPerformance={() => { setIsPerformanceModalOpen(true); setIsProfileMenuOpen(false); }}
                                onViewData={() => { setIsSociodemographicModalOpen(true); setIsProfileMenuOpen(false); }}
                                onLogout={onLogout}
                                hasAvatar={!!user.avatar}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="h-full px-4 pt-4 sm:px-6 md:px-12 lg:px-24">
                {currentTab === "home" && (
                    <HomeScreen
                        gameState={gameState}
                        highlightedPing={highlightedPing}
                        instrumentFlow={instrumentFlow}
                        startInstrumentFlow={startInstrumentFlow}
                        onAvatarClick={() => setIsProfileMenuOpen(true)}
                        notificationPermission={notificationPermission}
                        requestNotificationPermission={requestNotificationPermission}
                        LEVEL_THRESHOLDS={LEVEL_THRESHOLDS}
                    />
                )}
                {currentTab === "achievements" && (
                    <AchievementsScreen gameState={gameState} />
                )}
                {currentTab === "leaderboard" && (
                    <LeaderboardScreen user={gameState.user} />
                )}
            </main>

            {/* Bottom Navigation */}
            <BottomNavigation currentTab={currentTab} onChangeTab={setCurrentTab} />

            {/* Global Styles */}
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
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-in-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slow-spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-fade-in-down { animation: fade-in-down 0.5s ease-out; }
        .animate-slow-spin-slow { animation: slow-spin-slow 20s linear infinite; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
        </div>
    );
};
