import { NEGATIVE_ITEMS, POSITIVE_ITEMS } from "@/src/constants/panas";

// Lista ordenada alfabeticamente para exibição no formulário PANAS.
// Derivada das constantes — não editar aqui, editar em src/constants/panas.ts
export const PANAS_ITEMS = [...POSITIVE_ITEMS, ...NEGATIVE_ITEMS].sort((a, b) =>
  a.localeCompare(b, "pt-BR")
);
