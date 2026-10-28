"use client";

import * as React from "react";

interface MetricCardProps {
  label: string;
  value: number | string;
  trend?: { label: string; value: number; positive: boolean };
  variant?: "default" | "error" | "warning";
}

export function MetricCard({
  label,
  value,
  trend,
  variant = "default",
}: MetricCardProps) {
  const variantClasses = {
    default: "border-border",
    error: "border-error",
    warning: "border-warning",
  };

  const trendColor = trend?.positive
    ? "text-success"
    : trend?.value === 0
      ? "text-ink-muted"
      : "text-error";

  return (
    <div className={`metric-card p-5 rounded-md ${variantClasses[variant]}`}>
      <p className="metric-label text-sm">{label}</p>
      <p className="metric-value text-2xl font-bold text-ink">{value}</p>
      {trend && (
        <p className={`metric-trend mt-2 text-xs font-medium ${trendColor}`}>
          {trend.label}
        </p>
      )}
    </div>
  );
}

export function MetricValue({ children }: { children: React.ReactNode }) {
  return <span className="text-2xl font-bold text-ink">{children}</span>;
}

export function MetricLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm text-ink-muted">{children}</span>;
}

export function MetricTrend({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium">{children}</span>;
}