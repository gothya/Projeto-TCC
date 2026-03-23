export type EmotionEntry = {
  word: string;
  context: string;
  arousal: "Alta" | "Média-Alta" | "Média" | "Baixa";
  opposite: string;
};

export const PA_DICT: EmotionEntry[] = [
  { word: "Animado",       context: "Estado de energia e disposição positiva",              arousal: "Alta",       opposite: "Apático"        },
  { word: "Entusiasmado",  context: "Motivação intensa para agir ou participar",            arousal: "Alta",       opposite: "Desmotivado"    },
  { word: "Inspirado",     context: "Sensação de propósito, criatividade e significado",    arousal: "Média",      opposite: "Desanimado"     },
  { word: "Orgulhoso",     context: "Satisfação com conquistas pessoais",                   arousal: "Média",      opposite: "Envergonhado"   },
  { word: "Determinado",   context: "Foco e persistência em objetivos",                     arousal: "Média-Alta", opposite: "Indeciso"       },
  { word: "Forte",         context: "Sensação de capacidade e controle interno",            arousal: "Média",      opposite: "Fraco"          },
  { word: "Ativo",         context: "Engajamento em ações, energia comportamental",         arousal: "Alta",       opposite: "Inativo"        },
  { word: "Atento",        context: "Estado de foco e concentração",                        arousal: "Média",      opposite: "Distraído"      },
  { word: "Alerta",        context: "Vigilância e prontidão ao ambiente",                   arousal: "Média-Alta", opposite: "Letárgico"      },
  { word: "Interessado",   context: "Curiosidade e envolvimento cognitivo/emocional",       arousal: "Média",      opposite: "Desinteressado" },
];

export const NA_DICT: EmotionEntry[] = [
  { word: "Aflito",        context: "Sofrimento emocional, sensação de sobrecarga",         arousal: "Alta",       opposite: "Tranquilo"      },
  { word: "Angustiado",    context: "Desconforto emocional profundo e persistente",         arousal: "Alta",       opposite: "Aliviado"       },
  { word: "Perturbado",    context: "Estado de abalo emocional ou confusão",                arousal: "Média",      opposite: "Calmo"          },
  { word: "Incomodado",    context: "Irritação leve ou desconforto situacional",            arousal: "Média",      opposite: "Confortável"    },
  { word: "Irritado",      context: "Reatividade emocional elevada, impaciência",           arousal: "Média-Alta", opposite: "Paciente"       },
  { word: "Culpado",       context: "Sensação de erro moral ou responsabilidade negativa",  arousal: "Média",      opposite: "Inocente"       },
  { word: "Amedrontado",   context: "Medo diante de ameaça percebida",                      arousal: "Alta",       opposite: "Seguro"         },
  { word: "Nervoso",       context: "Ansiedade e tensão antecipatória",                     arousal: "Média-Alta", opposite: "Relaxado"       },
  { word: "Inquieto",      context: "Ansiedade com componente físico (agitação)",           arousal: "Alta",       opposite: "Calmo"          },
  { word: "Envergonhado",  context: "Avaliação negativa de si em contexto social",          arousal: "Média",      opposite: "Orgulhoso"      },
];
