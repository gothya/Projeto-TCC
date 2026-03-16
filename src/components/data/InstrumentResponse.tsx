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
  sam?: SamResponse;
  wasWatchingFeed?: boolean;
  panas?: PanasResponse;
  sleepQuality?: number;
  stressfulEvents?: string;
  screenTimeLog?: ScreenTimeEntry[];
};
