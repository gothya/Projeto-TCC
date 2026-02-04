import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // Force injection of Firebase variables
      'import.meta.env.VITE_API_KEY': JSON.stringify(process.env.VITE_API_KEY || env.VITE_API_KEY),
      'import.meta.env.VITE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_AUTH_DOMAIN || env.VITE_AUTH_DOMAIN),
      'import.meta.env.VITE_PROJECT_ID': JSON.stringify(process.env.VITE_PROJECT_ID || env.VITE_PROJECT_ID),
      'import.meta.env.VITE_STORAGE_BUCKET': JSON.stringify(process.env.VITE_STORAGE_BUCKET || env.VITE_STORAGE_BUCKET),
      'import.meta.env.VITE_MESSAGING_SENDER_ID': JSON.stringify(process.env.VITE_MESSAGING_SENDER_ID || env.VITE_MESSAGING_SENDER_ID),
      'import.meta.env.VITE_APP_ID': JSON.stringify(process.env.VITE_APP_ID || env.VITE_APP_ID),
      'import.meta.env.VITE_MEASUREMENT_ID': JSON.stringify(process.env.VITE_MEASUREMENT_ID || env.VITE_MEASUREMENT_ID),
      'import.meta.env.VITE_FIREBASE_VAPID_KEY': JSON.stringify(process.env.VITE_FIREBASE_VAPID_KEY || env.VITE_FIREBASE_VAPID_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
