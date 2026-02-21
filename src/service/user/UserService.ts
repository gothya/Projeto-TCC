import { GameState } from "@/src/components/data/GameState";
import { db } from "@/src/services/firebase";
import { collection, doc, getDoc, getDocs, query, setDoc, where, updateDoc } from "firebase/firestore";

export default class UserService {

    /**
 * Busca todos os usuários da coleção 'users'
 * @returns Um array de GameState contendo todos os usuários
 */
    async getAllUsers(): Promise<GameState[]> {
        try {
            const usersRef = collection(db, "users");
            const querySnapshot = await getDocs(usersRef);

            // Mapeamos os documentos para o formato do seu GameState
            const users = querySnapshot.docs.map(doc => ({
                ...doc.data()
            } as GameState));

            console.log(`✅ Total de usuários encontrados: ${users.length}`);
            return users;
        } catch (error) {
            console.error("Erro ao listar usuários:", error);
            throw error;
        }
    }

    // Busca por ID (UID do Auth)
    async getUserByFirebaseId(firebaseId: string) {
        if (!firebaseId) throw new Error("Firebase ID is required.");
        const docRef = doc(db, "users", firebaseId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data() as GameState) : undefined;
    }

    // Busca por Nickname (para checar se já existe)
    async getUserByNickname(nickname: string) {
        console.log("🔍 Buscando nickname:", nickname);
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("user.nickname", "==", nickname.trim()));
        const querySnapshot = await getDocs(q);

        return querySnapshot.empty ? undefined : (querySnapshot.docs[0].data() as GameState);
    }

    // Busca por Nicknamee senha
    async getUserByNicknameAndPassword(nickname: string, password: string) {
        console.log("🔍 Buscando nickname:", nickname, "e senha:", password);
        const usersRef = collection(db, "users");
        const q = query(
            usersRef, 
            where("user.nickname", "==", nickname.trim()),
            where("user.password", "==", password.trim()));
        const querySnapshot = await getDocs(q);

        return querySnapshot.empty ? undefined : (querySnapshot.docs[0].data() as GameState);
    }

    // Cria o documento usando o UID que o Auth gerou
    async createUser(initialState: GameState) {
        if (!initialState.firebaseId) {
            throw new Error("Firebase ID is required. Autentique o usuário primeiro.");
        }
        const docRef = doc(db, "users", initialState.firebaseId);
        await setDoc(docRef, initialState);
        console.log("✅ Usuário criado no Firestore!");
    }

    // Atualiza o documento usando o UID que o Auth gerou
    async updateUser(newState: GameState) {
        if (!newState.firebaseId) {
            throw new Error("Firebase ID is required. Autentique o usuário primeiro.");
        }
        const docRef = doc(db, "users", newState.firebaseId);
        await updateDoc(docRef, newState);
        console.log("✅ Usuário atualizado no Firestore!");
    }
}