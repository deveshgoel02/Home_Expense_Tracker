import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { BreakdownItem } from "../../types";
import { formatPaise } from "../../lib/format";
import { CATEGORICAL, OTHER_SLICE_COLOR } from "../../lib/chartColors";
import { EmptyState } from "../ui/EmptyState";
import { ChartBar } from "../ui/icons";

const MAX_SLICES = 6;

export function CategoryDonutChart({ data }: { data: BreakdownItem[] }) {
  if (data.length === 0) {
    return <EmptyState icon={<ChartBar className="h-8 w-8" />} title="No expenses recorded yet" />;
  }

  const top = data.slice(0, MAX_SLICES);
  const rest = data.slice(MAX_SLICES);
  const otherAmount = rest.reduce((s, i) => s + i.amountPaise, 0);
  const chartData = [
    ...top.map((d) => ({ name: d.label, value: d.amountPaise, percent: d.percentOfTotal })),
    ...(otherAmount > 0
      ? [{ name: "Other", value: otherAmount, percent: rest.reduce((s, i) => s + i.percentOfTotal, 0) }]
      : []),
  ];

  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2} stroke="none">
              {chartData.map((entry, idx) => (
                <Cell key={entry.name} fill={idx < top.length ? CATEGORICAL[idx % CATEGORICAL.length] : OTHER_SLICE_COLOR} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [formatPaise(value), name]}
              contentStyle={{ borderRadius: 12, border: "1px solid #e1e0d9", fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {chartData.map((entry, idx) => (
          <li key={entry.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: idx < top.length ? CATEGORICAL[idx % CATEGORICAL.length] : OTHER_SLICE_COLOR }}
              />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="flex-shrink-0 font-medium text-slate-800">{formatPaise(entry.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
