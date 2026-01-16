import React from "react";

export const SAMDynamicFigure: React.FC<{
  type: "pleasure" | "arousal" | "dominance";
  value: number;
}> = ({ type, value }) => {

  return (
    <img src={`/valencia_${value}.png`} alt={type} />
  );
};
