import { GameState } from "@/src/components/data/GameState";
import { NEGATIVE_ITEMS, POSITIVE_ITEMS } from "@/src/constants/panas";
import { parseDurationMinutes } from "./screenTimeUtils";

// ---------------------------------------------------------------------------
// Tipos de retorno
// ---------------------------------------------------------------------------

export type GlobalPingStats = {
  totalIssued: number;
  totalAnswered: number;
  rate: number;
};

export type SamAverages = {
  valence: string;
  arousal: string;
  dominance: string;
};

export type PanasAverages = {
  pa: string;
  na: string;
};

export type GlobalAverageStats = {
  samAvg: SamAverages;
  panasAvg: PanasAverages;
  sleepAvg: string;
  avgScreenTimeFormatted: string;
  avgScreenTimeRaw: number;
  platformAvg: Record<string, string>;
  avgLevel: string;
  maxLevel: number;
};

export type UserDetailStats = {
  samAverages: SamAverages | null;
  panasAverages: PanasAverages | null;
};

export type ParticipantSummary = {
  totalIssued: number;
  totalAnswered: number;
  screenTime: {
    totalFormatted: string;
    averageMinutes: number;
    breakdown: Record<string, number>;
  };
  sleep: {
    average: string;
    history: number[];
  };
  stressLogs: { date: string; text: string }[];
};

// ---------------------------------------------------------------------------
// Funções
// ---------------------------------------------------------------------------

export function calculateGlobalPingStats(allUsers: GameState[]): GlobalPingStats {
  let totalIssued = 0;
  let totalAnswered = 0;

  allUsers.forEach((user) => {
    (user.pings || []).forEach((day) => {
      if (day.statuses) {
        day.statuses.forEach((status) => {
          if (status !== "pending") {
            totalIssued++;
            if (status === "completed") totalAnswered++;
          }
        });
      }
    });
  });

  const rate = totalIssued === 0 ? 0 : Math.round((totalAnswered / totalIssued) * 100);
  return { totalIssued, totalAnswered, rate };
}

export function calculateGlobalAverageStats(allUsers: GameState[]): GlobalAverageStats {
  const samTotals = { valence: 0, arousal: 0, dominance: 0, count: 0 };
  const panasStats = { totalPA: 0, totalNA: 0, count: 0 };
  const screenTimeStats = { totalMinutes: 0, count: 0, platformBreakdown: {} as Record<string, number> };
  const sleepStats = { totalQuality: 0, count: 0 };

  let totalLevel = 0;
  let maxLevel = 0;

  allUsers.forEach((user) => {
    if (user.user) {
      totalLevel += user.user.level || 0;
      if ((user.user.level || 0) > maxLevel) maxLevel = user.user.level || 0;
    }

    (user.responses || [])
      .filter((r) => r.isValid !== false)
      .forEach((r) => {
        if (r.sam) {
          samTotals.valence += r.sam.pleasure;
          samTotals.arousal += r.sam.arousal;
          samTotals.dominance += r.sam.dominance;
          samTotals.count++;
        }

        if (r.panas) {
          let paSum = 0;
          let naSum = 0;
          let hasPanas = false;
          Object.entries(r.panas).forEach(([key, value]) => {
            if (POSITIVE_ITEMS.includes(key)) paSum += Number(value);
            if (NEGATIVE_ITEMS.includes(key)) naSum += Number(value);
            hasPanas = true;
          });
          if (hasPanas) {
            panasStats.totalPA += paSum;
            panasStats.totalNA += naSum;
            panasStats.count++;
          }
        }

        if (r.screenTimeLog) {
          let dailyMinutes = 0;
          r.screenTimeLog.forEach((entry) => {
            const dur = parseDurationMinutes(entry);
            dailyMinutes += dur;
            const plat = entry.platform || "Outros";
            screenTimeStats.platformBreakdown[plat] =
              (screenTimeStats.platformBreakdown[plat] || 0) + dur;
          });
          screenTimeStats.totalMinutes += dailyMinutes;
          screenTimeStats.count++;
        }

        if (r.sleepQuality && r.sleepQuality > 0) {
          sleepStats.totalQuality += r.sleepQuality;
          sleepStats.count++;
        }
      });

    // Correção B — ler dailyScreenTimeLogs (caminho pós-migração)
    (user.dailyScreenTimeLogs ?? []).forEach((log) => {
      let dailyMinutes = 0;
      log.entries.forEach((entry) => {
        const dur = parseDurationMinutes(entry);
        dailyMinutes += dur;
        const plat = entry.platform || "Outros";
        screenTimeStats.platformBreakdown[plat] =
          (screenTimeStats.platformBreakdown[plat] || 0) + dur;
      });
      if (dailyMinutes > 0) {
        screenTimeStats.totalMinutes += dailyMinutes;
        screenTimeStats.count++;
      }
    });
  });

  const samAvg: SamAverages =
    samTotals.count > 0
      ? {
          valence: (samTotals.valence / samTotals.count).toFixed(1),
          arousal: (samTotals.arousal / samTotals.count).toFixed(1),
          dominance: (samTotals.dominance / samTotals.count).toFixed(1),
        }
      : { valence: "0.0", arousal: "0.0", dominance: "0.0" };

  const panasAvg: PanasAverages =
    panasStats.count > 0
      ? {
          pa: (panasStats.totalPA / panasStats.count).toFixed(1),
          na: (panasStats.totalNA / panasStats.count).toFixed(1),
        }
      : { pa: "-", na: "-" };

  const sleepAvg =
    sleepStats.count > 0
      ? (sleepStats.totalQuality / sleepStats.count).toFixed(1)
      : "-";

  const avgScreenTime =
    screenTimeStats.count > 0
      ? Math.round(screenTimeStats.totalMinutes / screenTimeStats.count)
      : 0;

  const platformAvg: Record<string, string> = {};
  if (screenTimeStats.count > 0) {
    Object.entries(screenTimeStats.platformBreakdown).forEach(([plat, totalMins]) => {
      platformAvg[plat] = Math.round(totalMins / screenTimeStats.count).toString();
    });
  }

  return {
    samAvg,
    panasAvg,
    sleepAvg,
    avgScreenTimeFormatted: `${Math.floor(avgScreenTime / 60)}h ${avgScreenTime % 60}m`,
    avgScreenTimeRaw: avgScreenTime,
    platformAvg,
    avgLevel: allUsers.length > 0 ? (totalLevel / allUsers.length).toFixed(1) : "0",
    maxLevel,
  };
}

