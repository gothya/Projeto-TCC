import { GameState } from '@/src/components/data/GameState';
import { OnboardingScreen } from '@/src/components/screen/OnboardingScreen';
import { useAuth } from '@/src/contexts/AuthContext';
import userService from '@/src/service/user/UserService';
import React, { useEffect } from 'react';
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

    const handleOnboardingComplete = async (nickname: string, data: any) => {
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
                    nickname: nickname, // Custom nickname chosen by user
                }
            };

            // 3. Persistência
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
            <OnboardingScreen onComplete={handleOnboardingComplete} />
        </div>
    );
};