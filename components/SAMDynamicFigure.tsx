import React from "react";

export const SAMDynamicFigure: React.FC<{
  type: "pleasure" | "arousal" | "dominance";
  value: number;
}> = ({ type, value }) => {

  let img_name = 'valencia';
  if (type === 'arousal') img_name = 'ativacao';
  if (type === 'dominance') img_name = 'dominancia';

  return (
    <img src={`/${img_name}_${value}.png`} alt={type} />
  );
};
git 