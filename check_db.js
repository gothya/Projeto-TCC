import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCoFjCbWM-zirUaC85sHRmNSzy1H9uTCys",
    authDomain: "psylogos-enigma-da-mente.firebaseapp.com",
    projectId: "psylogos-enigma-da-mente",
    storageBucket: "psylogos-enigma-da-mente.firebasestorage.app",
    messagingSenderId: "573926171630",
    appId: "1:573926171630:web:cd74093e0c17004fd424ff",
    measurementId: "G-9PXN8D512L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkDb() {
    const querySnapshot = await getDocs(collection(db, "users"));
    console.log(`Found ${querySnapshot.size} total users.`);
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`User ID: ${doc.id}`);
        console.log(`Nickname: ${data.user?.nickname}`);
        console.log(`Level: ${data.user?.level}`);
        console.log(`Points: ${data.user?.points}`);
        console.log(`Responses count: ${data.responses?.length || 0}`);
        console.log(`---`);
    });
    process.exit(0);
}

checkDb();
