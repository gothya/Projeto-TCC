import React, { useId } from "react";

export const EmotionExplorerBadge = ({
  className = "",
  unlocked = false,
}: {
  className?: string;
  unlocked?: boolean;
}) => {
  const uniqueId = useId();
  const mainColor = unlocked ? "#00ffff" : "#555";
  const secondaryColor = unlocked ? "#3a2d7f" : "#444";
  const highlightColor = unlocked ? "#7df9ff" : "#666";
  const handleColor = unlocked ? "#a98764" : "#666";
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {" "}
        <linearGradient
          id={`heart-gradient-${uniqueId}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          {" "}
          <stop offset="0%" stopColor={secondaryColor} />{" "}
          <stop offset="100%" stopColor={mainColor} />{" "}
        </linearGradient>{" "}
        <radialGradient id={`brain-gradient-${uniqueId}`}>
          {" "}
          <stop offset="0%" stopColor={unlocked ? "#fff" : "#777"} />{" "}
          <stop offset="100%" stopColor={unlocked ? highlightColor : "#555"} />{" "}
        </radialGradient>{" "}
        <filter
          id={`badge-glow-${uniqueId}`}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          {" "}
          <feGaussianBlur
            stdDeviation={unlocked ? "3" : "0"}
            result="coloredBlur"
          />{" "}
          <feMerge>
            {" "}
            <feMergeNode in="coloredBlur" /> <feMergeNode in="SourceGraphic" />{" "}
          </feMerge>{" "}
        </filter>{" "}
      </defs>
      <g filter={`url(#badge-glow-${uniqueId})`} opacity={unlocked ? 1 : 0.5}>
        <path
          d="M 5 70 C 10 85, 25 90, 40 80 L 60 90 C 75 100, 90 95, 95 80 L 95 70 C 90 75, 75 80, 60 70 L 40 80 C 25 70, 10 75, 5 70 Z"
          fill={unlocked ? "#4a90e2" : "#3a3a3a"}
          stroke={unlocked ? "#a4c8f0" : "#555"}
          strokeWidth="1"
        />
        <path
          d="M50 15 C 40 5, 20 10, 20 25 C 20 45, 50 65, 50 65 C 50 65, 80 45, 80 25 C 80 10, 60 5, 50 15 Z"
          fill={`url(#heart-gradient-${uniqueId})`}
          stroke={highlightColor}
          strokeWidth="1.5"
        />
        <path
          d="M50 15 L 50 65 L 20 25"
          fill="none"
          stroke={
            unlocked ? "rgba(220, 240, 255, 0.3)" : "rgba(100, 100, 100, 0.3)"
          }
          strokeWidth="1"
        />{" "}
        <path
          d="M50 15 L 50 65 L 80 25"
          fill="none"
          stroke={
            unlocked ? "rgba(220, 240, 255, 0.3)" : "rgba(100, 100, 100, 0.3)"
          }
          strokeWidth="1"
        />{" "}
        <path
          d="M35 22 L 50 42 L 65 22"
          fill="none"
          stroke={
            unlocked ? "rgba(220, 240, 255, 0.2)" : "rgba(100, 100, 100, 0.2)"
          }
          strokeWidth="0.5"
        />
        <g transform="rotate(-30 40 40)">
          <path
            d="M22 60 L 15 75 L 20 80 L 27 65 Z"
            fill={handleColor}
            stroke={highlightColor}
            strokeWidth="0.5"
          />{" "}
          <circle
            cx="35"
            cy="40"
            r="18"
            fill={
              unlocked ? "rgba(0, 255, 255, 0.15)" : "rgba(80, 80, 80, 0.3)"
            }
            stroke={handleColor}
            strokeWidth="4"
          />
          <g transform="translate(25, 32) scale(0.18)">
            <path
              d="M68.5,41.7C65.3,38,62.5,33,62.8,28.3c0.3-4.2,3.3-6.9,3.3-6.9c-1.3-3.2-1.3-7.2-1.3-7.2c-2.6,0-5.2,1.3-6.5,2.6 c-1.3,1.3-2.6,3.9-5.2,3.9s-3.9-2.6-5.2-3.9s-3.9-2.6-6.5-2.6s-5.2,1.3-6.5,2.6s-2.6,3.9-5.2,3.9s-3.9-2.6-5.2-3.9 c-1.3-1.3-3.9-2.6-6.5-2.6c0,0,0,3.9-1.3,7.2c0,0,3,2.6,3.3,6.9c0.3,4.6-2.6,9.6-5.8,13.3S10.2,50,13.4,54.8 c3.3,4.8,8.2,7.9,13.8,7.9c4.2,0,9.1-1.6,12.4-5.2c2.6,3.9,7.8,5.2,12.1,5.2c5.6,0,10.4-3.2,13.8-7.9 C69.1,50,65.3,45.3,68.5,41.7z"
              fill={`url(#brain-gradient-${uniqueId})`}
            />
            {unlocked && (
              <path
                d="M68.5,41.7C65.3,38,62.5,33,62.8,28.3c0.3-4.2,3.3-6.9,3.3-6.9c-1.3-3.2-1.3-7.2-1.3-7.2c-2.6,0-5.2,1.3-6.5,2.6 c-1.3,1.3-2.6,3.9-5.2,3.9s-3.9-2.6-5.2-3.9s-3.9-2.6-5.2-3.9s-3.9-2.6-5.2-3.9 c-1.3-1.3-3.9-2.6-6.5-2.6c0,0,0,3.9-1.3,7.2c0,0,3,2.6,3.3,6.9c0.3,4.6-2.6,9.6-5.8,13.3S10.2,50,13.4,54.8 c3.3,4.8,8.2,7.9,13.8,7.9c4.2,0,9.1-1.6,12.4-5.2c2.6,3.9,7.8,5.2,12.1,5.2c5.6,0,10.4-3.2,13.8-7.9 C69.1,50,65.3,45.3,68.5,41.7z"
                fill="none"
                stroke={mainColor}
                strokeWidth="3"
              />
            )}
          </g>
        </g>
      </g>
    </svg>
  );
};
