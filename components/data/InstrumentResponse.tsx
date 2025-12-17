import { SamResponse } from "./SamResponse";
import { PanasResponse } from "./PanasResponse";
import { ScreenTimeEntry } from "../screen/ScreenTimeEntry";

export type InstrumentResponse = {
  timestamp: string;
  pingDay: number;
  pingIndex: number;
  type: "regular" | "end_of_day";
  sam?: SamResponse;
  wasWatchingFeed?: boolean;
  panas?: PanasResponse;
  sleepQuality?: number;
  stressfulEvents?: string;
  screenTimeLog?: ScreenTimeEntry[];
};
