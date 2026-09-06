import clsx from "clsx";

export function ProgressBar({ percent, tone = "brand" }: { percent: number; tone?: "brand" | "green" | "amber" | "red" }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const toneClasses = {
    brand: "bg-brand-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  }[tone];

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div className={clsx("h-full rounded-full transition-all", toneClasses)} style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function toneForPercent(percent: number): "green" | "amber" | "red" {
  if (percent >= 100) return "red";
  if (percent >= 70) return "amber";
  return "green";
}
