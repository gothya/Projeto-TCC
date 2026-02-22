import React from "react";

export const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M11.47 3.841a.75.75 0 011.06 0l8.99 8.99a.75.75 0 11-1.06 1.06L12 5.43l-8.46 8.46a.75.75 0 01-1.06-1.06l8.99-8.99z" />
        <path d="M5.25 12.38v8.62c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-4.5h1.5v4.5c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-8.62l-6-6-6 6z" />
    </svg>
);