export function calculateDetailedStatsForUser(user: GameState): UserDetailStats | null {
  const validResponses = (user.responses || []).filter((r) => r.isValid !== false);
  if (validResponses.length === 0) return null;

  const samTotals = { valence: 0, arousal: 0, dominance: 0, count: 0 };
  const panasStats = { totalPA: 0, totalNA: 0, count: 0 };

  validResponses.forEach((r) => {
    if (r.sam) {
      samTotals.valence += r.sam.pleasure;
      samTotals.arousal += r.sam.arousal;
      samTotals.dominance += r.sam.dominance;
      samTotals.count++;
    }
    if (r.panas) {
      let paSum = 0;
      let naSum = 0;
      let hasPanas = false;
      Object.entries(r.panas).forEach(([key, value]) => {
        if (POSITIVE_ITEMS.includes(key)) paSum += Number(value);
        if (NEGATIVE_ITEMS.includes(key)) naSum += Number(value);
        hasPanas = true;
      });
      if (hasPanas) {
        panasStats.totalPA += paSum;
        panasStats.totalNA += naSum;
        panasStats.count++;
      }
    }
  });

  const samAverages: SamAverages | null =
    samTotals.count > 0
      ? {
          valence: (samTotals.valence / samTotals.count).toFixed(1),
          arousal: (samTotals.arousal / samTotals.count).toFixed(1),
          dominance: (samTotals.dominance / samTotals.count).toFixed(1),
        }
      : null;

  const panasAverages: PanasAverages | null =
    panasStats.count > 0
      ? {
          pa: (panasStats.totalPA / panasStats.count).toFixed(1),
          na: (panasStats.totalNA / panasStats.count).toFixed(1),
        }
      : null;

  return { samAverages, panasAverages };
}

export function calculateParticipantSummary(user: GameState): ParticipantSummary {
  let totalIssued = 0;
  const validResponses = (user.responses || []).filter((r) => r.isValid !== false);
  const totalAnswered = validResponses.length;

  (user.pings || []).forEach((d) => {
    if (d.statuses) {
      d.statuses.forEach((s) => {
        if (s === "completed" || s === "missed") totalIssued++;
      });
    }
  });

  let totalScreenTimeMinutes = 0;
  const platformBreakdown: Record<string, number> = {};
  let sleepSum = 0;
  let sleepCount = 0;
  const sleepHistory: number[] = [];
  const stressLogs: { date: string; text: string }[] = [];

  validResponses.forEach((r) => {
    if (r.screenTimeLog) {
      r.screenTimeLog.forEach((entry) => {
        const dur = parseDurationMinutes(entry);
        totalScreenTimeMinutes += dur;
        const plat = entry.platform || "Outros";
        platformBreakdown[plat] = (platformBreakdown[plat] || 0) + dur;
      });
    }

    if (r.sleepQuality && r.sleepQuality > 0) {
      sleepSum += r.sleepQuality;
      sleepCount++;
      sleepHistory.push(r.sleepQuality);
    }

    if (r.stressfulEvents && r.stressfulEvents.trim().length > 0) {
      stressLogs.push({
        date: new Date(r.timestamp).toLocaleDateString("pt-BR"),
        text: r.stressfulEvents,
      });
    }
  });

  // Correção C — ler dailyScreenTimeLogs (caminho pós-migração)
  (user.dailyScreenTimeLogs ?? []).forEach((log) => {
    log.entries.forEach((entry) => {
      const dur = parseDurationMinutes(entry);
      totalScreenTimeMinutes += dur;
      const plat = entry.platform || "Outros";
      platformBreakdown[plat] = (platformBreakdown[plat] || 0) + dur;
    });
  });

  const screenTimeDays =
    validResponses.filter((r) => r.screenTimeLog && r.screenTimeLog.length > 0).length +
    (user.dailyScreenTimeLogs ?? []).filter((l) => l.entries.length > 0).length;

  const avgScreenTime =
    screenTimeDays > 0 ? Math.round(totalScreenTimeMinutes / screenTimeDays) : 0;

  return {
    totalIssued,
    totalAnswered,
    screenTime: {
      totalFormatted: `${Math.floor(avgScreenTime / 60)}h ${avgScreenTime % 60}m`,
      averageMinutes: avgScreenTime,
      breakdown: platformBreakdown,
    },
    sleep: {
      average: sleepCount > 0 ? (sleepSum / sleepCount).toFixed(1) : "-",
      history: sleepHistory,
    },
    stressLogs,
  };
}
