export const ADMIN_MOCK_STATS = {
  totalParticipants: 142,
  activeUsersToday: 118,
  globalResponseRate: 76,
  // 7 Days x 7 Pings (Average % response)
  pingHeatmap: [
    [98, 95, 92, 88, 85, 80, 78], // Day 1
    [95, 92, 90, 85, 82, 78, 75],
    [90, 88, 85, 82, 78, 75, 72],
    [88, 85, 82, 80, 75, 72, 70],
    [85, 82, 80, 78, 72, 70, 68],
    [82, 80, 78, 75, 70, 68, 65],
    [80, 78, 75, 72, 68, 65, 60], // Day 7
  ],
};
