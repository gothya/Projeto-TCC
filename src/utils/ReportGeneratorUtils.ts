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
        "Na maior parte do tempo, você se sentiu bem e vivenciou emoções agradáveis. Que ótimo saber disso!"
      );
    } else if (valence >= 4) {
      parts.push(
        "Você teve uma jornada equilibrada — com dias melhores e dias mais difíceis. Isso é completamente normal."
      );
    } else {
      parts.push(
        "Seus registros mostram que você atravessou dias desafiadores, com mais momentos difíceis do que agradáveis. Reconhecer isso já é um passo importante."
      );
    }

    if (arousal >= 6) {
      parts.push(
        "Você esteve com bastante energia na maior parte do tempo, sentindo-se ativo(a) ou estimulado(a)."
      );
    } else if (arousal >= 4) {
      parts.push(
        "Seu ritmo foi variado — houve dias mais agitados e dias mais tranquilos. Um equilíbrio saudável."
      );
    } else {
      // Cruzamento Circumplexo: Ativação Baixa + Valência Alta = Serenidade
      //                          Ativação Baixa + Valência Baixa = Esgotamento
      if (valence >= 5) {
        parts.push(
          "Seu ritmo esteve mais calmo e tranquilo na maior parte do tempo, o que pode indicar momentos de descanso e relaxamento."
        );
      } else {
        parts.push(
          "Seu nível de energia esteve mais baixo na maior parte do tempo, o que costuma indicar sensação de cansaço ou fadiga mental."
        );
      }
    }
  }

  if (stats.panas) {
    const { pa, na } = stats.panas;
    const paLevel = pa >= 35 ? "alto" : pa >= 22 ? "moderado" : "baixo";
    const naLevel = na >= 25 ? "elevado" : na >= 15 ? "moderado" : "baixo";

    const isNegativeProfile = paLevel === "baixo" && naLevel === "elevado";
    const isPositiveProfile = paLevel === "alto" && naLevel === "baixo";
    const isMixedProfile = paLevel === "alto" && naLevel === "elevado";

    if (isPositiveProfile) {
      parts.push(
        "Além disso, ao longo do estudo você relatou muito mais emoções positivas (como entusiasmo e alegria) do que negativas (como estresse). Isso é um excelente sinal!"
      );
    } else if (isNegativeProfile) {
      parts.push(
        "Somado a isso, você sentiu mais emoções desconfortáveis nestes últimos dias — como frustração ou tristeza. É normal ter semanas assim, e perceber isso já demonstra autoconhecimento."
      );
    } else if (isMixedProfile) {
      parts.push(
        "Somado a isso, você vivenciou uma jornada emocional intensa — com grandes momentos de alegria e energia, mas também períodos de estresse. Semanas assim costumam ser as mais marcantes."
      );
    } else {
      parts.push(
        "Quanto às suas emoções registradas, seus afetos positivos e negativos ficaram equilibrados — sem extremos. Esse é o padrão emocional mais comum no dia a dia."
      );
    }
  }

  if (stats.screenTime) {
    const avg = stats.screenTime.avgDailyMinutes;
    if (avg <= SCREEN_TIME_GLOBAL_REF) {
      parts.push(
        `Quanto ao uso de vídeos curtos, seu tempo médio foi de ${avg} min/dia — abaixo da média global (${SCREEN_TIME_GLOBAL_REF} min/dia, DataReportal 2024).`
      );
    } else if (avg <= SCREEN_TIME_NATIONAL_REF) {
      parts.push(
        `Quanto ao uso de vídeos curtos, seu tempo médio foi de ${avg} min/dia. Este consumo está acima da média global (${SCREEN_TIME_GLOBAL_REF} min/dia), dentro da média nacional brasileira (${SCREEN_TIME_NATIONAL_REF} min/dia, DataReportal 2024).`
      );
    } else {
      parts.push(
        `Quanto ao uso de vídeos curtos, seu tempo médio foi de ${avg} min/dia. Este consumo está acima da média global (${SCREEN_TIME_GLOBAL_REF} min/dia) e também da média nacional brasileira (${SCREEN_TIME_NATIONAL_REF} min/dia, DataReportal 2024).`
      );
    }
  }

  parts.push(
    "Se quiser compartilhar detalhes sobre a sua jornada, ou se sentir necessidade de conversar sobre qualquer aspecto que o estudo tenha despertado, a equipe está à disposição. Fale com Thiago (thiagosfcarneiro@sempreceub.com) ou com a Prof. Dionne (dionne.correa@ceub.edu.br)."
  );

  if (parts.length <= 1) {
    return "Continue respondendo aos pings para enriquecer seu relatório pessoal com análises mais completas.";
  }

  return parts.join(" ");
}
