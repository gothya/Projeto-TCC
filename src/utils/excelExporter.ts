import * as XLSX from "xlsx";
import { GameState } from "@/src/components/data/GameState";

// PANAS GROUPS
const POSITIVE_ITEMS = [
  "Amável", "Animado", "Apaixonado", "Determinado", "Dinâmico",
  "Entusiasmado", "Forte", "Inspirado", "Orgulhoso", "Vigoroso"
];
const NEGATIVE_ITEMS = [
  "Aflito", "Amedrontado", "Angustiado", "Humilhado", "Incomodado",
  "Inquieto", "Irritado", "Nervoso", "Perturbado", "Rancoroso"
];

const NOTIFICATION_TIMES = ["9h", "11h", "13h", "15h", "17h", "19h", "21h"];

type FlatResponse = {
  nickname: string;
  participantId: string;
  timestamp: string;
  pingDay: number;
  pingIndex: number;
  pingLabel: string;
  type: "regular" | "end_of_day";
  response: any;
};

/**
 * Flatten all user responses into a single array with participant info attached.
 */
function flattenResponses(allUsers: GameState[]): FlatResponse[] {
  const flat: FlatResponse[] = [];

  allUsers.forEach((user) => {
    const nickname = user.user?.nickname || "Desconhecido";
    const participantId = user.firebaseId || "N/A";

    (user.responses || []).forEach((r) => {
      const pingLabel = `Dia ${(r.pingDay ?? 0) + 1} (${NOTIFICATION_TIMES[r.pingIndex] || "?"})`;

      flat.push({
        nickname,
        participantId,
        timestamp: r.timestamp
          ? new Date(r.timestamp).toLocaleString("pt-BR")
          : "N/A",
        pingDay: (r.pingDay ?? 0) + 1,
        pingIndex: (r.pingIndex ?? 0) + 1,
        pingLabel,
        type: r.type,
        response: r,
      });
    });
  });

  return flat;
}

/**
 * Build the SAM sheet data.
 * Only regular pings contain SAM data.
 */
function buildSamSheet(allResponses: FlatResponse[]) {
  const rows: Record<string, any>[] = [];

  allResponses.forEach((entry) => {
    const r = entry.response;
    if (!r.sam) return;

    rows.push({
      Nickname: entry.nickname,
      Timestamp: entry.timestamp,
      "Dia do Estudo": entry.pingDay,
      "Ping (Slot)": entry.pingIndex,
      Horário: NOTIFICATION_TIMES[entry.pingIndex - 1] || "?",
      Tipo: entry.type === "regular" ? "Regular" : "Final do Dia",
      Valência: r.sam.pleasure,
      Ativação: r.sam.arousal,
      Dominância: r.sam.dominance,
    });
  });

  return rows;
}

/**
 * Build the PANAS sheet data.
 * Includes info about whether it's a midday (contextual) or end-of-day PANAS.
 */
function buildPanasSheet(allResponses: FlatResponse[]) {
  const rows: Record<string, any>[] = [];

  allResponses.forEach((entry) => {
    const r = entry.response;
    if (!r.panas) return;

    const panasType =
      entry.type === "end_of_day" ? "Final do Dia" : "Meio do Dia";

    const row: Record<string, any> = {
      Nickname: entry.nickname,
      Timestamp: entry.timestamp,
      "Dia do Estudo": entry.pingDay,
      "Ping (Slot)": entry.pingIndex,
      Horário: NOTIFICATION_TIMES[entry.pingIndex - 1] || "?",
      "Tipo PANAS": panasType,
    };

    // Positive affects
    POSITIVE_ITEMS.forEach((item) => {
      row[`POS_${item}`] = r.panas[item] ?? "";
    });

    // Negative affects
    NEGATIVE_ITEMS.forEach((item) => {
      row[`NEG_${item}`] = r.panas[item] ?? "";
    });

    rows.push(row);
  });

  return rows;
}

/**
 * Build the Screen Time sheet data.
 * Only end-of-day pings contain screen time logs.
 */
