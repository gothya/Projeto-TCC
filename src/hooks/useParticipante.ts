import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getParticipanteByUid } from "../service/user/participanteService";
import { GameState } from "../components/data/GameState";

export function useParticipante() {
  const { user, loading: authLoading } = useAuth();

  const [participante, setParticipante] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    async function fetchData() {
      try {
        setLoading(true);
        const data = await getParticipanteByUid(user.uid);
        setParticipante(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, authLoading]);

  const updateParticipante = (newState: GameState) => {
    setParticipante(newState);
  };

  return {
    participante,
    loading: authLoading || loading,
    updateParticipante
  };
}