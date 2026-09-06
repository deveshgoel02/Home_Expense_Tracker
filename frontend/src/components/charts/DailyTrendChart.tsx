import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPoint } from "../../types";
import { formatPaise } from "../../lib/format";
import { CHART_CHROME, SEQUENTIAL_BLUE } from "../../lib/chartColors";

export function DailyTrendChart({ data }: { data: DailyPoint[] }) {
  const chartData = data.map((d) => ({ ...d, day: Number(d.date.slice(-2)) }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="dailyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SEQUENTIAL_BLUE} stopOpacity={0.25} />
              <stop offset="100%" stopColor={SEQUENTIAL_BLUE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHART_CHROME.gridline} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: CHART_CHROME.mutedText }}
            axisLine={{ stroke: CHART_CHROME.axis }}
            tickLine={false}
            interval={Math.ceil(chartData.length / 10)}
          />
          <YAxis
            tick={{ fontSize: 11, fill: CHART_CHROME.mutedText }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v === 0 ? "0" : `₹${Math.round(v / 100000) / 10}k`)}
            width={44}
          />
          <Tooltip
            formatter={(value: number) => formatPaise(value)}
            labelFormatter={(label) => `Day ${label}`}
            contentStyle={{ borderRadius: 12, border: "1px solid #e1e0d9", fontSize: 13 }}
          />
          <Area type="monotone" dataKey="amountPaise" stroke={SEQUENTIAL_BLUE} strokeWidth={2} fill="url(#dailyFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
