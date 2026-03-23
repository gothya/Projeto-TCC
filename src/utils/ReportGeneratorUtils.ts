import { GameState } from "@/src/components/data/GameState";
import { NEGATIVE_ITEMS, PANAS_MIGRATION_MAP, POSITIVE_ITEMS } from "@/src/constants/panas";
import { parseDurationMinutes, resolvePlatformName } from "./screenTimeUtils";

/**
 * Normaliza um objeto de resposta PANAS substituindo chaves legadas pelas novas.
 * O dado original no Firestore não é alterado — a conversão ocorre apenas em memória.
 */
export function normalizePanasResponse(
  panas: Record<string, number>
): Record<string, number> {
  const normalized: Record<string, number> = {};
  for (const [key, value] of Object.entries(panas)) {
    const mappedKey = PANAS_MIGRATION_MAP[key] ?? key;
    // Se a chave migrada já existe (improvável, mas seguro), soma os valores
    normalized[mappedKey] = (normalized[mappedKey] ?? 0) + value;
  }
  return normalized;
}

export const SCREEN_TIME_GLOBAL_REF = 143;  // min/dia — média global (DataReportal 2024)
export const SCREEN_TIME_NATIONAL_REF = 229; // min/dia — média nacional BR (DataReportal 2024)

export type ReportStats = {
  pingStats: {
    issued: number;
    completed: number;
    missed: number;
    completionRate: number;
  };
  sam: {
    valence: number;
    arousal: number;
    dominance: number;
    count: number;
  } | null;
  panas: {
    pa: number;
    na: number;
    count: number;
  } | null;
  screenTime: {
    avgDailyMinutes: number;
    totalDays: number;
    platformBreakdown: Record<string, number>;
  } | null;
};

export const REPORT_UNLOCK_THRESHOLD = 21;

export function isEligibleForReport(pings: { statuses: string[] }[]): boolean {
  const completed = pings.flatMap((d) => d.statuses).filter((s) => s === "completed").length;
  return completed >= REPORT_UNLOCK_THRESHOLD;
}

export function calculateReportStats(gameState: GameState): ReportStats {
  const allStatuses = (gameState.pings || []).flatMap((d) => d.statuses);
  const issued = allStatuses.filter((s) => s !== "pending").length;
  const completed = allStatuses.filter((s) => s === "completed").length;
  const missed = allStatuses.filter((s) => s === "missed").length;
  const completionRate = issued > 0 ? Math.round((completed / issued) * 100) : 0;

  const samTotals = { valence: 0, arousal: 0, dominance: 0, count: 0 };

  // PANAS: rastreia PA e NA com contagens separadas para normalização correta
  const panasTotals = { pa: 0, na: 0, paCount: 0, naCount: 0 };

  let screenTimeTotalMinutes = 0;
  let screenTimeDays = 0;
  const platformBreakdown: Record<string, number> = {};

  const validResponses = (gameState.responses || []).filter(
    (r) => r.isValid !== false
  );

  validResponses.forEach((r) => {
    if (r.sam) {
      samTotals.valence += r.sam.pleasure;
      samTotals.arousal += r.sam.arousal;
      samTotals.dominance += r.sam.dominance;
      samTotals.count++;
    }

    if (r.panas) {
      const panas = normalizePanasResponse(r.panas);
      let paSum = 0;
      let naSum = 0;
      let paItemCount = 0;
      let naItemCount = 0;

      Object.entries(panas).forEach(([key, value]) => {
        if (POSITIVE_ITEMS.includes(key)) { paSum += Number(value); paItemCount++; }
        if (NEGATIVE_ITEMS.includes(key)) { naSum += Number(value); naItemCount++; }
      });

      // Normaliza cada resposta para a escala completa (10 itens × max 5 = 50)
      // independente de quantos itens o participante respondeu naquela sessão
      if (paItemCount > 0) {
        panasTotals.pa += (paSum / paItemCount) * POSITIVE_ITEMS.length;
        panasTotals.paCount++;
      }
      if (naItemCount > 0) {
        panasTotals.na += (naSum / naItemCount) * NEGATIVE_ITEMS.length;
        panasTotals.naCount++;
      }
    }

  });

  // Lê tempo de tela de dailyScreenTimeLogs (fonte principal — salvo pelo ScreenTimeModal)
  const dailyLogs = gameState.dailyScreenTimeLogs ?? [];
  dailyLogs.forEach((log) => {
    let dayTotal = 0;
    (log.entries ?? []).forEach((entry) => {
      const dur = parseDurationMinutes(entry);
      const plat = resolvePlatformName(entry);
      dayTotal += dur;
      platformBreakdown[plat] = (platformBreakdown[plat] || 0) + dur;
    });
    if (dayTotal > 0) {
      screenTimeTotalMinutes += dayTotal;
      screenTimeDays++;
    }
  });

  const hasAnyPanas = panasTotals.paCount > 0 || panasTotals.naCount > 0;

  return {
    pingStats: { issued, completed, missed, completionRate },
    sam:
      samTotals.count > 0
        ? {
            valence: samTotals.valence / samTotals.count,
            arousal: samTotals.arousal / samTotals.count,
            dominance: samTotals.dominance / samTotals.count,
            count: samTotals.count,
          }
        : null,
    panas: hasAnyPanas
      ? {
          pa: panasTotals.paCount > 0 ? panasTotals.pa / panasTotals.paCount : 0,
          na: panasTotals.naCount > 0 ? panasTotals.na / panasTotals.naCount : 0,
          count: Math.max(panasTotals.paCount, panasTotals.naCount),
        }
      : null,
    screenTime:
      screenTimeDays > 0
        ? {
            avgDailyMinutes: Math.round(screenTimeTotalMinutes / screenTimeDays),
            totalDays: screenTimeDays,
            platformBreakdown,
          }
        : null,
  };
}

