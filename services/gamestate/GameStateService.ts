// services/gamestate/GameStateService.ts

import { GameState } from "@/components/data/GameState";

export const GameStateService = {
  async getGameState(id: number): Promise<GameState> {
    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/gamestate/${id}`
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar dados da API");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async saveGameState(gameState: GameState): Promise<GameState> {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/gamestate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameState),
      });

      if (response.status !== 201) {
        throw new Error("Erro ao buscar dados da API");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};
