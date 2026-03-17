import { ScreenTimeEntry } from "@/src/components/screen/ScreenTimeEntry";

/**
 * Converte um ScreenTimeEntry para minutos totais.
 * Usa hours/minutes se disponíveis; cai para o campo legado "duration" caso contrário.
 */
export function parseDurationMinutes(entry: ScreenTimeEntry): number {
  if (entry.hours || entry.minutes) {
    const h = parseInt(entry.hours || "0");
    const m = parseInt(entry.minutes || "0");
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  }
  const dur = parseInt(entry.duration || "0");
  return isNaN(dur) ? 0 : dur;
}

/**
 * Resolve o nome exibível de uma plataforma, tratando o caso "Outro".
 */
export function resolvePlatformName(entry: ScreenTimeEntry): string {
  if (entry.platform === "Outro") {
    return entry.otherPlatformDetail || "Outro";
  }
  return entry.platform || "Outros";
}
