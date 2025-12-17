import React from "react";

export const SAMDynamicFigure: React.FC<{
  type: "pleasure" | "arousal" | "dominance";
  value: number;
}> = ({ type, value }) => {
  // A cute ghost-like character shape
  const bodyPath = "M20,80 C10,70 10,30 50,20 C90,30 90,70 80,80 Z";

  // Normalize value from 1-9 to 0-1
  const normalizedValue = (value - 1) / 8;

  let content;

  if (type === "pleasure") {
    // Mouth goes from frown to smile. 1=frown, 9=smile.
    const mouthY = 68;
    const mouthControlY = mouthY + 15 * (0.5 - normalizedValue) * 2;
    const mouthPath = `M 35,${mouthY} Q 50,${mouthControlY} 65,${mouthY}`;

    // Cheeks for happy states
    const cheekOpacity = Math.max(0, (normalizedValue - 0.6) / 0.4);

    content = (
      <>
        <path d={bodyPath} />
        <path d={mouthPath} strokeWidth="3" fill="none" />
        <circle cx="40" cy="50" r="5" fill="currentColor" />
        <circle cx="60" cy="50" r="5" fill="currentColor" />
        {cheekOpacity > 0 && (
          <>
            <ellipse
              cx="30"
              cy="60"
              rx="5"
              ry="3"
              fill="currentColor"
              opacity={cheekOpacity}
              className="text-cyan-200/50"
            />
            <ellipse
              cx="70"
              cy="60"
              rx="5"
              ry="3"
              fill="currentColor"
              opacity={cheekOpacity}
              className="text-cyan-200/50"
            />
          </>
        )}
      </>
    );
  } else if (type === "arousal") {
    // Eyes open from sleepy slits to wide circles. 1=sleepy, 9=wide.
    const eyeRadius = 1.5 + normalizedValue * 5.5;
    const mouthPath = "M 35,70 Q 50,72 65,70"; // A neutral mouth

    content = (
      <>
        <path d={bodyPath} />
        <path d={mouthPath} strokeWidth="3" fill="none" />
        {value < 3 ? ( // Sleepy eyes for low arousal
          <>
            <path d="M 35 50 H 45" strokeWidth="3" />
            <path d="M 55 50 H 65" strokeWidth="3" />
          </>
        ) : (
          // Circular eyes for mid-to-high arousal
          <>
            <circle cx="40" cy="50" r={eyeRadius} fill="currentColor" />
            <circle cx="60" cy="50" r={eyeRadius} fill="currentColor" />
          </>
        )}
        {/* "Electric" zigzags for high arousal */}
        {value > 7 && (
          <path
            d="M5,40 L15,50 L5,60"
            strokeWidth="2"
            opacity={0.3 + (normalizedValue - 0.75) * 2}
            transform={`rotate(${(value - 7) * 5} 10 50)`}
          />
        )}
        {value > 7 && (
          <path
            d="M95,40 L85,50 L95,60"
            strokeWidth="2"
            opacity={0.3 + (normalizedValue - 0.75) * 2}
            transform={`rotate(${-(value - 7) * 5} 90 50)`}
          />
        )}
      </>
    );
  } else {
    // dominance
    // Character grows from small to large. 1=small, 9=large.
    const scale = 0.6 + normalizedValue * 0.5;
    const x = 50 - 50 * scale;
    const y = 80 - 80 * scale;
    const transform = `translate(${x}, ${y}) scale(${scale})`;

    // Eyebrows for dominance. 1=submissive (up), 9=dominant (down/angry)
    const eyebrowY1 = 42 + 5 * normalizedValue;
    const eyebrowY2 = 42 - 5 * normalizedValue;

    content = (
      <g transform={transform}>
        <path d={bodyPath} />
        <path d="M 35,70 Q 50,68 65,70" strokeWidth="3" fill="none" />
        <circle cx="40" cy="50" r="5" fill="currentColor" />
        <circle cx="60" cy="50" r="5" fill="currentColor" />
        <path d={`M 32,${eyebrowY1} L 48,${eyebrowY2}`} strokeWidth="3" />
        <path d={`M 68,${eyebrowY1} L 52,${eyebrowY2}`} strokeWidth="3" />
      </g>
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full transition-all duration-300 ease-in-out"
    >
      <g
        fill="rgba(0, 255, 255, 0.1)"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-cyan-300"
      >
        {content}
      </g>
    </svg>
  );
};
