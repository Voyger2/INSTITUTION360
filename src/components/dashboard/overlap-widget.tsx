"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useDemoState } from "@/lib/demo-state-context";

interface OverlapAlertLike {
  id: string;
  institutionName: string;
  institutionAicteId: string;
  caseIds: string[];
  bureauNames: string[];
  statuses: string[];
  latestActionDates: string[];
  alertStatus: string;
}

interface OverlapAlertsWidgetProps {
  alerts: Record<string, unknown>[];
}

export function OverlapAlertsWidget({ alerts }: OverlapAlertsWidgetProps) {
  const { updateAlertStatus, addToast, getCurrentUser } = useDemoState();
  const currentUser = getCurrentUser();
  const [openAlertId, setOpenAlertId] = React.useState<string | null>(null);

  const typedAlerts = alerts as unknown as OverlapAlertLike[];

  const newAlerts = typedAlerts.filter((a) => a.alertStatus === "new");
  const reviewedAlerts = typedAlerts.filter((a) => a.alertStatus !== "new");

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink">Overlap Alerts Requiring Review</h2>
        <span className="px-2 py-0.5 rounded-sm text-xs font-semibold bg-warning-bg text-warning border border-warning-border">
          {newAlerts.length} new
        </span>
      </div>

      {typedAlerts.length === 0 ? (
        <div className="text-center py-8 text-ink-muted">
          <p>No overlap alerts detected.</p>
          <p className="text-xs text-ink-subtle mt-2">
            Multiple active cases for the same institution across different bureaus will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {newAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between px-3 py-2 border border-border rounded-sm">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink">{alert.institutionName}</p>
                <p className="text-xs text-ink-muted">
                  {alert.institutionAicteId} &bull; {alert.caseIds.join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink-muted">
                  {alert.bureauNames.join(" + ")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpenAlertId(alert.id)}
                >
                  Review
                </Button>
              </div>
            </div>
          ))}

          {reviewedAlerts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                Reviewed
              </h3>
              <div className="space-y-1">
                {reviewedAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between px-3 py-1.5 text-xs">
                    <span className="text-ink-muted">{alert.institutionName}</span>
                    <span className="px-1.5 py-0.5 rounded text-xs font-semibold border">
                      {alert.alertStatus.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {openAlertId && (
        <Dialog
          isOpen={!!openAlertId}
          title="Review Overlap Alert"
          description={
            "Multiple active cases detected for the same institution across different bureaus. " +
            "This does not automatically mean cases are duplicates or conflicting — human review is required."
          }
          onClose={() => setOpenAlertId(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-ink">
              <strong>Institution:</strong>{" "}
              {typedAlerts.find((a) => a.id === openAlertId)?.institutionName}
            </p>
            <p className="text-sm text-ink">
              <strong>Cases:</strong>{" "}
              {typedAlerts.find((a) => a.id === openAlertId)?.caseIds.join(", ")}
            </p>
            <p className="text-sm text-ink">
              <strong>Bureaus:</strong>{" "}
              {typedAlerts.find((a) => a.id === openAlertId)?.bureauNames.join(", ")}
            </p>
            <p className="text-sm text-ink">
              <strong>Statuses:</strong>{" "}
              {typedAlerts.find((a) => a.id === openAlertId)?.statuses.join(", ")}
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink block">Review Decision</label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="ghost" size="sm" onClick={() => {
                  if (!openAlertId) return;
                  updateAlertStatus(openAlertId, "reviewed", "Reviewed by demo user", currentUser.id);
                  addToast({ type: "success", title: "Alert reviewed", message: "Marked as reviewed." });
                  setOpenAlertId(null);
                }}>
                  Reviewed
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  if (!openAlertId) return;
                  updateAlertStatus(openAlertId, "related", "Cases are related", currentUser.id);
                  addToast({ type: "success", title: "Alert marked related", message: "Cases flagged as related." });
                  setOpenAlertId(null);
                }}>
                  Related
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  if (!openAlertId) return;
                  updateAlertStatus(openAlertId, "not_overlapping", "Not overlapping", currentUser.id);
                  addToast({ type: "info", title: "Alert dismissed", message: "Marked as not overlapping." });
                  setOpenAlertId(null);
                }}>
                  Not Overlapping
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  if (!openAlertId) return;
                  updateAlertStatus(openAlertId, "coordination_required", "Coordination needed between bureaus", currentUser.id);
                  addToast({ type: "warning", title: "Coordination flagged", message: "Inter-bureau coordination required." });
                  setOpenAlertId(null);
                }}>
                  Coordination Required
                </Button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </section>
  );
}