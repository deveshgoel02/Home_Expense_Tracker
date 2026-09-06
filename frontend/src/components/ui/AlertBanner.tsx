import type { Alert } from "../../types";
import { AlertTriangle, CheckCircle } from "./icons";
import clsx from "clsx";

const severityStyles: Record<Alert["severity"], { container: string; icon: string }> = {
  info: { container: "bg-emerald-50 border-emerald-200 text-emerald-800", icon: "text-emerald-600" },
  warning: { container: "bg-amber-50 border-amber-200 text-amber-900", icon: "text-amber-600" },
  critical: { container: "bg-red-50 border-red-200 text-red-900", icon: "text-red-600" },
};

export function AlertBanner({ alert }: { alert: Alert }) {
  const styles = severityStyles[alert.severity];
  const Icon = alert.severity === "info" ? CheckCircle : AlertTriangle;
  return (
    <div className={clsx("flex items-start gap-3 rounded-xl border px-4 py-3 text-sm", styles.container)}>
      <Icon className={clsx("mt-0.5 h-5 w-5 flex-shrink-0", styles.icon)} />
      <p>{alert.message}</p>
    </div>
  );
}
