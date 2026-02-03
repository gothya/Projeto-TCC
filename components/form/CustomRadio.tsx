export const CustomRadio = ({
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
  onChange: (name: string, value: string) => void;
}) => (
  <label className="flex items-center space-x-3 cursor-pointer group text-gray-100 hover:text-white">
    <span
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${checked
          ? "border-cyan-400"
          : "border-gray-400 group-hover:border-cyan-500"
        }`}
    >
      {checked && (
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
      )}
    </span>
    <span>{label}</span>
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={() => onChange(name, value)}
      className="sr-only"
    />
  </label>
);