function buildScreenTimeSheet(
  allResponses: FlatResponse[],
  allUsers: GameState[]
) {
  // First pass: collect all unique platform names across all users
  const allPlatforms = new Set<string>();

  allUsers.forEach((user) => {
    (user.responses || []).forEach((r) => {
      if (r.screenTimeLog) {
        r.screenTimeLog.forEach((entry) => {
          const platform = entry.platform || "Outros";
          if (platform !== "Outro") {
            allPlatforms.add(platform);
          } else {
            // Use the detailed name if "Outro"
            allPlatforms.add(entry.otherPlatformDetail || "Outro");
          }
        });
      }
    });
  });

  const platformList = Array.from(allPlatforms).sort();

  // Second pass: build rows
  const rows: Record<string, any>[] = [];

  allResponses.forEach((entry) => {
    const r = entry.response;
    if (!r.screenTimeLog || r.screenTimeLog.length === 0) return;

    const row: Record<string, any> = {
      Nickname: entry.nickname,
      Timestamp: entry.timestamp,
      "Dia do Estudo": entry.pingDay,
      "Ping (Slot)": entry.pingIndex,
      Horário: NOTIFICATION_TIMES[entry.pingIndex - 1] || "?",
    };

    // Initialize all platforms to 0
    platformList.forEach((p) => {
      row[`${p} (min)`] = 0;
    });

    let totalMinutes = 0;

    r.screenTimeLog.forEach(
      (stEntry: {
        platform: string;
        otherPlatformDetail: string;
        hours: string;
        minutes: string;
        duration: string;
      }) => {
        let platformName = stEntry.platform || "Outros";
        if (platformName === "Outro") {
          platformName = stEntry.otherPlatformDetail || "Outro";
        }

        // Calculate duration from hours/minutes or fall back to duration
        let dur = 0;
        if (stEntry.hours || stEntry.minutes) {
          const h = parseInt(stEntry.hours || "0");
          const m = parseInt(stEntry.minutes || "0");
          dur = (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
        } else {
          dur = parseInt(stEntry.duration || "0");
          if (isNaN(dur)) dur = 0;
        }

        if (row[`${platformName} (min)`] !== undefined) {
          row[`${platformName} (min)`] += dur;
        } else {
          row[`${platformName} (min)`] = dur;
        }

        totalMinutes += dur;
      }
    );

    row["Total (min)"] = totalMinutes;

    rows.push(row);
  });

  return rows;
}

/**
 * Build the Co-variables sheet data.
 * Contains sleep quality and stressful events from end-of-day pings.
 */
function buildCovariablesSheet(allResponses: FlatResponse[]) {
  const rows: Record<string, any>[] = [];

  allResponses.forEach((entry) => {
    const r = entry.response;
    // Only include if has sleep or stress data
    if (!r.sleepQuality && !r.stressfulEvents) return;

    // Combine multiple stressful events with ";" if they exist
    const stressText = r.stressfulEvents
      ? r.stressfulEvents
          .split("\n")
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
          .join("; ")
      : "";

    rows.push({
      Nickname: entry.nickname,
      Timestamp: entry.timestamp,
      "Dia do Estudo": entry.pingDay,
      "Ping (Slot)": entry.pingIndex,
      Horário: NOTIFICATION_TIMES[entry.pingIndex - 1] || "?",
      "Qualidade do Sono": r.sleepQuality ?? "",
      "Eventos Estressantes": stressText,
    });
  });

  return rows;
}

/**
 * Export all data to a multi-sheet Excel file and trigger download.
 */
export function exportToExcel(allUsers: GameState[]): {
  success: boolean;
  recordCount: number;
  message: string;
} {
  if (!allUsers || allUsers.length === 0) {
    return {
      success: false,
      recordCount: 0,
      message: "Nenhum dado disponível para exportar.",
    };
  }

  const allResponses = flattenResponses(allUsers);

  if (allResponses.length === 0) {
    return {
      success: false,
      recordCount: 0,
      message: "Nenhuma resposta encontrada para exportar.",
    };
  }

  // Build sheet data
  const samData = buildSamSheet(allResponses);
  const panasData = buildPanasSheet(allResponses);
  const screenTimeData = buildScreenTimeSheet(allResponses, allUsers);
  const covariablesData = buildCovariablesSheet(allResponses);

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Helper to add a sheet (handles empty data gracefully)
  const addSheet = (data: Record<string, any>[], name: string) => {
    if (data.length === 0) {
      // Create sheet with just a header saying "Sem dados"
      const ws = XLSX.utils.aoa_to_sheet([["Sem dados disponíveis"]]);
      XLSX.utils.book_append_sheet(wb, ws, name);
    } else {
      const ws = XLSX.utils.json_to_sheet(data);

      // Auto-size columns
      const colWidths = Object.keys(data[0]).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...data.map((row) => String(row[key] ?? "").length)
        );
        return { wch: Math.min(maxLen + 2, 40) };
      });
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, name);
    }
  };

  addSheet(samData, "SAM");
  addSheet(panasData, "PANAS");
  addSheet(screenTimeData, "Tempo de Tela");
  addSheet(covariablesData, "Co-variáveis");

  // Generate and download
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `dados_estudo_enigma_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);

  const totalRecords =
    samData.length +
    panasData.length +
    screenTimeData.length +
    covariablesData.length;

  return {
    success: true,
    recordCount: totalRecords,
    message: `Exportado com sucesso: ${totalRecords} registros em 4 abas.`,
  };
}
