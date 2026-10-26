"use client";

import * as React from "react";
import { formatDate } from "@/lib/formatting";

interface ComplaintLike {
  id: string;
  caseId: string;
  institutionName: string;
  bureauName: string;
  status: string;
  lastActionDate: string;
  isOverdue: boolean;
}

interface RecentActivityTableProps {
  cases: Record<string, unknown>[];
}

export function RecentActivityTable({ cases }: RecentActivityTableProps) {
  const typedCases = cases as unknown as ComplaintLike[];

  if (typedCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-ink-muted">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-background border-b border-border">
            <th className="px-3 py-2 text-left font-semibold text-ink text-xs">Case ID</th>
            <th className="px-3 py-2 text-left font-semibold text-ink text-xs">Institution</th>
            <th className="px-3 py-2 text-left font-semibold text-ink text-xs">Bureau</th>
            <th className="px-3 py-2 text-left font-semibold text-ink text-xs">Status</th>
            <th className="px-3 py-2 text-left font-semibold text-ink text-xs">Last Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {typedCases.map((c) => (
            <tr key={c.id} className="hover:bg-background">
              <td className="px-3 py-2 text-ink font-medium">{c.caseId}</td>
              <td className="px-3 py-2 text-ink">{c.institutionName}</td>
              <td className="px-3 py-2 text-ink-muted">{c.bureauName}</td>
              <td className="px-3 py-2">
                <span className={`px-2 py-0.5 rounded-sm text-xs font-semibold border ${
                  c.status === "Disposed" || c.status === "Rejected" || c.status === "Closed"
                    ? "bg-success-bg text-success border border-success-border"
                    : c.isOverdue
                      ? "bg-error-bg text-error border border-error-border"
                      : "bg-primary-light text-primary border border-primary"
                }`}>
                  {c.status}
                </span>
              </td>
              <td className="px-3 py-2 text-ink-muted">{formatDate(c.lastActionDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}