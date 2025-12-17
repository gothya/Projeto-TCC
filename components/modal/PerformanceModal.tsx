import React from "react";
import { GameState } from "../data/GameState";
import { MOCK_PLAYERS } from "../data/MockPlayers";
import { Modal } from "./Modal";

export const PerformanceModal: React.FC<{
  onClose: () => void;
  gameState: GameState;
}> = ({ onClose, gameState }) => {
  const userXpHistory = gameState.pings.flat().reduce((acc, status, index) => {
    const lastXp = acc.length > 0 ? acc[acc.length - 1] : 0;
    let currentXp = lastXp;
    if (status === "completed") {
      const isStar = (index + 1) % 7 === 0;
      currentXp += isStar ? 100 : 50;
    }
    acc.push(currentXp);
    return acc;
  }, [] as number[]);

  const totalPings = 49;
  while (userXpHistory.length < totalPings) {
    userXpHistory.push(userXpHistory[userXpHistory.length - 1] ?? 0);
  }

  const avgXp =
    MOCK_PLAYERS.reduce((sum, p) => sum + p.points, 0) / MOCK_PLAYERS.length;
  const allPlayers = [
    ...MOCK_PLAYERS,
    { nickname: gameState.user.nickname, points: gameState.user.points },
  ];
  const maxXp = Math.max(...allPlayers.map((p) => p.points));
  const chartMaxY = Math.max(maxXp, avgXp, ...userXpHistory, 1) * 1.1;

  const width = 500,
    height = 300;
  const margin = { top: 20, right: 30, bottom: 50, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const toPath = (data: number[]) => {
    if (data.length === 0) return "";
    return (
      "M" +
      data
        .map((p, i) => {
          const x = (i / Math.max(1, totalPings - 1)) * chartWidth;
          const y = chartHeight - (p / Math.max(1, chartMaxY)) * chartHeight;
          return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" L")
    );
  };

  const toAreaPath = (data: number[]) => {
    const linePath = toPath(data);
    if (!linePath.startsWith("M")) return "";
    return `${linePath} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
  };

  const userLinePath = toPath(userXpHistory);
  const userAreaPath = toAreaPath(userXpHistory);

  const numTicks = 5;
  const yTicks = Array.from({ length: numTicks + 1 }, (_, i) => {
    const value = (chartMaxY / numTicks) * i;
    const yPos = chartHeight - (value / Math.max(1, chartMaxY)) * chartHeight;
    return { value, y: yPos };
  });

  return (
    <Modal onClose={onClose} className="max-w-3xl">
      <div className="p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-cyan-400 text-center mb-6">
          Resumo de Desempenho
        </h2>
        <div className="flex flex-col items-center">
          <div className="w-full">
            <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
              <defs>
                <linearGradient
                  id="userAreaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#00ffff" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#00ffff" stopOpacity="0" />
                </linearGradient>
                <filter
                  id="lineGlow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g transform={`translate(${margin.left}, ${margin.top})`}>
                {yTicks.map((tick) => (
                  <g key={tick.value} className="text-gray-500 text-xs">
                    <line
                      x1="0"
                      y1={tick.y}
                      x2={chartWidth}
                      y2={tick.y}
                      stroke="currentColor"
                      strokeWidth="0.5"
                      strokeDasharray="2 4"
                      opacity="0.3"
                    />
                    <text
                      x="-10"
                      y={tick.y}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fill="currentColor"
                    >
                      {Math.round(tick.value)}
                    </text>
                  </g>
                ))}
                <line
                  x1="0"
                  y1={chartHeight}
                  x2={chartWidth}
                  y2={chartHeight}
                  stroke="#6b7280"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={chartHeight}
                  stroke="#6b7280"
                  strokeWidth="1"
                />
                <text
                  x={chartWidth / 2}
                  y={chartHeight + 40}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize="14"
                >
                  Pings ao longo de 7 dias
                </text>
                <text
                  transform={`rotate(-90)`}
                  x={-chartHeight / 2}
                  y={-45}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize="14"
                >
                  XP Acumulado
                </text>
                <line
                  x1="0"
                  y1={
                    chartHeight - (maxXp / Math.max(1, chartMaxY)) * chartHeight
                  }
                  x2={chartWidth}
                  y2={
                    chartHeight - (maxXp / Math.max(1, chartMaxY)) * chartHeight
                  }
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  opacity="0.6"
                />
                <line
                  x1="0"
                  y1={
                    chartHeight - (avgXp / Math.max(1, chartMaxY)) * chartHeight
                  }
                  x2={chartWidth}
                  y2={
                    chartHeight - (avgXp / Math.max(1, chartMaxY)) * chartHeight
                  }
                  stroke="#8b5cf6"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <path d={userAreaPath} fill="url(#userAreaGradient)" />
                <path
                  d={userLinePath}
                  fill="none"
                  stroke="#00ffff"
                  strokeWidth="2.5"
                  filter="url(#lineGlow)"
                />
              </g>
            </svg>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 text-sm text-gray-300">
            <div className="flex items-center space-x-2">
              <svg width="16" height="8">
                <line
                  x1="0"
                  y1="4"
                  x2="16"
                  y2="4"
                  stroke="#00ffff"
                  strokeWidth="2.5"
                />
              </svg>
              <span>Seu Desempenho</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg width="16" height="8">
                <line
                  x1="0"
                  y1="4"
                  x2="16"
                  y2="4"
                  stroke="#8b5cf6"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              </svg>
              <span>Média dos Jogadores</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg width="16" height="8">
                <line
                  x1="0"
                  y1="4"
                  x2="16"
                  y2="4"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  opacity="0.6"
                />
              </svg>
              <span>Melhor Jogador</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
