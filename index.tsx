import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/src/App';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { initInstallPromptCapture } from '@/src/utils/installPrompt';

// Capturar beforeinstallprompt antes de qualquer renderização
initInstallPromptCapture();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);