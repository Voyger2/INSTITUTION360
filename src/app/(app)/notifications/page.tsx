"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Bell, CalendarClock } from "lucide-react";
import { useDemoState } from "@/lib/demo-state-context";
import { formatDate } from "@/lib/formatting";
import type { OverlapAlert } from "@/types";
import { Table } from "@/components/ui/table";

export default function NotificationsPage() {
  const { complaints, overlapAlerts, config, currentUser } = useDemoState();

  const active = complaints.filter((c) => config.statusDefinitions[c.status]?.isActive);

  const overdue = active.filter((c) => c.isOverdue);

  const dueSoon = active.filter((c) => {
    if (c.isOverdue) return false;
    const days = Math.ceil(
      (new Date(c.expectedDisposalDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return days <= config.deadlineThresholds.warningDays;
  });

  const newAlerts = overlapAlerts.filter(
    (a) => (a as unknown as OverlapAlert).alertStatus === "new"
  );
  const reviewedAlerts = overlapAlerts.filter(
    (a) => (a as unknown as OverlapAlert).alertStatus !== "new"
  );

  const empty =
    overdue.length === 0 && dueSoon.length === 0 && newAlerts.length === 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            In-prototype alerts generated from the current demonstration dataset:
            overdue cases, approaching disposal deadlines and potential overlap
            alerts. No external notifications are sent.
          </p>
        </div>
        <span className="badge badge-info">{currentUser.name} — demo view</span>
      </div>

      {empty ? (
        <div className="card p-5 text-center" role="status">
          <Bell className="h-6 w-6 mx-auto text-ink-subtle" aria-hidden="true" />
          <p className="text-sm text-ink mt-2">
            No active alerts in the demonstration data.
          </p>
          <p className="text-xs text-ink-muted mt-1">
            Overdue and deadline notifications appear here once a case in the
            register crosses a threshold, or when a potential overlap is detected.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-3" aria-labelledby="overdue-heading">
            <h2 id="overdue-heading" className="text-lg font-semibold text-ink flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-error" aria-hidden="true" />
              Overdue active cases ({overdue.length})
            </h2>
            {overdue.length === 0 ? (
              <p className="text-sm text-ink-muted" role="status">
                No overdue active cases.
              </p>
            ) : (
              <div className="table-container">
                <Table
                  columns={[
                    { key: "caseId", label: "Case ID" },
                    { key: "institutionName", label: "Institution" },
                    { key: "bureauName", label: "Bureau" },
                    { key: "status", label: "Status" },
                    { key: "expectedDisposalDate", label: "Disposal deadline" },
                    { key: "daysOverdue", label: "Days overdue" },
                    { key: "action", label: "Action" },
                  ]}
                  data={overdue.map((c) => ({
                    caseId: c.caseId,
                    institutionName: c.institutionName,
                    bureauName: c.bureauName,
                    status: c.status,
                    expectedDisposalDate: formatDate(c.expectedDisposalDate),
                    daysOverdue: <span className="text-error font-medium">{c.daysOverdue}</span>,
                    action: (
                      <Link href={`/complaints/${c.id}`} className="text-primary hover:underline">
                        Open case
                      </Link>
                    ),
                  }))}
                  rowKey="caseId"
                />
              </div>
            )}
          </section>

          <section className="space-y-3" aria-labelledby="due-soon-heading">
            <h2 id="due-soon-heading" className="text-lg font-semibold text-ink flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-warning" aria-hidden="true" />
              Approaching deadlines ({dueSoon.length})
            </h2>
            {dueSoon.length === 0 ? (
              <p className="text-sm text-ink-muted" role="status">
                No active cases are within the {config.deadlineThresholds.warningDays}-day
                warning window of their disposal deadline.
              </p>
            ) : (
              <div className="table-container">
                <Table
                  columns={[
                    { key: "caseId", label: "Case ID" },
                    { key: "institutionName", label: "Institution" },
                    { key: "bureauName", label: "Bureau" },
                    { key: "status", label: "Status" },
                    { key: "deadline", label: "Deadline" },
                    { key: "daysLeft", label: "Days remaining" },
                    { key: "action", label: "Action" },
                  ]}
                  data={dueSoon.map((c) => {
                    const days = Math.max(
                      0,
                      Math.ceil(
                        (new Date(c.expectedDisposalDate).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    );
                    return {
                      caseId: c.caseId,
                      institutionName: c.institutionName,
                      bureauName: c.bureauName,
                      status: c.status,
                      deadline: formatDate(c.expectedDisposalDate),
                      daysLeft: days,
                      action: (
                        <Link href={`/complaints/${c.id}`} className="text-primary hover:underline">
                          Open case
                        </Link>
                      ),
                    };
                  })}
                  rowKey="caseId"
                />
              </div>
            )}
          </section>

          <section className="space-y-3" aria-labelledby="overlap-new-heading">
            <h2 id="overlap-new-heading" className="text-lg font-semibold text-ink flex items-center gap-2">
              <Bell className="h-4 w-4 text-overlap" aria-hidden="true" />
              New overlap alerts ({newAlerts.length})
            </h2>
            {newAlerts.length === 0 ? (
              <p className="text-sm text-ink-muted" role="status">
                All potential overlap alerts have been reviewed.
              </p>
            ) : (
              <div className="table-container">
                <Table
                  columns={[
                    { key: "institutionAicteId", label: "AICTE Permanent ID" },
                    { key: "institutionName", label: "Institution" },
                    { key: "caseIds", label: "Cases" },
                    { key: "bureaus", label: "Bureaus involved" },
                    { key: "action", label: "Action" },
                  ]}
                  data={newAlerts.map((a) => {
                    const alert = a as unknown as OverlapAlert;
                    return {
                      institutionAicteId: alert.institutionAicteId,
                      institutionName: alert.institutionName,
                      caseIds: alert.caseIds.join(", "),
                      bureaus: alert.bureauNames.join(", "),
                      action: (
                        <Link href="/overlaps" className="text-primary hover:underline">
                          Review alerts
                        </Link>
                      ),
                    };
                  })}
                  rowKey="institutionAicteId"
                />
              </div>
            )}
          </section>

          {reviewedAlerts.length > 0 && (
            <p className="text-xs text-ink-muted" aria-live="polite">
              {reviewedAlerts.length} overlap alert
              {reviewedAlerts.length === 1 ? "" : "s"} already carry a review decision
              shown on the <Link href="/overlaps" className="text-primary underline">Overlap Alerts</Link>{" "}
              page.
            </p>
          )}
        </>
      )}
    </>
  );
}
