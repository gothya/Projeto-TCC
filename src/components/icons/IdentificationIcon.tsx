export const IdentificationIcon = ({
  className = "",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {" "}
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>{" "}
    <path d="M7 12h2" /> <path d="M7 16h5" /> <path d="M13 16h4" />{" "}
    <path d="M14 11V7h-4v4"></path>{" "}
  </svg>
);
