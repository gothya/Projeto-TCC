import { GameState } from "@/src/components/data/GameState";
import { NEGATIVE_ITEMS, POSITIVE_ITEMS } from "@/src/constants/panas";
import { parseDurationMinutes, resolvePlatformName } from "./screenTimeUtils";

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
  const panasTotals = { pa: 0, na: 0, count: 0 };
  let screenTimeTotalMinutes = 0;
  let screenTimeDays = 0;
  const platformBreakdown: Record<string, number> = {};

  // Filtra apenas respostas válidas (isValid !== false)
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
      let pa = 0;
      let na = 0;
      let recognized = 0;
      Object.entries(r.panas).forEach(([key, value]) => {
        if (POSITIVE_ITEMS.includes(key)) { pa += Number(value); recognized++; }
        if (NEGATIVE_ITEMS.includes(key)) { na += Number(value); recognized++; }
      });
      // Só conta se pelo menos um item reconhecido foi encontrado
      if (recognized > 0) {
        panasTotals.pa += pa;
        panasTotals.na += na;
        panasTotals.count++;
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
    panas:
      panasTotals.count > 0
        ? {
            pa: panasTotals.pa / panasTotals.count,
            na: panasTotals.na / panasTotals.count,
            count: panasTotals.count,
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
        "Ao longo da jornada, seu estado emocional predominante foi positivo, com níveis elevados de prazer e bem-estar."
      );
    } else if (valence >= 4) {
      parts.push(
        "Seu estado emocional ao longo da jornada foi neutro a moderado, com variações entre momentos agradáveis e menos agradáveis."
      );
    } else {
      parts.push(
        "Sua avaliação emocional indicou momentos de baixo bem-estar, com predomínio de estados menos prazerosos durante a jornada."
      );
    }

    if (arousal >= 6) {
      parts.push(
        "Você demonstrou alto nível de ativação e alerta, típico de quem está engajado e energizado."
      );
    } else if (arousal < 4) {
      parts.push(
        "Seu nível de alerta foi mais calmo e relaxado — uma postura que pode ser sinal de tranquilidade ou baixa estimulação."
      );
    }
  }

  if (stats.panas) {
    const { pa, na } = stats.panas;
    const paLevel = pa >= 35 ? "alto" : pa >= 22 ? "moderado" : "baixo";
    const naLevel = na >= 25 ? "elevado" : na >= 15 ? "moderado" : "baixo";
    const emotional =
      paLevel === "alto" && naLevel === "baixo"
        ? "um bem-estar emocional saudável"
        : paLevel === "baixo" && naLevel === "elevado"
        ? "sinais de sofrimento emocional que merecem atenção"
        : "um equilíbrio emocional dentro do esperado para o cotidiano";
    parts.push(
      `Seu Afeto Positivo médio foi ${paLevel} e o Afeto Negativo foi ${naLevel}, uma combinação que reflete ${emotional}.`
    );
  }

  if (stats.screenTime) {
    const avg = stats.screenTime.avgDailyMinutes;
    if (avg <= SCREEN_TIME_GLOBAL_REF) {
      parts.push(
        `Seu tempo médio de uso de vídeos curtos foi de ${avg} min/dia, abaixo da média global (${SCREEN_TIME_GLOBAL_REF} min) — um padrão moderado de consumo.`
      );
    } else if (avg <= SCREEN_TIME_NATIONAL_REF) {
      parts.push(
        `Seu tempo médio de uso foi de ${avg} min/dia, acima da média global (${SCREEN_TIME_GLOBAL_REF} min), mas dentro do padrão nacional (${SCREEN_TIME_NATIONAL_REF} min).`
      );
    } else {
      parts.push(
        `Seu tempo médio de uso foi de ${avg} min/dia, acima da média nacional de ${SCREEN_TIME_NATIONAL_REF} min — um padrão de consumo intenso que pode influenciar seu bem-estar.`
      );
    }
  }

  if (parts.length === 0) {
    return "Continue respondendo aos pings para enriquecer seu relatório pessoal com análises mais completas.";
  }

  return parts.join(" ");
}
