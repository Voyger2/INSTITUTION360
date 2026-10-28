"use client";

import * as React from "react";
import { useDemoState } from "@/lib/demo-state-context";
import { generateReportData } from "@/lib/formatting";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";

export function ReportsPage() {
  const { complaints, institutions, addToast } = useDemoState();

  const report = generateReportData(complaints, institutions);

  const handleCsvExport = (title: string, headers: string[], rows: string[][]) => {
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast({ type: "success", title: "CSV Exported", message: `${title} downloaded.` });
  };

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <h1 className="text-2xl font-semibold text-ink mb-2">Reports</h1>
        <p className="text-sm text-ink-muted">
          Synthetic-data-based reports for administrative monitoring. All data is demonstration data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card p-5">
          <h2 className="text-lg font-semibold text-ink mb-4">Bureau-wise Case Distribution</h2>
          <div className="table-container">
            <Table
              columns={[
                { key: "bureauCode", label: "Bureau Code" },
                { key: "bureauName", label: "Bureau/Cell Name" },
                { key: "totalCases", label: "Total Cases" },
                { key: "activeCases", label: "Active Cases" },
                { key: "overdueCases", label: "Overdue" },
                { key: "avgDisposalDays", label: "Avg Disposal (days)" },
              ]}
              data={report.bureauWise.map((b) => ({
                ...b,
                avgDisposalDays: b.avgDisposalDays.toString(),
              }))}
              rowKey="bureauCode"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                handleCsvExport(
                  "Bureau-wise Distribution",
                  ["Bureau Code", "Bureau Name", "Total Cases", "Active Cases", "Overdue", "Avg Disposal Days"],
                  report.bureauWise.map((b) => [
                    b.bureauCode,
                    b.bureauName,
                    b.totalCases.toString(),
                    b.activeCases.toString(),
                    b.overdueCases.toString(),
                    b.avgDisposalDays.toString(),
                  ])
                )
              }
            >
              Export CSV
            </Button>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-semibold text-ink mb-4">Status-wise Distribution</h2>
          <div className="table-container">
            <Table
              columns={[
                { key: "status", label: "Status" },
                { key: "count", label: "Count" },
                { key: "percentage", label: "Percentage" },
              ]}
              data={report.statusWise.map((s) => ({
                ...s,
                percentage: `${s.percentage}%`,
              }))}
              rowKey="status"
            />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card p-5">
          <h2 className="text-lg font-semibold text-ink mb-4">Region-wise Case Distribution</h2>
          <div className="table-container">
            <Table
              columns={[
                { key: "regionCode", label: "Region Code" },
                { key: "regionName", label: "Region Name" },
                { key: "totalCases", label: "Total Cases" },
                { key: "activeCases", label: "Active Cases" },
                { key: "overdueCases", label: "Overdue" },
              ]}
              data={report.regionWise as unknown as Record<string, unknown>[]}
              rowKey="regionCode"
            />
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-semibold text-ink mb-4">Pending Case Ageing</h2>
          <div className="table-container">
            <Table
              columns={[
                { key: "bucket", label: "Ageing Bucket" },
                { key: "count", label: "Count" },
              ]}
              data={report.pendingAgeing}
              rowKey="bucket"
            />
          </div>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="text-lg font-semibold text-ink mb-4">Overdue Cases</h2>
        {report.overdueCases.length === 0 ? (
          <p className="text-ink-muted">No overdue cases.</p>
        ) : (
          <div className="table-container">
            <Table
              columns={[
                { key: "caseId", label: "Case ID" },
                { key: "institutionName", label: "Institution" },
                { key: "bureauName", label: "Bureau" },
                { key: "status", label: "Status" },
                { key: "expectedDisposalDate", label: "Expected Disposal" },
                { key: "daysOverdue", label: "Days Overdue" },
              ]}
              data={report.overdueCases.map((c) => ({
                ...c,
                daysOverdue: c.daysOverdue.toString(),
              }))}
              rowKey="id"
            />
          </div>
        )}
        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              handleCsvExport(
                "Overdue Cases",
                ["Case ID", "Institution", "Bureau", "Status", "Expected Disposal", "Days Overdue"],
                report.overdueCases.map((c) => [
                  c.caseId,
                  c.institutionName,
                  c.bureauName,
                  c.status,
                  c.expectedDisposalDate,
                  c.daysOverdue.toString(),
                ])
              )
            }
          >
            Export CSV
          </Button>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold text-ink mb-4">Institution-wise Case History</h2>
        <div className="table-container">
          <Table
            columns={[
              { key: "institutionName", label: "Institution" },
              { key: "totalCases", label: "Total Cases" },
              { key: "activeCases", label: "Active Cases" },
              { key: "disposedCases", label: "Disposed Cases" },
            ]}
            data={report.institutionWise}
            rowKey="institutionId"
          />
        </div>
      </section>
    </div>
  );
}

export default ReportsPage;