"use client";

import * as React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface StatusDistributionChartProps {
  complaints: Record<string, unknown>[];
}

interface ComplaintLike {
  status: string;
}

const COLORS = ["#1e3a5f", "#3b5d8a", "#5c7ea0", "#7d9fb6", "#9ec0cd", "#b8d1e5", "#d4e2f0", "#e8edf3", "#f2f6fa"];

export function StatusDistributionChart({ complaints }: StatusDistributionChartProps) {
  const statusMap = new Map<string, number>();
  for (const c of complaints) {
    const cc = c as unknown as ComplaintLike;
    statusMap.set(cc.status, (statusMap.get(cc.status) || 0) + 1);
  }

  const data = Array.from(statusMap.entries()).map(([status, value]) => ({
    status,
    value,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip />
          <Pie
            data={data}
            dataKey="value"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}