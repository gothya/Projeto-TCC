import React from "react";

export const TrophyNavIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path
            fillRule="evenodd"
            d="M5.25 2.25a.75.75 0 0 1 .75.75v1.5h12V3a.75.75 0 0 1 1.5 0v1.5a.75.75 0 0 1-.75.75H18.66c.203.488.34 1.01.34 1.556 0 2.21-1.79 4-4 4h-6c-2.21 0-4-1.79-4-4 0-.546.137-1.068.34-1.556H5.25A2.25 2.25 0 0 1 3 4.5v-1.5A2.25 2.25 0 0 1 5.25 2h13.5zm7.5 12.75a5.485 5.485 0 0 1-5.25-3.843h10.5a5.485 5.485 0 0 1-5.25 3.843z"
            clipRule="evenodd"
        />
        <path d="M9 15.75h6V18h3.75a.75.75 0 0 1 .75.75v.75H4.5v-.75a.75.75 0 0 1 .75-.75H9v-2.25z" />
    </svg>
);
