import { GameState } from "@/src/components/data/GameState";
import { InstrumentResponse } from "@/src/components/data/InstrumentResponse";
import { db, auth } from "@/src/services/firebase";
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";

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

        const stateWithLower = {
            ...state,
            user: {
                ...state.user,
                nicknameLower: state.user.nickname?.trim().toLowerCase() ?? "",
            },
        };

        await setDoc(docRef, stateWithLower);
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
            const updateData: any = {
                pings: state.pings,
                responses: state.responses,
                "user.points": state.user.points,
                "user.level": state.user.level,
            };

            if (state.user?.nickname) updateData["user.nickname"] = state.user.nickname;
            if (state.user?.avatar || state.user?.avatar === null) updateData["user.avatar"] = state.user.avatar;
            if (state.sociodemographicData) updateData.sociodemographicData = state.sociodemographicData;

            await updateDoc(docRef, updateData);

            console.log("✅ Dados do participante atualizados com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar participante no Firestore:", error);
            throw error;
        }
    }

    /**
     * Atualiza APENAS o array de pings (statuses).
     * NÃO toca em responses — evita sobrescrever respostas com estado stale.
     * Usar exclusivamente no evaluateSchedule para marcar pings como "missed".
     */
    async updatePingsOnly(firebaseId: string, pings: GameState["pings"]): Promise<void> {
        const docRef = doc(db, this.collectionName, firebaseId);
        await updateDoc(docRef, { pings });
    }

    /**
     * Persiste os registros diários de tempo de tela e XP/nível atualizados.
     */
    async saveDailyScreenTimeLogs(state: GameState): Promise<void> {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Usuário não autenticado.");
        const docRef = doc(db, this.collectionName, currentUser.uid);
        await updateDoc(docRef, {
            dailyScreenTimeLogs: state.dailyScreenTimeLogs ?? [],
            "user.points": state.user.points,
            "user.level": state.user.level,
        });
    }

    /**
     * Persiste um array de respostas já montado (usado para salvar respostas parciais).
     */
    async saveResponses(firebaseId: string, responses: InstrumentResponse[]): Promise<void> {
        const docRef = doc(db, this.collectionName, firebaseId);
        await updateDoc(docRef, { responses });
    }

    /**
     * Verifica se um nickname já está em uso.
     * Roda duas queries em paralelo para cobrir documentos antigos
     * (sem nicknameLower) e novos (com nicknameLower):
     *   1. user.nicknameLower == toLowerCase(nickname)  — novos registros
     *   2. user.nickname      == nickname (exato)       — registros legados
     * Retorna true se qualquer uma encontrar resultado.
     */
    async isNicknameTaken(nickname: string): Promise<boolean> {
        const trimmed = nickname.trim();
        const col = collection(db, this.collectionName);

        const [byLower, byExact] = await Promise.all([
            getDocs(query(col, where("user.nicknameLower", "==", trimmed.toLowerCase()), limit(1))),
            getDocs(query(col, where("user.nickname", "==", trimmed), limit(1))),
        ]);

        return !byLower.empty || !byExact.empty;
    }

    /**
     * Salva a avaliação de reação do participante ao final da jornada.
     * 1. Cria/substitui doc em `reactionEvaluations/{firebaseId}` com os dados e timestamp.
     * 2. Marca `reactionEvaluationDone: true` no doc principal do participante.
     */
    async saveReactionEvaluation(
        firebaseId: string,
        data: {
            rating: number;
            liked: string;
            disliked: string;
            suggestion: string;
            freeComment: string;
        }
    ): Promise<void> {
        const evalRef = doc(db, "reactionEvaluations", firebaseId);
        const participanteRef = doc(db, this.collectionName, firebaseId);

        await Promise.all([
            setDoc(evalRef, { ...data, submittedAt: serverTimestamp() }),
            updateDoc(participanteRef, { reactionEvaluationDone: true }),
        ]);
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