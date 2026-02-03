// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// Initialize Firebase
// DEBUG: Check if keys are loaded
const apiKey = import.meta.env.VITE_API_KEY;
if (!apiKey) {
  console.error("CRITICAL: Firebase API Key is MISSING in environment variables!");
} else {
  console.log("SUCCESS: Firebase API Key loaded (" + apiKey.substring(0, 5) + "...)");
}

console.log("FULL CONFIG DEBUG:", {
  apiKey: apiKey ? "PRESENT" : "MISSING",
  projectId: import.meta.env.VITE_PROJECT_ID,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN
});
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics (only supported in browser process.environments)
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);
