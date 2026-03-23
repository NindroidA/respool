"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { MATERIAL_COLORS } from "@/lib/constants";

interface MaterialData {
  material: string;
  grams: number;
}

interface MaterialChartProps {
  data: MaterialData[];
}

export function MaterialChart({ data }: MaterialChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No data yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={70}
          dataKey="grams"
          nameKey="material"
          strokeWidth={0}
        >
          {data.map((entry) => {
            const color = MATERIAL_COLORS[entry.material]?.primary ?? "#71717a";
            return <Cell key={entry.material} fill={color} />;
          })}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            fontSize: "12px",
            fontFamily: "var(--font-geist-mono)",
          }}
          formatter={(value) => [`${value}g`, ""]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
