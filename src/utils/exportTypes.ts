export type SamRow = {
  Nickname: string;
  Timestamp: string;
  "Dia do Estudo": number;
  "Ping (Slot)": number;
  Horário: string;
  Tipo: string;
  Valência: number;
  Ativação: number;
  Dominância: number;
};

export type PanasRow = {
  Nickname: string;
  Timestamp: string;
  "Dia do Estudo": number;
  "Ping (Slot)": number;
  Horário: string;
  "Tipo PANAS": string;
} & Record<string, number | string>;

export type ScreenTimeRow = {
  Nickname: string;
  Timestamp: string;
  "Dia do Estudo": number;
  "Ping (Slot)": number;
  Horário: string;
  "Total (min)": number;
} & Record<string, number | string>;

export type CovariablesRow = {
  Nickname: string;
  Timestamp: string;
  "Dia do Estudo": number;
  "Ping (Slot)": number;
  Horário: string;
  "Qualidade do Sono": number | "";
  "Eventos Estressantes": string;
};

export type ExportSheets = {
  sam: SamRow[];
  panas: PanasRow[];
  screenTime: ScreenTimeRow[];
  covariables: CovariablesRow[];
};

export type ExportResult = {
  success: boolean;
  recordCount: number;
  message: string;
};
