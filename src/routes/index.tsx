import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { DashboardPage } from '../pages/DashboardPage';
import NotFound from '../pages/404Page';
import { PublicRoute } from '../components/auth/PublicRoute';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/" element={<LandingPage />} />
      
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage gameState={JSON.parse(localStorage.getItem('gameState') || '{}')} />
          </ProtectedRoute>
        }
      />

      {/* Rota 404 - Para caminhos inexistentes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}