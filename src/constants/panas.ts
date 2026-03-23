export const POSITIVE_ITEMS: string[] = [
  "Animado", "Entusiasmado", "Inspirado", "Orgulhoso", "Determinado",
  "Forte", "Ativo", "Atento", "Alerta", "Interessado",
];

export const NEGATIVE_ITEMS: string[] = [
  "Aflito", "Angustiado", "Perturbado", "Incomodado", "Irritado",
  "Culpado", "Amedrontado", "Nervoso", "Inquieto", "Envergonhado",
];

/**
 * Mapa de migração: palavras legadas → palavras novas.
 * Usado para normalizar respostas históricas do Firestore
 * sem precisar modificar os dados brutos.
 * Garantia de rollback: o dado original permanece intacto no Firestore.
 */
export const PANAS_MIGRATION_MAP: Record<string, string> = {
  // Afetos Positivos substituídos
  "Dinâmico":   "Ativo",
  "Vigoroso":   "Atento",
  "Amável":     "Alerta",
  "Apaixonado": "Interessado",
  // Afetos Negativos substituídos
  "Rancoroso":  "Culpado",
  "Humilhado":  "Envergonhado",
};

export const NOTIFICATION_TIMES: string[] = [
  "9h", "11h", "13h", "15h", "17h", "19h", "21h",
];
