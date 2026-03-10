import { User } from "./User";

import { InstrumentResponse } from "./InstrumentResponse";
import { PingStatus } from "./PingStatus";
import { SociodemographicData } from "./SocialDemographicData";

export type GameState = {
  user: User;

  hasOnboarded: boolean;
  studyStartDate: string | null;
  responses: InstrumentResponse[];
  pings: { statuses: PingStatus[] }[];
  sociodemographicData: SociodemographicData | null;
  firebaseId?: string;
};