export function generateTextFeedback(stats: ReportStats): string {
  const parts: string[] = [];

  if (stats.sam) {
    const { valence, arousal } = stats.sam;

    if (valence >= 6) {
      parts.push(
        "Ao longo da jornada, seu estado emocional predominante foi positivo, com avaliações frequentes de prazer e bem-estar."
      );
    } else if (valence >= 4) {
      parts.push(
        "Seu estado emocional ao longo da jornada variou entre momentos agradáveis e menos agradáveis, situando-se em uma faixa neutra a moderada."
      );
    } else {
      parts.push(
        "Suas avaliações emocionais indicaram predomínio de estados de baixo bem-estar durante a jornada."
      );
    }

    if (arousal >= 6) {
      parts.push(
        "Seu nível de ativação foi predominantemente alto, indicando um estado de alerta e engajamento frequente."
      );
    } else if (arousal >= 4) {
      parts.push(
        "Seu nível de ativação se manteve em uma faixa intermediária, alternando entre momentos de maior e menor estimulação."
      );
    } else {
      parts.push(
        "Seu nível de alerta foi predominantemente baixo — um padrão associado a estados de calma ou baixa estimulação."
      );
    }
  }

  if (stats.panas) {
    const { pa, na } = stats.panas;
    const paLevel = pa >= 35 ? "alto" : pa >= 22 ? "moderado" : "baixo";
    const naLevel = na >= 25 ? "elevado" : na >= 15 ? "moderado" : "baixo";

    const isNegativeProfile = paLevel === "baixo" && naLevel === "elevado";
    const isPositiveProfile = paLevel === "alto" && naLevel === "baixo";
    const isMixedProfile = paLevel === "alto" && naLevel === "elevado";

    const emotional = isPositiveProfile
      ? "um padrão de bem-estar emocional consistente"
      : isNegativeProfile
      ? "um padrão de afeto que merece atenção"
      : isMixedProfile
      ? "um equilíbrio emocional complexo, com alta presença tanto de afetos positivos quanto negativos"
      : "um equilíbrio emocional dentro da variação esperada para o cotidiano";

    parts.push(
      `Seu Afeto Positivo médio foi ${paLevel} e o Afeto Negativo foi ${naLevel}, refletindo ${emotional}.`
    );

    if (isNegativeProfile) {
      parts.push(
        "Caso você queira conversar sobre como se sentiu durante o estudo, entre em contato com a equipe de pesquisa pelo e-mail informado no Termo de Consentimento."
      );
    }
  }

  if (stats.screenTime) {
    const avg = stats.screenTime.avgDailyMinutes;
    if (avg <= SCREEN_TIME_GLOBAL_REF) {
      parts.push(
        `Seu tempo médio de uso de vídeos curtos foi de ${avg} min/dia — abaixo da média global registrada (${SCREEN_TIME_GLOBAL_REF} min/dia, DataReportal 2024).`
      );
    } else if (avg <= SCREEN_TIME_NATIONAL_REF) {
      parts.push(
        `Seu tempo médio de uso foi de ${avg} min/dia, acima da média global (${SCREEN_TIME_GLOBAL_REF} min/dia) e dentro da média nacional brasileira (${SCREEN_TIME_NATIONAL_REF} min/dia, DataReportal 2024).`
      );
    } else {
      parts.push(
        `Seu tempo médio de uso foi de ${avg} min/dia — acima tanto da média global (${SCREEN_TIME_GLOBAL_REF} min/dia) quanto da média nacional brasileira (${SCREEN_TIME_NATIONAL_REF} min/dia, DataReportal 2024).`
      );
    }
  }

  if (parts.length === 0) {
    return "Continue respondendo aos pings para enriquecer seu relatório pessoal com análises mais completas.";
  }

  return parts.join(" ");
}
