import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInAnonymously, signOut } from "firebase/auth";
import { auth } from "../services/firebase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInAnonymously: async () => { },
  logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // O onAuthStateChanged observa o Firebase e nos diz quem é o usuário atual
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSignInAnonymously = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Erro ao entrar anonimamente:", error);
    }
  };

  const handleLogout = async () => {
    try {
      // Limpa dados locais antes de deslogar
      localStorage.removeItem("gameState");
      await signOut(auth);
      // O onAuthStateChanged vai detectar o logout e atualizar o estado 'user' para null
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const value = {
    user,
    loading,
    signInAnonymously: handleSignInAnonymously,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Renderizamos os filhos sempre, mas o 'loading' 
          será usado pelos componentes ProtectedRoute/PublicRoute 
      */}
      {children}
    </AuthContext.Provider>
  );
};