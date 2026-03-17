import { GameState } from '@/src/components/data/GameState';
import { SociodemographicData } from '@/src/components/screen/SociodemographicQuestionnaireScreen';
import { OnboardingScreen } from '@/src/components/screen/OnboardingScreen';
import { useAuth } from '@/src/contexts/AuthContext';
import { OnboardingDraft, useOnboardingDraft } from '@/src/hooks/useOnboardingDraft';
import userService from '@/src/service/user/UserService';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';

const INITIAL_GAME_STATE: GameState = {
    user: {
        email: "",
        nickname: undefined,
        points: 0,
        level: 1,
        responseRate: 0,
        currentStreak: 0,
        completedDays: 0,
        avatar: null,
    },

    hasOnboarded: false,
    studyStartDate: new Date().toISOString(),
    responses: [],
    pings: Array(7).fill(0).map(() => ({ statuses: Array(7).fill("pending") })),
    sociodemographicData: null,
    firebaseId: "",
};

export const OnboardingPage: React.FC = () => {
    const { user, signInAnonymously } = useAuth();
    const navigate = useNavigate();
    const { loadDraft, saveDraft, clearDraft } = useOnboardingDraft();

    const [draft, setDraft] = useState<OnboardingDraft | null>(null);

    // Carrega rascunho salvo ao montar (se houver usuário autenticado)
    useEffect(() => {
        if (user) {
            const saved = loadDraft(user.uid);
            setDraft(saved);
        }
    }, [user]);

    // Redireciona se o onboarding já foi concluído
    useEffect(() => {
        async function checkIfAlreadyOnboarded() {
            if (!user) return;
            try {
                const existingUser = await userService.getParticipantById(user.uid);
                if (existingUser?.hasOnboarded) {
                    navigate("/dashboard");
                }
            } catch (error) {
                console.error("Erro ao verificar onboarding:", error);
            }
        }
        checkIfAlreadyOnboarded();
    }, [user, navigate]);

    const handleDraftChange = (patch: Omit<OnboardingDraft, "uid" | "savedAt">) => {
        if (!user) return;
        setDraft((prev) => ({
            ...(prev ?? { uid: user.uid, savedAt: new Date().toISOString() }),
            ...patch,
            uid: user.uid,
            savedAt: new Date().toISOString(),
        }));
        saveDraft(user.uid, patch);
    };

    const handleDraftClear = () => {
        if (!user) return;
        clearDraft(user.uid);
        setDraft(null);
    };

    const handleOnboardingComplete = async (nickname: string, data: SociodemographicData) => {
        try {
            let currentUser = user;

            if (!currentUser) {
                await signInAnonymously();
                currentUser = auth.currentUser;
            }

            if (!currentUser) throw new Error("Falha na autenticação do Firebase.");

            const userEmail = currentUser.email || "";
            const userAvatar = currentUser.photoURL || null;

            const gameState: GameState = {
                ...INITIAL_GAME_STATE,
                firebaseId: currentUser.uid,
                hasOnboarded: true,
                sociodemographicData: data,
                user: {
                    ...INITIAL_GAME_STATE.user,
                    email: userEmail,
                    avatar: userAvatar,
                    nickname: nickname,
                }
            };

            await userService.createUser(gameState);
            localStorage.setItem("gameState", JSON.stringify(gameState));

            // Limpa o rascunho após conclusão bem-sucedida
            handleDraftClear();

            alert("Perfil criado com sucesso! Bem-vindo ao Enigma de Psylogos.");
            navigate("/dashboard");

        } catch (error) {
            console.error("Erro no processo de onboarding:", error);
            alert("Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.");
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
            <OnboardingScreen
                onComplete={handleOnboardingComplete}
                draft={draft}
                onDraftChange={handleDraftChange}
                onDraftClear={handleDraftClear}
            />
        </div>
    );
};
