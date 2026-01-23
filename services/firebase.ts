// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBeEkCMplmX5DCH7Xa_rffqGCOm3Mznrvc",
  authDomain: "psylogos---enigma-da-mente.firebaseapp.com",
  projectId: "psylogos---enigma-da-mente",
  storageBucket: "psylogos---enigma-da-mente.firebasestorage.app",
  messagingSenderId: "378736884536",
  appId: "1:378736884536:web:8fb880588de9b5df491fcd",
  measurementId: "G-GF6B4T3BHM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics (only supported in browser environments)
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);
