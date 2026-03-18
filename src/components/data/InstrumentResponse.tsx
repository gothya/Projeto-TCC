import { SamResponse } from "./SamResponse";
import { PanasResponse } from "./PanasResponse";
import { ScreenTimeEntry } from "../screen/ScreenTimeEntry";

export type InstrumentResponse = {
  timestamp: string;
  pingDay: number;
  pingIndex: number;
  type: "regular" | "end_of_day";
  /** Indica se esta é a resposta válida para o ping. false = sobrescrita por resposta posterior. Ausente = true (retrocompatibilidade). */
  isValid?: boolean;
  /** true enquanto o formulário está em andamento; false (ou ausente) = resposta completa. */
  isPartial?: boolean;
  /** Último passo concluído antes de o formulário ser fechado (ex: "sam", "feed_context", "panas_daily"). */
  lastCompletedStep?: string;
  sam?: SamResponse;
  wasWatchingFeed?: boolean;
  panas?: PanasResponse;
  sleepQuality?: number;
  stressfulEvents?: string;
  screenTimeLog?: ScreenTimeEntry[];
};
