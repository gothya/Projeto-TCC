export type User = {
  email: string;           // 📧 Novo identificador principal
  nickname?: string;       // 👤 Opcional, caso queira exibir um nome social
  points: number;          // 🏆 Pontos acumulados
  level: number;           // 🆙 Nível atual
  responseRate: number;    // 📈 Taxa de resposta
  currentStreak: number;   // 🔥 Sequência atual
  completedDays: number;   // 📅 Dias finalizados
  avatar?: string | null;  // 🖼️ URL da foto (pode vir do Google)
};