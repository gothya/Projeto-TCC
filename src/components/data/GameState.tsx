import { User } from "./User";
import { Badge } from "./Badge";
import { InstrumentResponse } from "./InstrumentResponse";
import { PingStatus } from "./PingStatus";
import { SociodemographicData } from "./SocialDemographicData";

export type GameState = {
  user: User;
  badges: Badge[];
  hasOnboarded: boolean;
  studyStartDate: string | null;
  responses: InstrumentResponse[];
  pings: { statuses: PingStatus[] }[];
  sociodemographicData: SociodemographicData | null;
};
