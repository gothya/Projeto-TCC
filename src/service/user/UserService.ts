import { GameState } from "@/src/components/data/GameState";
import { db, auth } from "@/src/services/firebase";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

class UserService {
    private readonly collectionName = "participantes";

    /**
     * Busca todos os participantes registrados
     */
    async getAllParticipants(): Promise<GameState[]> {
        try {
            const participantsRef = collection(db, this.collectionName);
            const querySnapshot = await getDocs(participantsRef);

            const participants = querySnapshot.docs.map(doc => ({
                ...doc.data()
            } as GameState));

            console.log(`✅ Total de participantes encontrados: ${participants.length}`);
            return participants;
        } catch (error) {
            console.error("Erro ao listar participantes:", error);
            throw error;
        }
    }

    /**
     * Busca um participante pelo seu UID do Firebase Auth
     */
    async getParticipantById(firebaseId: string): Promise<GameState | undefined> {
        if (!firebaseId) throw new Error("Firebase ID é obrigatório.");

        const docRef = doc(db, this.collectionName, firebaseId);
        const docSnap = await getDoc(docRef);

        return docSnap.exists() ? (docSnap.data() as GameState) : undefined;
    }

    /**
     * Cria ou substitui o documento do participante usando o UID como ID do documento.
     */
    async createUser(state: GameState): Promise<void> {
        if (!state.firebaseId) {
            throw new Error("Firebase ID é obrigatório. Autentique o usuário primeiro.");
        }

        const docRef = doc(db, this.collectionName, state.firebaseId);

        await setDoc(docRef, state);
        console.log("✅ Registro do participante criado em 'participantes'!");
    }

    /**
     * Atualiza dados específicos de um participante (Progresso, XP, etc)
     * Este é o método que o seu Dashboard está tentando chamar.
     */
    async updateUser(state: GameState): Promise<void> {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            throw new Error("Usuário não autenticado.");
        }

        const docRef = doc(db, this.collectionName, currentUser.uid);

        try {
            await updateDoc(docRef, {
                pings: state.pings,
                responses: state.responses,
                "user.points": state.user.points,
                "user.level": state.user.level,
            });

            console.log("✅ Dados do participante atualizados com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar participante no Firestore:", error);
            throw error;
        }
    }

    async getParticipanteByUid(uid: string) {
        const docRef = doc(db, "participantes", uid);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
            throw new Error("Participante não encontrado");
        }

        return snapshot.data();
    }
}

// Exportamos uma instância pronta para ser usada como 'userService.updateUser'
export default new UserService();