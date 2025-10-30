import { type ChangeEvent } from "react";

interface DimensionInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

export const DimensionInput = ({
  label,
  value,
  onChange,
  min,
  max,
}: DimensionInputProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const numValue = Number(event.target.value);
    let validatedValue = numValue;
    
    if (isNaN(numValue) || numValue < min) {
      validatedValue = min;
    } else if (numValue > max) {
      validatedValue = max;
    } else {
      validatedValue = numValue;
    }
    
    onChange(validatedValue);
  };

  return (
    <label className="flex flex-col gap-2 text-sm text-slate-300">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring focus:ring-sky-500/20"
      />
      <span className="text-xs text-slate-500">Max: {max}</span>
    </label>
  );
};

interface SeedInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const SeedInput = ({ value, onChange }: SeedInputProps) => {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-300">
      Seed (optional)
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Random each time"
        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring focus:ring-sky-500/20"
      />
    </label>
  );
};

