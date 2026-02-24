// participanteService.ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/src/services/firebase";

export async function getParticipanteByUid(uid: string) {
  const docRef = doc(db, "participantes", uid);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error("Participante não encontrado");
  }

  return snapshot.data();
}