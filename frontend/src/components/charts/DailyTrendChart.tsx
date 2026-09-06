import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPoint } from "../../types";
import { formatPaise } from "../../lib/format";
import { useChartPalette } from "../../hooks/useChartPalette";

export function DailyTrendChart({ data }: { data: DailyPoint[] }) {
  const palette = useChartPalette();
  const chartData = data.map((d) => ({ ...d, day: Number(d.date.slice(-2)) }));
  const gradientId = `dailyFill-${palette.sequentialBlue.replace("#", "")}`;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.sequentialBlue} stopOpacity={0.25} />
              <stop offset="100%" stopColor={palette.sequentialBlue} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={palette.chrome.gridline} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: palette.chrome.mutedText }}
            axisLine={{ stroke: palette.chrome.axis }}
            tickLine={false}
            interval={Math.ceil(chartData.length / 10)}
          />
          <YAxis
            tick={{ fontSize: 11, fill: palette.chrome.mutedText }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v === 0 ? "0" : `₹${Math.round(v / 100000) / 10}k`)}
            width={44}
          />
          <Tooltip
            formatter={(value: number) => formatPaise(value)}
            labelFormatter={(label) => `Day ${label}`}
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${palette.chrome.tooltipBorder}`,
              background: palette.chrome.tooltipBg,
              color: palette.chrome.secondaryText,
              fontSize: 13,
            }}
          />
          <Area type="monotone" dataKey="amountPaise" stroke={palette.sequentialBlue} strokeWidth={2} fill={`url(#${gradientId})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
