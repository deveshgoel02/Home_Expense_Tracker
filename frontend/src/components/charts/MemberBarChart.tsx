import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BreakdownItem } from "../../types";
import { formatPaise } from "../../lib/format";
import { useChartPalette } from "../../hooks/useChartPalette";
import { EmptyState } from "../ui/EmptyState";
import { Users } from "../ui/icons";

export function MemberBarChart({ data }: { data: BreakdownItem[] }) {
  const palette = useChartPalette();

  if (data.length === 0) {
    return <EmptyState icon={<Users className="h-8 w-8" />} title="No expenses recorded yet" />;
  }

  const chartData = [...data].sort((a, b) => b.amountPaise - a.amountPaise);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={palette.chrome.gridline} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: palette.chrome.mutedText }}
            axisLine={{ stroke: palette.chrome.axis }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: palette.chrome.mutedText }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${Math.round(v / 100000) / 10}k`}
            width={44}
          />
          <Tooltip
            formatter={(value: number) => formatPaise(value)}
            cursor={{ fill: "rgba(42,120,214,0.06)" }}
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${palette.chrome.tooltipBorder}`,
              background: palette.chrome.tooltipBg,
              color: palette.chrome.secondaryText,
              fontSize: 13,
            }}
          />
          <Bar dataKey="amountPaise" fill={palette.sequentialBlue} radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
