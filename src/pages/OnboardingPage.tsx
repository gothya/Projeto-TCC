import { GameState } from '@/src/components/data/GameState';
import { ConsentScreen } from '@/src/components/screen/ConsentScreen';
import { useAuth } from '@/src/contexts/AuthContext';
import userService from '@/src/service/user/UserService';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SociodemographicQuestionnaireScreen } from '../components/screen/SociodemographicQuestionnaireScreen';
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
    badges: [
        { id: "punctual", name: "Pontualidade", description: "Responder 80% das notificações em 10 minutos", unlocked: false },
        { id: "week_streak", name: "Streak Semanal", description: "Completar todos os 7 dias", unlocked: false },
    ],
    hasOnboarded: false,
    studyStartDate: new Date().toISOString(),
    responses: [],
    pings: Array(7).fill(0).map(() => ({ statuses: Array(7).fill("pending") })),
    sociodemographicData: null,
    firebaseId: "",
};

export const OnboardingPage: React.FC = () => {
    // Como agora exportamos 'new UserService()', não precisamos de 'new' aqui
    const { user, signInAnonymously } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);

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

    const handleConsent = (agreed: boolean) => {
        if (agreed) {
            setStep(2);
        } else {
            alert("Para participar da pesquisa, você precisa concordar com os termos.");
        }
    };

    const handleQuestionnaireComplete = async (data: any) => {
        try {
            let currentUser = user;

            // 1. Garante que temos um usuário autenticado
            if (!currentUser) {
                await signInAnonymously();
                currentUser = auth.currentUser;
            }

            if (!currentUser) throw new Error("Falha na autenticação do Firebase.");

            // 2. Mapeia os dados para o GameState
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
                    nickname: userEmail ? userEmail.split('@')[0] : "Explorador Anônimo",
                }
            };

            // 3. Persistência: Usando o novo nome do método 'createUser'
            await userService.createUser(gameState);
            localStorage.setItem("gameState", JSON.stringify(gameState));

            alert("Perfil criado com sucesso! Bem-vindo ao Enigma de Psylogos.");
            navigate("/dashboard");

        } catch (error) {
            console.error("Erro no processo de onboarding:", error);
            alert("Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.");
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
            {step === 1 && <ConsentScreen onConsent={handleConsent} />}
            {step === 2 && (
                <SociodemographicQuestionnaireScreen
                    onComplete={handleQuestionnaireComplete}
                />
            )}
        </div>
    );
};