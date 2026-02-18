import { InstrumentResponse } from "../data/InstrumentResponse";

export type InstrumentFlowState = {
  ping: { day: number; ping: number };
  type: "regular" | "end_of_day";
  step:
    | "sam"
    | "feed_context"
    | "panas_contextual"
    | "panas_daily"
    | "end_of_day_log";
  data: Partial<InstrumentResponse>;
} | null;
