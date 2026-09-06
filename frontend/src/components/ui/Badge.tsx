import clsx from "clsx";
import type { ReactNode } from "react";

type Tone = "slate" | "green" | "amber" | "red" | "brand";

const toneClasses: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400",
  red: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  brand: "bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400",
};

export function Badge({ tone = "slate", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", toneClasses[tone], className)}>
      {children}
    </span>
  );
}
