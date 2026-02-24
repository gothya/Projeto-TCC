
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';

export const LoginPage: React.FC<{}> = ({ }) => {

    const navigate = useNavigate();

    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");

    const handleGoogleLogin = async () => {
        const auth = getAuth();
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            console.log("Logado via Google:", user.displayName);
            navigate("/dashboard");
        } catch (error) {
            console.error("Erro no login social:", error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in">
            <div className="w-full max-w-md p-8 space-y-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue">
                <h1 className="text-3xl font-bold text-cyan-400">ENIGMA DE PSYLOGOS</h1>
                <h2 className="text-2xl font-semibold text-white">
                    Bem-vindo
                </h2>
                <p className="text-gray-300">
                    Faça a autenticação com o seu e-mail para acessar.
                </p>

                <div className="flex flex-col items-center space-y-4 gap-4">
                    <GoogleLoginButton />
                </div>
            </div>
        </div>
    );
};