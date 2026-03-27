/**
 * Migração única: popula a coleção `leaderboard` com dados dos participantes existentes.
 * Execução: node scripts/migrate-leaderboard.cjs
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrate() {
    const snapshot = await db.collection("participantes").get();

    if (snapshot.empty) {
        console.log("Nenhum participante encontrado.");
        return;
    }

    const batch = db.batch();
    let count = 0;

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const nickname = data.user?.nickname?.trim() ?? "";
        if (!nickname) return;

        const leaderboardRef = db.collection("leaderboard").doc(docSnap.id);
        batch.set(leaderboardRef, {
            nickname,
            nicknameLower: nickname.toLowerCase(),
            points: data.user?.points ?? 0,
        }, { merge: true });

        console.log(`  → ${docSnap.id}: "${nickname}" (${data.user?.points ?? 0} pts)`);
        count++;
    });

    await batch.commit();
    console.log(`\n✅ Migração concluída: ${count} participantes espelhados no leaderboard.`);
}

migrate().catch((err) => {
    console.error("Erro na migração:", err);
    process.exit(1);
});
