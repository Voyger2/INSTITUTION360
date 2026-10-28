"use client";

import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BureauWorkloadChartProps {
  complaints: Record<string, unknown>[];
}

interface ComplaintLike {
  bureauCode: string;
  status: string;
}

export function BureauWorkloadChart({ complaints }: BureauWorkloadChartProps) {
  const bureauMap = new Map<string, { total: number; active: number }>();
  for (const c of complaints) {
    const cc = c as unknown as ComplaintLike;
    if (!bureauMap.has(cc.bureauCode)) {
      bureauMap.set(cc.bureauCode, { total: 0, active: 0 });
    }
    const b = bureauMap.get(cc.bureauCode)!;
    b.total += 1;
    const active = ["Received", "Under Process", "Action Initiated", "Pending Clarification", "Referred to Bureau"];
    if (active.includes(cc.status)) b.active += 1;
  }

  const data = Array.from(bureauMap.entries()).map(([code, d]) => ({
    bureau: code,
    total: d.total,
    active: d.active,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="bureau" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" fill="#1e3a5f" radius={[2, 2, 0, 0]} />
          <Bar dataKey="active" fill="#3b5d8a" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}