"use client";

import * as React from "react";
import Link from "next/link";
import { useDemoState } from "@/lib/demo-state-context";
import { Table } from "@/components/ui/table";
import type { AlertReviewDecision, AlertStatus, OverlapAlert } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/formatting";

const ALERT_STATUS_CLASS: Record<AlertStatus, string> = {
  new: "badge-overlap",
  reviewed: "badge-success",
  related: "badge-info",
  not_overlapping: "badge-primary",
  coordination_required: "badge-warning",
};

const ALERT_STATUS_LABEL: Record<AlertStatus, string> = {
  new: "Pending review",
  reviewed: "Reviewed",
  related: "Related",
  not_overlapping: "Not overlapping",
  coordination_required: "Coordination required",
};

const DECISIONS: { value: AlertReviewDecision; label: string }[] = [
  { value: "reviewed", label: "Reviewed" },
  { value: "related", label: "Related" },
  { value: "not_overlapping", label: "Not overlapping" },
  { value: "coordination_required", label: "Coordination required" },
];

export function OverlapsPage() {
  const { overlapAlerts, complaints, users, updateAlertStatus, addToast, getCurrentUser } =
    useDemoState();
  const currentUser = getCurrentUser();
  const canModify = currentUser.role !== "oversight_officer";

  const alerts = overlapAlerts as unknown as OverlapAlert[];
  const [openAlertId, setOpenAlertId] = React.useState<string | null>(null);
  const [reviewReason, setReviewReason] = React.useState("");
  const [decision, setDecision] = React.useState<AlertReviewDecision | null>(null);

  const complaintIdByCaseId = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of complaints) map.set(c.caseId, c.id);
    return map;
  }, [complaints]);

  const countByStatus = (status: AlertStatus) =>
    alerts.filter((a) => a.alertStatus === status).length;

  const openAlert = openAlertId
    ? alerts.find((a) => a.id === openAlertId)
    : undefined;

  const resetDialog = () => {
    setOpenAlertId(null);
    setReviewReason("");
    setDecision(null);
  };

  const handleSubmit = () => {
    if (!openAlertId || !decision || !reviewReason.trim()) return;
    updateAlertStatus(openAlertId, decision, reviewReason.trim(), currentUser.id);
    addToast({
      type: "success",
      title: "Alert reviewed",
      message: `Marked as ${ALERT_STATUS_LABEL[decision].toLowerCase()}.`,
    });
    resetDialog();
  };

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Overlap Alerts</h1>
            <p className="text-sm text-ink-muted">
              Institutions with active cases open in more than one bureau or cell, flagged for
              human review under the shared AICTE Permanent ID rule.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={ALERT_STATUS_CLASS.new}>
              {countByStatus("new")} Pending review
            </Badge>
            <Badge className={ALERT_STATUS_CLASS.reviewed}>
              {countByStatus("reviewed")} Reviewed
            </Badge>
            <Badge className={ALERT_STATUS_CLASS.related}>
              {countByStatus("related")} Related
            </Badge>
            <Badge className={ALERT_STATUS_CLASS.not_overlapping}>
              {countByStatus("not_overlapping")} Not overlapping
            </Badge>
            <Badge className={ALERT_STATUS_CLASS.coordination_required}>
              {countByStatus("coordination_required")} Coordination required
            </Badge>
          </div>
        </div>
      </div>

      <div className="table-container">
        <Table
          columns={[
            { key: "institutionName", label: "Institution", sortable: false },
            { key: "aicteId", label: "AICTE Permanent ID", sortable: false },
            { key: "caseIds", label: "Related Cases", sortable: false },
            { key: "bureaus", label: "Involved Bureaus", sortable: false },
            { key: "statuses", label: "Case Statuses", sortable: false },
            { key: "latestAction", label: "Latest Action", sortable: false },
            { key: "alertStatus", label: "Review Status", sortable: false },
            { key: "action", label: "Action", sortable: false },
          ]}
          data={alerts.map((alert) => ({
            id: alert.id,
            institutionName: (
              <Link
                href={`/institutions/${alert.institutionId}`}
                className="font-medium text-primary hover:underline"
              >
                {alert.institutionName}
              </Link>
            ),
            aicteId: (
              <span className="font-mono text-xs">{alert.institutionAicteId}</span>
            ),
            caseIds: (
              <span className="flex flex-wrap gap-x-2 gap-y-1">
                {alert.caseIds.map((caseId) => {
                  const complaintId = complaintIdByCaseId.get(caseId);
                  return complaintId ? (
                    <Link
                      key={caseId}
                      href={`/complaints/${complaintId}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {caseId}
                    </Link>
                  ) : (
                    <span key={caseId} className="font-mono text-xs">
                      {caseId}
                    </span>
                  );
                })}
              </span>
            ),
            bureaus: alert.bureauNames.join(", "),
            statuses: alert.statuses.join(", "),
            latestAction: formatDate(
              alert.latestActionDates[alert.latestActionDates.length - 1] ?? ""
            ),
            alertStatus: (
              <Badge className={ALERT_STATUS_CLASS[alert.alertStatus]}>
                {ALERT_STATUS_LABEL[alert.alertStatus]}
              </Badge>
            ),
            action: (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpenAlertId(alert.id);
                  setReviewReason(alert.reviewReason ?? "");
                  setDecision(null);
                }}
              >
                {alert.alertStatus === "new" ? "Review" : "View"}
              </Button>
            ),
          }))}
          rowKey="id"
        />
      </div>

      <p className="text-xs text-ink-muted">
        <strong>Human review notice:</strong> multiple complaints about one institution are not
        automatically duplicates or conflicting regulatory actions. Each alert requests human
        review by authorised officials; detection is rule-based, not automated decision-making.
      </p>

      {openAlert && (
        <Dialog
          isOpen={!!openAlert}
          title="Review Overlap Alert"
          description="Record a review decision with a reason. This does not make any legal or administrative determination."
          onClose={resetDialog}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-ink">
              <p>
                <strong>Institution:</strong>{" "}
                <Link
                  href={`/institutions/${openAlert.institutionId}`}
                  className="text-primary hover:underline"
                >
                  {openAlert.institutionName}
                </Link>
              </p>
              <p>
                <strong>AICTE Permanent ID:</strong>{" "}
                <span className="font-mono text-xs">{openAlert.institutionAicteId}</span>
              </p>
              <p>
                <strong>Bureaus:</strong> {openAlert.bureauNames.join(", ")}
              </p>
              <p>
                <strong>Statuses:</strong> {openAlert.statuses.join(", ")}
              </p>
              <p className="sm:col-span-2">
                <strong>Cases:</strong>{" "}
                {openAlert.caseIds.map((caseId, i) => {
                  const complaintId = complaintIdByCaseId.get(caseId);
                  return (
                    <React.Fragment key={caseId}>
                      {i > 0 && ", "}
                      {complaintId ? (
                        <Link
                          href={`/complaints/${complaintId}`}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {caseId}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs">{caseId}</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </p>
            </div>

            <div className="text-sm text-ink">
              <strong>Why this was detected:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                {openAlert.matchReasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>

            {openAlert.alertStatus !== "new" && (
              <div className="rounded-sm border border-border bg-background p-3 text-xs text-ink-muted space-y-1">
                <p>
                  <strong className="text-ink">Current review status:</strong>{" "}
                  <Badge className={ALERT_STATUS_CLASS[openAlert.alertStatus]}>
                    {ALERT_STATUS_LABEL[openAlert.alertStatus]}
                  </Badge>
                </p>
                {openAlert.reviewReason && (
                  <p>
                    <strong className="text-ink">Recorded reason:</strong>{" "}
                    {openAlert.reviewReason}
                  </p>
                )}
                {openAlert.reviewedBy && (
                  <p>
                    <strong className="text-ink">Reviewed by:</strong>{" "}
                    {users.find((u) => u.id === openAlert.reviewedBy)?.name ??
                      openAlert.reviewedBy}
                    {openAlert.reviewedAt ? ` on ${formatDate(openAlert.reviewedAt)}` : ""}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <span className="text-xs font-semibold text-ink block">Review Decision</span>
              <div className="grid grid-cols-2 gap-2">
                {DECISIONS.map((d) => (
                  <Button
                    key={d.value}
                    variant={decision === d.value ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setDecision(d.value)}
                    disabled={!canModify}
                    aria-pressed={decision === d.value}
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
            </div>

            {canModify ? (
              <div className="space-y-1">
                <label htmlFor="review-reason" className="text-xs font-semibold text-ink block">
                  Reason (required)
                </label>
                <Input
                  id="review-reason"
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Explain the review decision..."
                />
              </div>
            ) : (
              <p className="rounded-sm border border-info-border bg-info-bg p-3 text-xs text-info">
                Read-only role: you can view alerts and their review history but cannot submit
                review decisions.
              </p>
            )}
          </div>
          <div className="dialog-footer">
            <Button variant="ghost" onClick={resetDialog}>
              Cancel
            </Button>
            {canModify && (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!decision || !reviewReason.trim()}
              >
                Submit Review
              </Button>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default OverlapsPage;
