import React, { useRef } from "react";

export const PlexusFace = () => {
  const points = [
    { x: 125, y: 250 },
    { x: 155, y: 240 },
    { x: 180, y: 220 },
    { x: 200, y: 195 },
    { x: 212, y: 165 }, // 0-4 Chin Right
    { x: 215, y: 135 },
    { x: 212, y: 105 },
    { x: 200, y: 75 },
    { x: 180, y: 50 },
    { x: 95, y: 30 },
    { x: 125, y: 20 }, // 5-10 Head top right
    { x: 95, y: 30 },
    { x: 70, y: 50 },
    { x: 50, y: 75 },
    { x: 38, y: 105 },
    { x: 35, y: 135 }, // 11-15 Head top left
    { x: 38, y: 165 },
    { x: 50, y: 195 },
    { x: 70, y: 220 },
    { x: 95, y: 240 },
    { x: 125, y: 250 }, // 16-20 Chin Left
    { x: 125, y: 228 },
    { x: 150, y: 220 },
    { x: 170, y: 200 },
    { x: 125, y: 235 }, // 21-24 Mouth right side
    { x: 100, y: 220 },
    { x: 80, y: 200 },
    { x: 125, y: 235 },
    { x: 125, y: 228 }, // 25-28 Mouth left side
    { x: 125, y: 185 },
    { x: 135, y: 175 },
    { x: 155, y: 170 },
    { x: 125, y: 205 }, // 29-32 Nose right
    { x: 115, y: 175 },
    { x: 95, y: 170 },
    { x: 125, y: 205 },
    { x: 125, y: 185 }, // 33-36 Nose left
    { x: 165, y: 140 },
    { x: 180, y: 130 },
    { x: 150, y: 120 },
    { x: 165, y: 110 }, // 37-40 Right Eye
    { x: 85, y: 140 },
    { x: 70, y: 130 },
    { x: 100, y: 120 },
    { x: 85, y: 110 }, // 41-44 Left Eye
    { x: 70, y: 80 },
    { x: 180, y: 80 },
    { x: 100, y: 50 },
    { x: 150, y: 50 }, // 45-48 Forehead
    { x: 50, y: 150 },
    { x: 200, y: 150 },
    { x: 80, y: 180 },
    { x: 170, y: 180 }, // 49-52 Cheeks
    { x: 220, y: 40 },
    { x: 235, y: 55 },
    { x: 225, y: 70 },
    { x: 25, y: 50 },
    { x: 15, y: 70 },
    { x: 30, y: 85 },
    { x: 220, y: 190 },
    { x: 210, y: 210 },
    { x: 230, y: 205 },
    { x: 20, y: 200 },
    { x: 30, y: 220 },
    { x: 45, y: 215 },
    { x: 185, y: 15 },
    { x: 200, y: 25 },
    { x: 180, y: 35 },
    { x: 65, y: 15 },
    { x: 50, y: 25 },
    { x: 70, y: 35 },
  ];
  const triangles = [
    [10, 49, 50],
    [11, 50, 49],
    [12, 46, 45],
    [13, 45, 46],
    [13, 14, 45],
    [14, 15, 45],
    [15, 16, 51],
    [16, 17, 51],
    [17, 18, 51],
    [18, 19, 20],
    [37, 38, 39],
    [37, 40, 39],
    [38, 40, 39],
    [41, 42, 43],
    [41, 44, 43],
    [42, 44, 43],
    [29, 30, 31],
    [30, 32, 31],
    [33, 34, 35],
    [34, 36, 35],
    [37, 50, 38],
    [38, 50, 52],
    [38, 52, 40],
    [40, 52, 39],
    [41, 51, 42],
    [42, 51, 49],
    [42, 49, 44],
    [44, 49, 43],
    [47, 48, 10],
    [47, 50, 10],
    [47, 48, 50],
    [45, 46, 12],
    [45, 13, 14],
    [21, 27, 23],
    [27, 22, 23],
    [21, 23, 22],
    [23, 22, 24],
    [24, 22, 25],
    [25, 22, 26],
    [20, 21, 27],
    [20, 27, 26],
    [19, 20, 26],
    [1, 2, 22],
    [2, 23, 22],
    [3, 4, 52],
    [4, 5, 52],
    [5, 6, 50],
    [6, 7, 50],
    [7, 8, 48],
    [8, 9, 48],
    [9, 10, 50],
    [11, 12, 46],
    [12, 13, 46],
    [14, 45, 15],
    [15, 51, 16],
    [16, 51, 49],
    [16, 49, 51],
    [16, 51, 17],
    [17, 51, 52],
    [17, 52, 18],
    [18, 52, 23],
    [18, 23, 19],
    [19, 23, 26],
    [19, 26, 20],
    [20, 26, 25],
    [20, 25, 21],
    [20, 21, 27],
    [41, 6, 49],
    [41, 5, 6],
    [42, 5, 49],
    [4, 5, 52],
    [3, 4, 52],
    [4, 52, 40],
    [40, 3, 52],
    [2, 3, 40],
    [1, 2, 23],
    [1, 23, 22],
    [0, 1, 22],
    [0, 19, 22],
    [19, 0, 26],
    [53, 54, 55],
    [56, 57, 58],
    [59, 60, 61],
    [62, 63, 64],
    [65, 66, 67],
    [68, 69, 70],
  ];

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !gRef.current) return;
    const svg = svgRef.current;
    const g = gRef.current;
    const { width, height, left, top } = svg.getBoundingClientRect();
    const mouseX = e.clientX - left;
    const mouseY = e.clientY - top;

    const centerX = width / 2;
    const centerY = height / 2;

    const dx = (mouseX - centerX) / centerX;
    const dy = (mouseY - centerY) / centerY;

    const tiltX = dy * -10;
    const tiltY = dx * 10;

    g.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  };

  const handleMouseLeave = () => {
    if (gRef.current) {
      gRef.current.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg)`;
    }
  };

  return (
    <svg
      ref={svgRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      viewBox="0 0 250 270"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0, animation: "fadeIn 0.8s ease-out 0.2s forwards" }}
    >
      <style>
        {`
          @keyframes fadeIn { to { opacity: 1; } }
          @keyframes pulse { 0% { r: 4; opacity: 0.8; } 50% { r: 8; opacity: 1; } 100% { r: 4; opacity: 0.8; } }
          @keyframes slowFloat { 0% { transform: translate(0, 0); } 25% { transform: translate(1px, 2px); } 50% { transform: translate(-1px, -2px); } 75% { transform: translate(1px, -1px); } 100% { transform: translate(0, 0); } }
          @keyframes ping-glow { 0%, 100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.5); opacity: 0; } }
          .pulse-node { animation: pulse 3s infinite ease-in-out; }
          .debris { animation: slowFloat 8s infinite ease-in-out; }
          .animate-ping-glow { animation: ping-glow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
          .plexus-group { transition: transform 0.2s ease-out; }
        `}
      </style>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="coloredBlur" />
          <feMerge>
            {" "}
            <feMergeNode in="coloredBlur" /> <feMergeNode in="SourceGraphic" />{" "}
          </feMerge>
        </filter>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#7df9ff", stopOpacity: 1 }} />
          <stop
            offset="100%"
            style={{ stopColor: "#00ffff", stopOpacity: 1 }}
          />
        </linearGradient>
        <radialGradient id="eyeGlow">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="40%" stopColor="#00ffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g
        ref={gRef}
        filter="url(#glow)"
        className="plexus-group"
        style={{ transformOrigin: "center" }}
      >
        {triangles.map((tri, i) => (
          <polygon
            key={i}
            points={`${points[tri[0]].x},${points[tri[0]].y} ${points[tri[1]].x
              },${points[tri[1]].y} ${points[tri[2]].x},${points[tri[2]].y}`}
            fill="rgba(0, 255, 255, 0.05)"
            stroke="url(#gradient)"
            strokeWidth="0.3"
            className={i >= triangles.length - 6 ? "debris" : ""}
            style={{ animationDelay: `${(i % 6) * 0.5}s` }}
          />
        ))}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1"
            fill="url(#gradient)"
            opacity="0.8"
          />
        ))}
        <circle
          cx="168"
          cy="125"
          r="8"
          fill="url(#eyeGlow)"
          className="pulse-node"
        />
        <circle
          cx="82"
          cy="125"
          r="8"
          fill="url(#eyeGlow)"
          className="pulse-node"
          style={{ animationDelay: "0.5s" }}
        />
      </g>
    </svg>
  );
};
