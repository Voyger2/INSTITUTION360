"use client";

import * as React from "react";
import { useDemoState } from "@/lib/demo-state-context";
import { Table } from "@/components/ui/table";
import type { AlertReviewDecision } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/formatting";

export function OverlapsPage() {
  const {
    overlapAlerts,
    updateAlertStatus,
    addToast,
    getCurrentUser,
  } = useDemoState();
  const currentUser = getCurrentUser();
  const canModify = currentUser.role !== "oversight_officer";

  const [openAlertId, setOpenAlertId] = React.useState<string | null>(null);
  const [reviewReason, setReviewReason] = React.useState("");

  const handleReview = (decision: AlertReviewDecision) => {
    if (!openAlertId) return;
    updateAlertStatus(openAlertId, decision, reviewReason, currentUser.id);
    addToast({
      type: "success",
      title: "Alert Reviewed",
      message: `Marked as ${decision.replace("_", " ")}`,
    });
    setOpenAlertId(null);
    setReviewReason("");
  };

  const newAlerts = overlapAlerts.filter((a) => a.alertStatus === "new");
  const reviewedAlerts = overlapAlerts.filter((a) => a.alertStatus !== "new");

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Overlap Alerts</h1>
            <p className="text-sm text-ink-muted">
              Alerts for institutions with multiple active cases across different bureaus/cells.{" "}
              <span className="font-semibold">Human review required — not an automatic determination of duplication.</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="badge-overlap">
              {newAlerts.length} New
            </Badge>
            <Badge className="badge-info">
              {reviewedAlerts.length} Reviewed
            </Badge>
          </div>
        </div>
      </div>

      <div className="table-container">
        <Table
          columns={[
            { key: "institutionName", label: "Institution", sortable: true },
            { key: "aicteId", label: "AICTE Permanent ID", sortable: true },
            { key: "caseIds", label: "Related Cases", sortable: false },
            { key: "bureaus", label: "Involved Bureaus", sortable: false },
            { key: "statuses", label: "Case Statuses", sortable: false },
            { key: "latestAction", label: "Latest Action", sortable: true },
            { key: "alertStatus", label: "Review Status", sortable: false },
            { key: "action", label: "Action", sortable: false },
          ]}
          data={overlapAlerts.map((a) => {
            const alert = a as Record<string, unknown>;
            return {
              ...a,
              aicteId: String(alert.institutionAicteId ?? ""),
              caseIds: Array.isArray(alert.caseIds) ? alert.caseIds.join(", ") : "",
              bureaus: Array.isArray(alert.bureauNames) ? alert.bureauNames.join(", ") : "",
              statuses: Array.isArray(alert.statuses) ? alert.statuses.join(", ") : "",
              latestAction: formatDate(
                Array.isArray(alert.latestActionDates)
                  ? String(alert.latestActionDates[alert.latestActionDates.length - 1] ?? "")
                  : ""
              ),
              alertStatus: (
                <Badge className={`badge-${String(alert.alertStatus) === "new" ? "overlap" : String(alert.alertStatus) === "related" ? "success" : String(alert.alertStatus) === "not_overlapping" ? "error" : "info"}`}>
                  {String(alert.alertStatus).replace("_", " ")}
                </Badge>
              ),
              action: (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOpenAlertId(String(alert.id ?? ""));
                    setReviewReason("");
                  }}
                  disabled={!canModify}
                >
                  Review
                </Button>
              ),
            };
          })}
          rowKey="id"
        />
      </div>

      <div className="mt-4 text-xs text-ink-muted">
        <p>
          <strong>Transparency notice:</strong> Multiple complaints about one institution are not automatically duplicates or conflicting regulatory actions. Each alert requests human review by authorised officials.
        </p>
      </div>

      {openAlertId && (
        <Dialog
          isOpen={!!openAlertId}
          title="Review Overlap Alert"
          description={
            "Select a review decision and provide a reason. This alert does not make any legal or administrative determination."
          }
          onClose={() => setOpenAlertId(null)}
        >
          <div className="space-y-4">
            {(() => {
              const alert = overlapAlerts.find((a) => String(a.id) === openAlertId);
              if (!alert) return null;
              const ca = alert as Record<string, unknown>;
              return (
                <>
                  <p className="text-sm text-ink">
                    <strong>Institution:</strong>{" "}
                    {String(ca.institutionName ?? "")}
                  </p>
                  <p className="text-sm text-ink">
                    <strong>Cases:</strong>{" "}
                    {Array.isArray(ca.caseIds) ? ca.caseIds.join(", ") : ""}
                  </p>
                  <p className="text-sm text-ink">
                    <strong>Bureaus:</strong>{" "}
                    {Array.isArray(ca.bureauNames) ? ca.bureauNames.join(", ") : ""}
                  </p>
                  <p className="text-sm text-ink">
                    <strong>Statuses:</strong>{" "}
                    {Array.isArray(ca.statuses) ? ca.statuses.join(", ") : ""}
                  </p>
                  {Array.isArray(ca.matchReasons) && ca.matchReasons.length > 0 && (
                    <div className="text-sm text-ink">
                      <strong>Why this was detected:</strong>
                      <ul className="list-disc pl-5 mt-1 space-y-0.5">
                        {(ca.matchReasons as string[]).map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink block">Review Decision</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReview("reviewed")}
                  disabled={!canModify}
                >
                  Reviewed
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReview("related")}
                  disabled={!canModify}
                >
                  Related
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReview("not_overlapping")}
                  disabled={!canModify}
                >
                  Not Overlapping
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReview("coordination_required")}
                  disabled={!canModify}
                >
                  Coordination Required
                </Button>
              </div>
            </div>

            {canModify && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ink block">Reason (required)</label>
                <Input
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Explain the review decision..."
                />
              </div>
            )}

            {!canModify && (
              <div className="p-3 bg-info-border text-info rounded-sm">
                <p className="text-xs text-info">
                  Read-only role: You can view alerts but cannot submit review decisions.
                </p>
              </div>
            )}
          </div>
          <div className="dialog-footer">
            <Button variant="ghost" onClick={() => setOpenAlertId(null)}>
              Cancel
            </Button>
            {canModify && (
              <Button
                variant="primary"
                onClick={() => {
                  if (!openAlertId) return;
                  updateAlertStatus(openAlertId, "reviewed", reviewReason, currentUser.id);
                  addToast({
                    type: "success",
                    title: "Alert Reviewed",
                    message: "Marked as reviewed.",
                  });
                  setOpenAlertId(null);
                  setReviewReason("");
                }}
                disabled={!reviewReason}
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