import React, { useState, useEffect } from 'react';
import { ConsentScreen } from '../components/screen/ConsentScreen';
import { SociodemographicQuestionnaireScreen } from '../components/screen/SociodemographicQuestionnaireScreen';
import UserService from '../service/user/UserService';
import { GameState } from '../components/data/GameState';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CryptoJS from 'crypto-js';

const INITIAL_GAME_STATE: GameState = {
  user: {
    nickname: undefined,
    points: 0,
    level: 1,
    responseRate: 0,
    currentStreak: 0,
    completedDays: 0,
    avatar: null,
    password: undefined,
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

type SociodemographicData = {
    age: number | string;
    gender: string;
    maritalStatus: string;
    education: string;
    occupation: string;
    continuousMedication: string;
    medicationDetails: string;
    healthDiagnosis: string;
    diagnosisDetails: string;
    monthlyIncome: string;
    platforms: string[];
    otherPlatform: string;
    usagePeriod: string;
    dailyUsage: string;
    purpose_talk: string;
    purpose_share: string;
    purpose_watch: string;
    purpose_search: string;
};

export const OnboardingPage: React.FC<{
    onComplete: (nickname: string, data: SociodemographicData) => void;
}> = ({  }) => {

    const userService = new UserService();
    const { signInAnonymously } = useAuth();

    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [sociodemographicData, setSociodemographicData] = useState<SociodemographicData | null>(null);

    useEffect(() => {
        const storedData = localStorage.getItem("gameState");
        if (storedData) {
            const parsedData: GameState = JSON.parse(storedData);
            if (parsedData.user.nickname) {
                navigate("/dashboard");
            }
        }
    }, [navigate]); 

    const handleConsent = (agreed: boolean) => {
        if (agreed) {
            setStep(3);
        } else {
            alert(
                "Para participar da pesquisa, você precisa concordar com os termos."
            );
        }
    };

    const handleQuestionnaireComplete = async (data: SociodemographicData) => {

        const userCredential = await signInAnonymously();
        const uid = userCredential.user.uid;

        const gameState: GameState = INITIAL_GAME_STATE;
        gameState.user.nickname = nickname.trim();
        gameState.user.password = CryptoJS.SHA256(password.trim()).toString();
        gameState.sociodemographicData = data;
        gameState.firebaseId = uid;

        userService.createUser(gameState).then(() => {
            alert("Perfil criado com sucesso! Bem-vindo ao Enigma de Psylogos.");
            gameState.user.password = undefined;
            localStorage.setItem("gameState", JSON.stringify(gameState));
            navigate("/dashboard")
        }).catch((error) => {
            console.error("Error creating user:", error);
            alert("Ocorreu um erro ao criar seu perfil. Por favor, tente novamente.");
        });
    };

    const handleNicknameSubmit = async () => {

        // Busca pelo nickname
        const existentUser = await userService.getUserByNickname(nickname.trim());
        
        // Se já existir um usuário com esse nickname, mostramos um alerta e não avançamos
        if (existentUser) {
            alert("Este nickname já está em uso. Por favor, escolha outro.");
            return;
        }

        // Avança para a próxima etapa se o nickname for válido e não estiver em uso
        setStep(2);
    };

    if (step === 1) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in">
                <div className="w-full max-w-md p-8 space-y-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue">
                    <h1 className="text-3xl font-bold text-cyan-400">ENIGMA DE PSYLOGOS</h1>
                    <h2 className="text-2xl font-semibold text-white">
                        Crie seu Pseudônimo
                    </h2>
                    <p className="text-gray-300">
                        Escolha um apelido único e uma senha que serão usados no ranking e para sua
                        identificação anônima.
                    </p>

                    <div className="flex flex-col items-center space-y-4 gap-4">
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Digite seu nickname"
                            className="w-full px-4 py-2 text-white bg-transparent border-2 rounded-md border-cyan-400 focus:outline-none focus:border-cyan-300 focus:shadow-glow-blue-sm transition-all"
                        />

                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite uma senha"
                            className="w-full px-4 py-2 text-white bg-transparent border-2 rounded-md border-cyan-400 focus:outline-none focus:border-cyan-300 focus:shadow-glow-blue-sm transition-all"
                        />

                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirme a senha"
                            className="w-full px-4 py-2 text-white bg-transparent border-2 rounded-md border-cyan-400 focus:border-cyan-300 focus:shadow-glow-blue-sm transition-all"
                        />

                        <button
                            onClick={handleNicknameSubmit}
                            disabled={nickname.trim().length <= 2 || password.trim().length < 6 || password !== confirmPassword}
                            className="w-full px-6 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all duration-300 shadow-glow-blue disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            Próximo
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 2) {
        return (
            <>
                <ConsentScreen onConsent={handleConsent} />
            </>
        );
    }

    if (step === 3) {
        return (
            <>
                <SociodemographicQuestionnaireScreen
                    onComplete={handleQuestionnaireComplete}
                />
            </>
        );
    }
};