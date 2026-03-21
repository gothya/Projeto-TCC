/**
 * ReportTestScenarios.ts
 *
 * Fábrica de GameState mock para validar o relatório em diferentes perfis de participante.
 * Usar apenas em modo desenvolvimento (testMode prop no ParticipantReportModal).
 */

import { GameState } from "@/src/components/data/GameState";
import { NEGATIVE_ITEMS, POSITIVE_ITEMS } from "@/src/constants/panas";

export type ScenarioProfile = "high" | "medium" | "low" | "mixed" | "minimal";

export const SCENARIO_LABELS: Record<ScenarioProfile, string> = {
  high:    "Alto Bem-Estar",
  medium:  "Bem-Estar Médio",
  low:     "Baixo Bem-Estar ⚠️",
  mixed:   "Afeto Misto",
  minimal: "Dados Mínimos",
};

export const SCENARIO_DESCRIPTIONS: Record<ScenarioProfile, string> = {
  high:    "SAM alto · PANAS PA alto / NA baixo · Tela abaixo da média global",
  medium:  "SAM neutro · PANAS equilibrado · Tela dentro da média BR",
  low:     "SAM baixo · PANAS PA baixo / NA elevado · Tela acima da média BR",
  mixed:   "SAM valência alta · PANAS PA alto + NA elevado simultaneamente",
  minimal: "Apenas 21 pings · 1 avaliação SAM · Sem PANAS · Sem tela",
};

/** Constrói um objeto panas com valor uniforme para todos os itens */
function buildPanas(paValue: number, naValue: number): Record<string, number> {
  const panas: Record<string, number> = {};
  POSITIVE_ITEMS.forEach((item) => { panas[item] = paValue; });
  NEGATIVE_ITEMS.forEach((item) => { panas[item] = naValue; });
  return panas;
}

/** Constrói N respostas regulares com os dados informados */
function buildResponses(
  count: number,
  sam: { pleasure: number; arousal: number; dominance: number },
  panas: Record<string, number> | null,
  screenTimeLog: { platform: string; hours: string; minutes: string }[] | null
) {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 3 * 60 * 60 * 1000).toISOString(),
    pingDay: Math.floor(i / 6) + 1,
    pingIndex: i % 6,
    type: "regular" as const,
    isValid: true,
    sam,
    panas: panas ?? undefined,
    screenTimeLog: screenTimeLog ?? undefined,
  }));
}

/** Constrói 7 dias de pings com N completos por dia */
function buildPings(completedPerDay: number): { statuses: string[] }[] {
  return Array.from({ length: 7 }, () => ({
    statuses: [
      ...Array(completedPerDay).fill("completed"),
      ...Array(7 - completedPerDay).fill("missed"),
    ],
  }));
}

const BASE_USER = {
  nickname: "Participante Teste",
  level: 5,
  points: 420,
  badges: [],
};

const SCENARIOS: Record<ScenarioProfile, GameState> = {
  // ─── Alto bem-estar ──────────────────────────────────────────────────────
  high: {
    user: BASE_USER,
    hasOnboarded: true,
    studyStartDate: "2026-03-14",
    sociodemographicData: null,
    pings: buildPings(6),  // 42 pings completos
    responses: [
      // 6 respostas regulares com SAM alto e PANAS positivo
      ...buildResponses(
        6,
        { pleasure: 8, arousal: 8, dominance: 8 },
        buildPanas(4, 1),  // PA = 4×10 = 40 | NA = 1×10 = 10
        null
      ),
      // 3 respostas de fim de dia com tempo de tela baixo
      ...Array.from({ length: 3 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        pingDay: i + 1,
        pingIndex: 6,
        type: "end_of_day" as const,
        isValid: true,
        screenTimeLog: [
          { platform: "TikTok",    hours: "0", minutes: "45" },
          { platform: "Reels",     hours: "0", minutes: "40" },
        ],
      })),
    ],
  },

  // ─── Bem-estar médio ─────────────────────────────────────────────────────
  medium: {
    user: BASE_USER,
    hasOnboarded: true,
    studyStartDate: "2026-03-14",
    sociodemographicData: null,
    pings: buildPings(4),  // 28 pings
    responses: [
      ...buildResponses(
        5,
        { pleasure: 5, arousal: 5, dominance: 5 },
        buildPanas(3, 2),  // PA = 30 | NA = 20
        null
      ),
      ...Array.from({ length: 4 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        pingDay: i + 1,
        pingIndex: 6,
        type: "end_of_day" as const,
        isValid: true,
        screenTimeLog: [
          { platform: "TikTok",    hours: "1", minutes: "30" },
          { platform: "Reels",     hours: "0", minutes: "50" },
        ],
      })),
    ],
  },

  // ─── Baixo bem-estar ⚠️ ───────────────────────────────────────────────────
  low: {
    user: BASE_USER,
    hasOnboarded: true,
    studyStartDate: "2026-03-14",
    sociodemographicData: null,
    pings: buildPings(3),  // 21 pings — exatamente no threshold
    responses: [
      ...buildResponses(
        5,
        { pleasure: 2, arousal: 3, dominance: 2 },
        buildPanas(1, 4),  // PA = 10 | NA = 40
        null
      ),
      ...Array.from({ length: 3 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        pingDay: i + 1,
        pingIndex: 6,
        type: "end_of_day" as const,
        isValid: true,
        screenTimeLog: [
          { platform: "TikTok",    hours: "2", minutes: "30" },
          { platform: "Reels",     hours: "1", minutes: "15" },
          { platform: "Shorts",    hours: "0", minutes: "45" },
        ],
      })),
    ],
  },

  // ─── Afeto misto (PA alto + NA elevado) ──────────────────────────────────
  mixed: {
    user: BASE_USER,
    hasOnboarded: true,
    studyStartDate: "2026-03-14",
    sociodemographicData: null,
    pings: buildPings(5),  // 35 pings
    responses: [
      ...buildResponses(
        6,
        { pleasure: 7, arousal: 7, dominance: 4 },
        buildPanas(4, 3),  // PA = 40 | NA = 30
        null
      ),
      ...Array.from({ length: 4 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        pingDay: i + 1,
        pingIndex: 6,
        type: "end_of_day" as const,
        isValid: true,
        screenTimeLog: [
          { platform: "TikTok",    hours: "1", minutes: "40" },
          { platform: "Reels",     hours: "0", minutes: "55" },
        ],
      })),
    ],
  },

  // ─── Dados mínimos ────────────────────────────────────────────────────────
  minimal: {
    user: BASE_USER,
    hasOnboarded: true,
    studyStartDate: "2026-03-14",
    sociodemographicData: null,
    pings: buildPings(3),  // 21 pings — exatamente no threshold
    responses: [
      {
        timestamp: new Date().toISOString(),
        pingDay: 1,
        pingIndex: 0,
        type: "regular",
        isValid: true,
        sam: { pleasure: 5, arousal: 5, dominance: 5 },
      },
    ],
  },
};

export function buildMockGameState(profile: ScenarioProfile): GameState {
  return SCENARIOS[profile];
}
