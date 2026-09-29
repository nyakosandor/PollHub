"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PollResult } from "@/types";
import { pluralize } from "@/lib/format";

const BAR_COLOR = "#2a78d6";

interface ResultsChartProps {
  results: PollResult[];
  totalVotes: number;
}

interface TooltipPayloadEntry {
  payload: { name: string; count: number };
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const { name, count } = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-slate-900">{name}</p>
      <p className="text-slate-500">
        {pluralize(count, "vote")}
      </p>
    </div>
  );
}

export default function ResultsChart({ results, totalVotes }: ResultsChartProps) {
  if (totalVotes === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No votes have been cast yet.
      </div>
    );
  }

  const chartData = results
    .map(({ option, count }) => ({ name: option.text, count }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...chartData.map((entry) => entry.count), 1);

  return (
    <div style={{ height: Math.max(chartData.length * 48, 120) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 36, left: 4, bottom: 4 }}
          barCategoryGap={12}
        >
          <CartesianGrid horizontal={false} stroke="#e1e0d9" />
          <XAxis
            type="number"
            domain={[0, maxCount]}
            tick={{ fill: "#898781", fontSize: 12 }}
            axisLine={{ stroke: "#c3c2b7" }}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fill: "#0b0b0b", fontSize: 13 }}
            axisLine={{ stroke: "#c3c2b7" }}
            tickLine={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "rgba(42,120,214,0.06)" }}
          />
          <Bar
            dataKey="count"
            radius={[4, 4, 4, 4]}
            maxBarSize={28}
            fill={BAR_COLOR}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
