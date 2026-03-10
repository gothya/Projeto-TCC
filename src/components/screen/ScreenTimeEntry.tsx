export type ScreenTimeEntry = {
  id: string;
  platform: string;
  otherPlatformDetail: string;
  hours: string;
  minutes: string;
  duration: string; // kept for backward compatibility (total in minutes)
};
