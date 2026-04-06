import { User } from "./User";

import { InstrumentResponse } from "./InstrumentResponse";
import { PingStatus } from "./PingStatus";
import { SociodemographicData } from "./SocialDemographicData";
import { DailyScreenTimeLog } from "../screen/ScreenTimeEntry";

export type GameState = {
  user: User;

  hasOnboarded: boolean;
  studyStartDate: string | null;
  responses: InstrumentResponse[];
  pings: { statuses: PingStatus[] }[];
  sociodemographicData: SociodemographicData | null;
  firebaseId?: string;
  /** Registros diários de tempo de tela (independente dos pings). */
  dailyScreenTimeLogs?: DailyScreenTimeLog[];
  /** Flag persistida após envio da avaliação de reação (desfecho da jornada). */
  reactionEvaluationDone?: boolean;
  /** Token FCM para push notifications. Salvo via setDoc merge — pode estar ausente em participantes antigos. */
  fcmToken?: string;
  /** Origem onde o token FCM foi gerado (window.location.origin). Usado para detectar tokens de origem errada. */
  fcmTokenOrigin?: string;
};
