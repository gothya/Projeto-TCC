import * as XLSX from "xlsx";
import { GameState } from "@/src/components/data/GameState";
import { InstrumentResponse } from "@/src/components/data/InstrumentResponse";
import { NEGATIVE_ITEMS, NOTIFICATION_TIMES, POSITIVE_ITEMS } from "@/src/constants/panas";
import { parseDurationMinutes, resolvePlatformName } from "./screenTimeUtils";
import {
  CovariablesRow,
  ExportResult,
  ExportSheets,
  PanasRow,
  ParticipantRow,
  SamRow,
  ScreenTimeRow,
} from "./exportTypes";

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

type FlatResponse = {
  nickname: string;
  participantId: string;
  timestamp: string;
  pingDay: number;
  pingIndex: number;
  pingLabel: string;
  type: "regular" | "end_of_day";
  response: InstrumentResponse;
};

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function flattenResponses(allUsers: GameState[]): FlatResponse[] {
  const flat: FlatResponse[] = [];

  allUsers.forEach((user) => {
    const nickname = user.user?.nickname || "Desconhecido";
    const participantId = user.firebaseId || "N/A";

    (user.responses || [])
      .filter((r) => r.isValid !== false)
      .forEach((r) => {
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

function buildSamSheet(allResponses: FlatResponse[]): SamRow[] {
  const rows: SamRow[] = [];

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

function buildPanasSheet(allResponses: FlatResponse[]): PanasRow[] {
  const rows: PanasRow[] = [];

  allResponses.forEach((entry) => {
    const r = entry.response;
    if (!r.panas) return;

    const panasType = entry.type === "end_of_day" ? "Final do Dia" : "Meio do Dia";

    const row: PanasRow = {
      Nickname: entry.nickname,
      Timestamp: entry.timestamp,
      "Dia do Estudo": entry.pingDay,
      "Ping (Slot)": entry.pingIndex,
      Horário: NOTIFICATION_TIMES[entry.pingIndex - 1] || "?",
      "Tipo PANAS": panasType,
    };

    POSITIVE_ITEMS.forEach((item) => {
      row[`POS_${item}`] = r.panas![item] ?? "";
    });

    NEGATIVE_ITEMS.forEach((item) => {
      row[`NEG_${item}`] = r.panas![item] ?? "";
    });

    rows.push(row);
  });

  return rows;
}

function buildScreenTimeSheet(
  allResponses: FlatResponse[],
  allUsers: GameState[]
): ScreenTimeRow[] {
  // 1ª passagem: coletar todos os nomes de plataforma
  const allPlatforms = new Set<string>();
  allUsers.forEach((user) => {
    (user.responses || [])
      .filter((r) => r.isValid !== false)
      .forEach((r) => {
        if (r.screenTimeLog) {
          r.screenTimeLog.forEach((entry) => {
            allPlatforms.add(resolvePlatformName(entry));
          });
        }
      });
  });

  const platformList = Array.from(allPlatforms).sort();

  // 2ª passagem: montar linhas
  const rows: ScreenTimeRow[] = [];

  allResponses.forEach((entry) => {
    const r = entry.response;
    if (!r.screenTimeLog || r.screenTimeLog.length === 0) return;

    const row: ScreenTimeRow = {
      Nickname: entry.nickname,
      Timestamp: entry.timestamp,
      "Dia do Estudo": entry.pingDay,
      "Ping (Slot)": entry.pingIndex,
      Horário: NOTIFICATION_TIMES[entry.pingIndex - 1] || "?",
      "Total (min)": 0,
    };

    platformList.forEach((p) => {
      row[`${p} (min)`] = 0;
    });

    let totalMinutes = 0;

    r.screenTimeLog.forEach((stEntry) => {
      const platformName = resolvePlatformName(stEntry);
      const dur = parseDurationMinutes(stEntry);

      const key = `${platformName} (min)`;
      row[key] = ((row[key] as number) || 0) + dur;
      totalMinutes += dur;
    });

    row["Total (min)"] = totalMinutes;
    rows.push(row);
  });

  return rows;
}

function buildDailyScreenTimeSheet(allUsers: GameState[]): Record<string, unknown>[] {
  // 1ª passagem: coletar plataformas distintas
  const allPlatforms = new Set<string>();
  allUsers.forEach((user) => {
    (user.dailyScreenTimeLogs ?? []).forEach((log) => {
      log.entries.forEach((entry) => allPlatforms.add(resolvePlatformName(entry)));
    });
  });
  const platformList = Array.from(allPlatforms).sort();

  // 2ª passagem: montar linhas
  const rows: Record<string, unknown>[] = [];
  allUsers.forEach((user) => {
    const nickname = user.user?.nickname || "Desconhecido";
    (user.dailyScreenTimeLogs ?? []).forEach((log) => {
      const row: Record<string, unknown> = {
        Nickname: nickname,
        Data: new Date(log.date + "T12:00:00").toLocaleDateString("pt-BR"),
        "Total (min)": 0,
      };
      platformList.forEach((p) => { row[`${p} (min)`] = 0; });

      let total = 0;
      log.entries.forEach((entry) => {
        const plat = resolvePlatformName(entry);
        const dur = parseDurationMinutes(entry);
        row[`${plat} (min)`] = ((row[`${plat} (min)`] as number) || 0) + dur;
        total += dur;
      });
      row["Total (min)"] = total;
      rows.push(row);
    });
  });
  return rows;
}

function buildParticipantsSheet(allUsers: GameState[]): ParticipantRow[] {
  return allUsers.map((user) => {
    const sd = user.sociodemographicData;
    return {
      Nickname: user.user?.nickname || "N/A",
      Email: user.user?.email || "N/A",
      "Firebase ID": user.firebaseId || "N/A",
      "Status Onboarding": user.hasOnboarded ? "Concluído" : "Incompleto",
      "Data de Início": user.studyStartDate
        ? new Date(user.studyStartDate).toLocaleDateString("pt-BR")
        : "N/A",
      Idade: sd?.age ?? "N/A",
      Estado: sd?.state ?? "N/A",
      Gênero: sd?.gender ?? "N/A",
      "Estado Civil": sd?.maritalStatus ?? "N/A",
      Escolaridade: sd?.education ?? "N/A",
      Ocupação: sd?.occupation ?? "N/A",
      "Renda Mensal": sd?.monthlyIncome ?? "N/A",
    };
  });
}

function buildCovariablesSheet(allResponses: FlatResponse[]): CovariablesRow[] {
  const rows: CovariablesRow[] = [];

  allResponses.forEach((entry) => {
    const r = entry.response;
    if (!r.sleepQuality && !r.stressfulEvents) return;

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

function addSheetToWorkbook(
  wb: XLSX.WorkBook,
  data: Record<string, unknown>[],
  name: string
): void {
  if (data.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([["Sem dados disponíveis"]]);
    XLSX.utils.book_append_sheet(wb, ws, name);
    return;
  }

  const ws = XLSX.utils.json_to_sheet(data);

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

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Constrói o workbook com todas as abas. Não dispara download.
 * Útil para testes unitários e pré-visualização.
 */
export function buildWorkbook(allUsers: GameState[]): {
  wb: XLSX.WorkBook;
  sheets: ExportSheets;
} {
  const allResponses = flattenResponses(allUsers);

  const sheets: ExportSheets = {
    participants: buildParticipantsSheet(allUsers),
    sam: buildSamSheet(allResponses),
    panas: buildPanasSheet(allResponses),
    screenTime: buildScreenTimeSheet(allResponses, allUsers),
    covariables: buildCovariablesSheet(allResponses),
  };

  const wb = XLSX.utils.book_new();
  addSheetToWorkbook(wb, sheets.participants as unknown as Record<string, unknown>[], "Participantes");
  addSheetToWorkbook(wb, sheets.sam as unknown as Record<string, unknown>[], "SAM");
  addSheetToWorkbook(wb, sheets.panas as unknown as Record<string, unknown>[], "PANAS");
  addSheetToWorkbook(wb, sheets.screenTime as unknown as Record<string, unknown>[], "Tempo de Tela (EOD)");
  addSheetToWorkbook(wb, buildDailyScreenTimeSheet(allUsers), "Tempo de Tela (Diário)");
  addSheetToWorkbook(wb, sheets.covariables as unknown as Record<string, unknown>[], "Co-variáveis");

  return { wb, sheets };
}

/**
 * Gera e faz download do arquivo Excel.
 * Assinatura idêntica à versão anterior — nenhum chamador precisa mudar.
 */
export function exportToExcel(allUsers: GameState[]): ExportResult {
  if (!allUsers || allUsers.length === 0) {
    return { success: false, recordCount: 0, message: "Nenhum dado disponível para exportar." };
  }

  const allResponses = flattenResponses(allUsers);
  if (allResponses.length === 0) {
    return { success: false, recordCount: 0, message: "Nenhuma resposta encontrada para exportar." };
  }

  const { wb, sheets } = buildWorkbook(allUsers);

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `dados_estudo_enigma_${dateStr}.xlsx`);

  const totalRecords =
    sheets.sam.length +
    sheets.panas.length +
    sheets.screenTime.length +
    sheets.covariables.length;

  return {
    success: true,
    recordCount: totalRecords,
    message: `Exportado com sucesso: ${sheets.participants.length} participantes e ${totalRecords} registros em 5 abas.`,
  };
}
