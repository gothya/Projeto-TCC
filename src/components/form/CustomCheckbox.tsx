import React from "react";

export const CustomCheckbox = ({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) => (
  <label className="flex items-center space-x-3 cursor-pointer group text-gray-100 hover:text-white">
    <span
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${checked
          ? "border-cyan-400 bg-cyan-400"
          : "border-gray-400 group-hover:border-cyan-500"
        }`}
    >
      {checked && (
        <svg
          className="w-3 h-3 text-brand-dark"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}
    </span>
    <span>{label}</span>
    <input
      type="checkbox"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
  </label>
);
