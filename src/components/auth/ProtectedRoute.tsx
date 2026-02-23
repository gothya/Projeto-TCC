import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Enquanto o Firebase decide se o usuário está logado ou não
  if (loading) {
    return (
      <div style={{ color: "#fafafa", backgroundColor: "#131314", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        Carregando sessão...
      </div>
    );
  }

  // Se após carregar, não houver usuário, manda para o login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se houver usuário, renderiza o conteúdo protegido
  return <>{children}</>;
};