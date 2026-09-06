import type { ReactNode } from "react";
import clsx from "clsx";
import { ArrowDown, ArrowUp } from "../ui/icons";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  iconBg: string;
  changePercent?: number;
  changeLabel?: string;
  tone?: "default" | "danger";
}

export function StatCard({ label, value, icon, iconBg, changePercent, changeLabel, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={clsx("flex h-9 w-9 items-center justify-center rounded-xl", iconBg)}>{icon}</div>
      </div>
      <p className={clsx("mt-3 text-2xl font-bold tracking-tight", tone === "danger" ? "text-red-600" : "text-slate-900")}>{value}</p>
      {changePercent !== undefined && (
        <div className="mt-2 flex items-center gap-1 text-xs font-medium">
          <span
            className={clsx(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5",
              changePercent >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            )}
          >
            {changePercent >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(changePercent)}%
          </span>
          {changeLabel && <span className="text-slate-400">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}
