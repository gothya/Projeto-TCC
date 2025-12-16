import { User } from "./User";
import { Badge } from "./Badge";

export type GameState = {
  user: User;
  badges: Badge[];
  hasOnboarded: boolean;
  studyStartDate: string | null;
  responses: InstrumentResponse[];
  pings: PingStatus[][];
  sociodemographicData: SociodemographicData | null;
};
