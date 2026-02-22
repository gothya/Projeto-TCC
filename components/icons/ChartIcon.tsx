import React from "react";

export const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path
            fillRule="evenodd"
            d="M3 2.25a.75.75 0 0 1 .75.75v16.5h16.5a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75V3a.75.75 0 0 1 .75-.75zM17.25 7.5a.75.75 0 0 1 .75.75v9a.75.75 0 0 1-1.5 0v-9a.75.75 0 0 1 .75-.75zM12 10.5a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0v-6a.75.75 0 0 1 .75-.75zM6.75 13.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75z"
            clipRule="evenodd"
        />
    </svg>
);
