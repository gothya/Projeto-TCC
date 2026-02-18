export type User = {
  nickname: string;
  points: number;
  level: number;
  responseRate: number;
  currentStreak: number;
  completedDays: number;
  avatar?: string | null;
  password: string;
};
