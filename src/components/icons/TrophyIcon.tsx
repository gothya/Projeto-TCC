export const TrophyIcon = ({
  className = "",
  rank,
}: {
  className?: string;
  rank: number;
}) => {
  const colorClass =
    { 1: "text-yellow-400", 2: "text-gray-300", 3: "text-orange-400" }[rank] ||
    "text-gray-500";
  return (
    <svg
      className={`${className} ${colorClass}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {" "}
      <path d="M12 2C8.686 2 6 4.686 6 8c0 2.21 1.79 4 4 4h4c2.21 0 4-1.79 4-4 0-3.314-2.686-6-6-6zm0 14c-2.21 0-4 1.79-4 4h8c0-2.21-1.79-4-4-4zm0-10c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2zM6 20h12v2H6v-2z" />{" "}
    </svg>
  );
};
