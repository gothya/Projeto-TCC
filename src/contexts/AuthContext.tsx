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
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            console.log('currentUser', currentUser);
            if (!currentUser){
                console.log("User is not authenticated");
            }
            setUser(currentUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const handleSignInAnonymously = async () => {
        try {
            return await signInAnonymously(auth);
        } catch (error) {
            console.error("Error signing in anonymously:", error);
        }
    };

    const handleLogout = async () => {
        try {
            localStorage.removeItem("gameState");
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
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
            {!loading && children}
        </AuthContext.Provider>
    );
};
