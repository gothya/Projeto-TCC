import { BrowserRouter, Route, Routes } from 'react-router-dom';
import NotFound from '../pages/404Page';
import { DashboardPage } from '../pages/DashboardPage';
import { LandingPage } from '../pages/LandingPage';
import { OnboardingPage } from '../pages/OnboardingPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<DashboardPage gameState={JSON.parse(localStorage.getItem('gameState') || '{}')} />} />

        {/* Rota 404 - Para caminhos inexistentes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}