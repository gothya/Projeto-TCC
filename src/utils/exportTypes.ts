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

export type ParticipantRow = {
  Nickname: string;
  Email: string;
  "Firebase ID": string;
  "Status Onboarding": string;
  "Data de Início": string;
  Idade: number | string;
  Estado: string;
  Gênero: string;
  "Estado Civil": string;
  Escolaridade: string;
  Ocupação: string;
  "Renda Mensal": string;
  "Medicação Contínua": string;
  "Detalhes Medicação": string;
  "Diagnóstico Saúde Física/Mental": string;
  "Detalhes Diagnóstico": string;
  "Plataformas Mais Usadas": string;
  "Outras Plataformas": string;
  "Período de Uso": string;
  "Tempo de Uso Diário": string;
  "Propósito (Conversar)": string;
  "Propósito (Compartilhar)": string;
  "Propósito (Assistir)": string;
  "Propósito (Pesquisar)": string;
};

export type ExportSheets = {
  participants: ParticipantRow[];
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
