"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CHART_TOOLTIP_STYLE } from "./chart-styles";

interface UsageData {
  week: string;
  grams: number;
}

interface UsageChartProps {
  data: UsageData[];
}

export function UsageChart({ data }: UsageChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No usage data yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barSize={20}>
        <XAxis
          dataKey="week"
          tick={{ fill: "var(--text-faint)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--text-faint)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            ...CHART_TOOLTIP_STYLE,
            fontFamily: "var(--font-geist-mono)",
          }}
          formatter={(value) => [`${value}g`, "Usage"]}
        />
        <Bar dataKey="grams" fill="var(--accent-jade)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
