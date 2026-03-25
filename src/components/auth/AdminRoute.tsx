import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [claimChecked, setClaimChecked] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setClaimChecked(true);
      return;
    }
    user.getIdTokenResult()
      .then(result => {
        setIsAdmin(result.claims.admin === true);
        setClaimChecked(true);
      })
      .catch(() => {
        setIsAdmin(false);
        setClaimChecked(true);
      });
  }, [user]);

  if (loading || !claimChecked) {
    return (
      <div style={{ color: "#fafafa", backgroundColor: "#131314", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        Carregando sessão...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
