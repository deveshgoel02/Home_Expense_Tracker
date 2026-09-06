import type { BreakdownItem } from "../../types";
import { formatPaise } from "../../lib/format";
import { PAYMENT_METHODS } from "../../types";
import { EmptyState } from "../ui/EmptyState";
import { Wallet } from "../ui/icons";

function labelFor(key: string) {
  return PAYMENT_METHODS.find((p) => p.value === key)?.label ?? key;
}

export function PaymentMethodBreakdown({ data }: { data: BreakdownItem[] }) {
  if (data.length === 0) {
    return <EmptyState icon={<Wallet className="h-8 w-8" />} title="No expenses recorded yet" />;
  }

  const sorted = [...data].sort((a, b) => b.amountPaise - a.amountPaise);

  return (
    <ul className="space-y-3">
      {sorted.map((item) => {
        const isCredit = item.key === "CREDIT_CARD";
        return (
          <li key={item.key}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className={isCredit ? "font-medium text-amber-700" : "font-medium text-slate-700"}>{labelFor(item.key)}</span>
              <span className="font-semibold text-slate-900">{formatPaise(item.amountPaise)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${isCredit ? "bg-amber-500" : "bg-brand-500"}`}
                style={{ width: `${item.percentOfTotal}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
