"use client";

import * as React from "react";
import { useDemoState } from "@/lib/demo-state-context";
import { MetricCard } from "@/components/ui/dashboard-metrics";
import { BureauWorkloadChart } from "@/components/dashboard/charts/bureau-workload";
import { StatusDistributionChart } from "@/components/dashboard/charts/status-distribution";
import { RecentActivityTable } from "@/components/dashboard/recent-activity";
import { OverlapAlertsWidget } from "@/components/dashboard/overlap-widget";

export function DashboardPage() {
  const { complaints, getMetrics, overlapAlerts } = useDemoState();
  const metrics = getMetrics();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Institution complaint monitoring overview across AICTE bureaus and
            cells — demonstration data updated live within the prototype session.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <MetricCard label="Total Cases" value={metrics.totalCases} trend={{ label: "All registered cases", value: 0, positive: false }} />
        <MetricCard label="Pending Cases" value={metrics.pendingCases} trend={{ label: "Requires action", value: 0, positive: true }} />
        <MetricCard label="Under Process" value={metrics.underProcessCases} trend={{ label: "Active", value: 0, positive: true }} />
        <MetricCard label="Disposed Cases" value={metrics.disposedCases} trend={{ label: "Final", value: 0, positive: true }} />
        <MetricCard label="Transferred Cases" value={metrics.transferredCases} trend={{ label: "Moved", value: 0, positive: false }} />
        <MetricCard label="Overdue Cases" value={metrics.overdueCases} trend={{ label: "Attention needed", value: 0, positive: false }} variant="error" />
        <MetricCard label="Overlap Alerts" value={metrics.overlapAlerts} trend={{ label: "Requires review", value: 0, positive: false }} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <section className="card p-4">
            <h2 className="text-lg font-semibold text-ink mb-4">Bureau-wise Workload</h2>
            <BureauWorkloadChart complaints={complaints as unknown as Record<string, unknown>[]} />
          </section>
          <section className="card p-4">
            <h2 className="text-lg font-semibold text-ink mb-4">Case Status Distribution</h2>
            <StatusDistributionChart complaints={complaints as unknown as Record<string, unknown>[]} />
          </section>
        </div>

        <div className="space-y-4">
          <OverlapAlertsWidget alerts={overlapAlerts as unknown as Record<string, unknown>[]} />
          <section className="card p-4">
            <h2 className="text-lg font-semibold text-ink mb-4">Recent Case Activity</h2>
            <RecentActivityTable cases={complaints as unknown as Record<string, unknown>[]} />
          </section>
        </div>
      </div>
    </>
  );
}

export default DashboardPage;