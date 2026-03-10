import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // 1. Aguarda a verificação do Firebase
  if (loading) {
    return (
      <div style={{ color: "#fafafa", backgroundColor: "#131314", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        Carregando...
      </div>
    );
  }

  // 2. Se o usuário JÁ está logado, redireciona
  if (user) {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    if (user.email === adminEmail) {
      return <Navigate to="/role-selection" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Se não está logado, permite ver a página (ex: Login)
  return <>{children}</>;
};