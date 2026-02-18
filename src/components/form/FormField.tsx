import React from "react";

export const FormField: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-cyan-200 text-sm font-bold mb-2">
      {label}
    </label>
    {children}
  </div>
);
