
import React, { useState } from 'react';
import UserService from '../service/user/UserService';
import CryptoJS from 'crypto-js';
import { useNavigate } from "react-router-dom";

export const LoginPage: React.FC<{}> = ({ }) => {

    const navigate = useNavigate();

    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        const userService = new UserService();
        try {
            const cyptoPass = CryptoJS.SHA256(password.trim()).toString();
            const user = await userService.getUserByNicknameAndPassword(nickname, cyptoPass);
            if (!user) {
                alert("Usuário não encontrado ou senha incorreta.");
                return;
            }
            console.log("Usuário autenticado:", user);
            localStorage.setItem("gameState", JSON.stringify(user));
            console.log("Game state salvo no localStorage:", localStorage.getItem("gameState"));
            navigate("/dashboard");

        } catch (error) {
            console.error("Erro ao tentar fazer login:", error);
            alert("Ocorreu um erro ao tentar fazer login. Por favor, tente novamente mais tarde.");
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in">
            <div className="w-full max-w-md p-8 space-y-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue">
                <h1 className="text-3xl font-bold text-cyan-400">ENIGMA DE PSYLOGOS</h1>
                <h2 className="text-2xl font-semibold text-white">
                    Bem-vindo de volta
                </h2>
                <p className="text-gray-300">
                    Entre com o nickname e senha para acessar seu painel
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
                        placeholder="Digite sua senha"
                        className="w-full px-4 py-2 text-white bg-transparent border-2 rounded-md border-cyan-400 focus:outline-none focus:border-cyan-300 focus:shadow-glow-blue-sm transition-all"
                    />

                    <button
                        onClick={handleLogin}
                        disabled={nickname.trim().length <= 2 || password.trim().length < 6}
                        className="w-full px-6 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all duration-300 shadow-glow-blue disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        Entrar
                    </button>
                </div>
            </div>
        </div>
    );
};