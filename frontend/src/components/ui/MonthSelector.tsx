import { ChevronDown } from "./icons";
import { MONTH_NAMES } from "../../lib/format";

interface MonthSelectorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthSelector({ month, year, onChange }: MonthSelectorProps) {
  const years = Array.from({ length: 6 }, (_, i) => year - 3 + i);

  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    onChange(m, y);
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
      <button onClick={() => shift(-1)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Previous month">
        <ChevronDown className="h-4 w-4 rotate-90" />
      </button>
      <div className="relative flex items-center gap-1 px-1">
        <select
          value={month}
          onChange={(e) => onChange(Number(e.target.value), year)}
          className="cursor-pointer appearance-none bg-transparent pr-1 text-sm font-semibold text-slate-800 focus:outline-none"
        >
          {MONTH_NAMES.map((name, idx) => (
            <option key={name} value={idx + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => onChange(month, Number(e.target.value))}
          className="cursor-pointer appearance-none bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <button onClick={() => shift(1)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Next month">
        <ChevronDown className="h-4 w-4 -rotate-90" />
      </button>
    </div>
  );
}
