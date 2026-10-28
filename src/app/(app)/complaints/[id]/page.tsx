"use client";

import Link from "next/link";
import { useDemoState } from "@/lib/demo-state-context";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { NotFoundView } from "@/components/portal/not-found-view";
import { formatDate } from "@/lib/formatting";
import type { ComplaintStatus } from "@/types";

export default function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <React.Suspense fallback={<DetailPageFallback />}>
      <ComplaintDetailView params={params} />
    </React.Suspense>
  );
}

function DetailPageFallback() {
  return (
    <div className="card p-5" aria-busy="true">
      <div className="h-6 w-1/3 bg-background rounded-sm mb-4" />
      <div className="h-4 w-1/2 bg-background rounded-sm" />
      <p className="text-sm text-ink-muted mt-4">Loading case details...</p>
    </div>
  );
}

function ComplaintDetailView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const {
    complaints,
    updateComplaintStatus,
    assignOfficer,
    transferCase,
    getCurrentUser,
    canUserChangeComplaint,
    addToast,
    bureaus,
    users,
    getActionHistory,
    getStatusHistory,
    getAssignmentHistory,
  } = useDemoState();
  const currentUser = getCurrentUser();
  const complaint = complaints.find((c) => c.id === React.use(params).id);

  const [statusDialog, setStatusDialog] = React.useState(false);
  const [assignDialog, setAssignDialog] = React.useState(false);
  const [transferDialog, setTransferDialog] = React.useState(false);

  const [newStatus, setNewStatus] = React.useState("");
  const [statusReason, setStatusReason] = React.useState("");
  const [assignOfficerId, setAssignOfficerId] = React.useState("");
  const [assignReason, setAssignReason] = React.useState("");
  const [transferBureau, setTransferBureau] = React.useState("");
  const [transferOfficerId, setTransferOfficerId] = React.useState("");
  const [transferReason, setTransferReason] = React.useState("");

  if (!complaint) {
    return (
      <NotFoundView
        title="We can't find that case"
        entityType="case"
      />
    );
  }

  const canModify = canUserChangeComplaint(complaint);

  const validTransitions: Record<string, string[]> = {
    Received: ["Under Process", "Referred to Bureau", "Rejected"],
    "Under Process": ["Action Initiated", "Pending Clarification", "Referred to Bureau", "Rejected", "Disposed"],
    "Action Initiated": ["Pending Clarification", "Referred to Bureau", "Disposed", "Transferred"],
    "Pending Clarification": ["Under Process", "Rejected", "Disposed"],
    "Referred to Bureau": ["Under Process", "Action Initiated", "Rejected"],
    Transferred: ["Under Process", "Disposed", "Rejected"],
    Disposed: [],
    Rejected: [],
    Closed: [],
  };

  const handleStatusChange = () => {
    const result = updateComplaintStatus(complaint.id, newStatus as ComplaintStatus, currentUser.id, statusReason);
    if (result.success) {
      addToast({ type: "success", title: "Status Updated", message: `Case status changed to ${newStatus}` });
      setStatusDialog(false);
      setNewStatus("");
      setStatusReason("");
    } else {
      addToast({ type: "error", title: "Invalid Transition", message: result.error ?? "Unknown error" });
    }
  };

  const handleAssign = () => {
    const result = assignOfficer(complaint.id, assignOfficerId, currentUser.id, assignReason);
    if (result.success) {
      addToast({ type: "success", title: "Officer Assigned", message: "Case assigned to new officer" });
      setAssignDialog(false);
      setAssignOfficerId("");
      setAssignReason("");
    } else {
      addToast({ type: "error", title: "Assignment Failed", message: result.error ?? "Unknown error" });
    }
  };

  const handleTransfer = () => {
    const result = transferCase(complaint.id, transferBureau, transferOfficerId, transferReason, currentUser.id);
    if (result.success) {
      addToast({ type: "success", title: "Case Transferred", message: "Case transferred to new bureau" });
      setTransferDialog(false);
      setTransferBureau("");
      setTransferOfficerId("");
      setTransferReason("");
    } else {
      addToast({ type: "error", title: "Transfer Failed", message: result.error ?? "Unknown error" });
    }
  };

  const relatedCases = complaints.filter(
    (c) => c.institutionId === complaint.institutionId && c.id !== complaint.id
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Case {complaint.caseId}</h1>
          <p className="text-sm text-ink-muted">
            {complaint.institutionName} &bull; {complaint.institutionAicteId}
          </p>
        </div>
        <div className="flex gap-2">
          {canModify && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setStatusDialog(true)}>
                Update Status
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setAssignDialog(true)}>
                Assign Officer
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setTransferDialog(true)}>
                Transfer Case
              </Button>
            </>
          )}
          <Link href="/complaints" className="btn btn-secondary btn-sm">
            Back to Register
          </Link>
        </div>
      </div>

      {!canModify && (
        <div
          className="p-3 bg-warning-bg border border-warning-border text-warning text-sm rounded-sm"
          role="note"
        >
          Read-only view: the current demo role{" "}
          {currentUser.role === "oversight_officer"
            ? "(Oversight Officer) monitors cases but cannot modify or act on them. "
            : "does not handle this bureau's cases, so case actions are unavailable. "}
          Status changes, assignments and transfers are performed by the owning
          bureau&apos;s officer or the demo System Administrator.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-5">
            <h2 className="text-lg font-semibold text-ink mb-4">Case Details</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <dt className="text-xs font-semibold text-ink-muted uppercase">Complaint Description</dt>
                <dd className="text-sm text-ink">{complaint.description}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Case ID</dt>
                <dd className="text-sm text-ink font-mono">{complaint.caseId}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Institution</dt>
                <dd className="text-sm text-ink">{complaint.institutionName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">AICTE Permanent ID</dt>
                <dd className="text-sm text-ink font-mono">{complaint.institutionAicteId}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Category</dt>
                <dd className="text-sm text-ink">{complaint.category}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Priority</dt>
                <dd className="text-sm text-ink">{complaint.priority}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Bureau/Cell</dt>
                <dd className="text-sm text-ink">{complaint.bureauName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Assigned Officer</dt>
                <dd className="text-sm text-ink">{complaint.assignedOfficerName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Current Status</dt>
                <dd className="text-sm text-ink">
                  <span className={`px-2 py-0.5 rounded-sm text-xs font-semibold border ${
                    complaint.status === "Disposed" || complaint.status === "Rejected" || complaint.status === "Closed"
                      ? "bg-success-bg text-success border-success-border"
                      : complaint.isOverdue
                        ? "bg-error-bg text-error border-error-border"
                        : "bg-primary-light text-primary border-primary"
                  }`}>
                    {complaint.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Date Received</dt>
                <dd className="text-sm text-ink">{formatDate(complaint.receivedDate)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Expected Disposal</dt>
                <dd className={`text-sm text-ink ${complaint.isOverdue ? "font-bold text-error" : ""}`}>
                  {formatDate(complaint.expectedDisposalDate)}
                  {complaint.isOverdue && " <span className='text-error font-bold'> (OVERDUE)</span>"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Last Action Date</dt>
                <dd className="text-sm text-ink">{formatDate(complaint.lastActionDate)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Overdue</dt>
                <dd className={`text-sm font-medium ${complaint.isOverdue ? "text-error" : "text-success"}`}>
                  {complaint.isOverdue ? `Yes — ${complaint.daysOverdue} days overdue` : "No"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-semibold text-ink-muted uppercase">Demo Role Notice</dt>
                <dd className="text-sm text-ink-muted">
                  Current role: <strong>{currentUser.role.replace("_", " ")}</strong>.{" "}
                  {canModify ? "You can modify this case." : "You have read-only access."}
                </dd>
              </div>
            </dl>
          </section>

          {relatedCases.length > 0 && (
            <section className="card p-5">
              <h2 className="text-lg font-semibold text-ink mb-4">Related Cases (Same Institution)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-background border-b border-border">
                      <th className="px-3 py-2 text-left font-semibold text-ink text-xs">Case ID</th>
                      <th className="px-3 py-2 text-left font-semibold text-ink text-xs">Bureau</th>
                      <th className="px-3 py-2 text-left font-semibold text-ink text-xs">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-ink text-xs">Last Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {relatedCases.map((c) => (
                      <tr key={c.id} className="hover:bg-background">
                        <td className="px-3 py-2 text-ink font-medium">{c.caseId}</td>
                        <td className="px-3 py-2 text-ink">{c.bureauName}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-sm text-xs font-semibold border bg-primary-light text-primary border-primary`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-ink-muted">{formatDate(c.lastActionDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="text-lg font-semibold text-ink mb-4">Action History</h2>
            <div className="space-y-3">
              {(() => {
                const statusHist = getStatusHistory(complaint.id).sort(
                  (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
                );
                const assignHist = getAssignmentHistory(complaint.id).sort(
                  (a, b) => new Date(b.transferredAt).getTime() - new Date(a.transferredAt).getTime()
                );
                const actionHist = getActionHistory(complaint.id).sort(
                  (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
                );

                const allEvents = [
                  ...statusHist.map((h) => ({
                    timestamp: h.changedAt,
                    title: `Status changed to ${h.toStatus}`,
                    subtitle: h.reason,
                    type: "status" as const,
                  })),
                  ...assignHist.map((h) => ({
                    timestamp: h.transferredAt,
                    title: `Assigned to ${h.toOfficerName} (${h.toBureauName})`,
                    subtitle: h.transferReason,
                    type: "assignment" as const,
                  })),
                  ...actionHist.map((h) => ({
                    timestamp: h.performedAt,
                    title: h.description,
                    subtitle: "",
                    type: h.actionType,
                  })),
                  {
                    timestamp: complaint.receivedDate,
                    title: "Case received",
                    subtitle: "Complaint registered in the system",
                    type: "received" as const,
                  },
                ];

                allEvents.sort(
                  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );

                if (allEvents.length === 0) {
                  return <p className="text-ink-muted">No history recorded yet.</p>;
                }

                return (
                  <>
                    {allEvents.map((event, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-1 h-1 rounded-full bg-primary mt-2" />
                        <div className="flex-1">
                          <p className="text-sm text-ink font-medium">{event.title}</p>
                          <p className="text-xs text-ink-muted">
                            {event.subtitle ? event.subtitle + " — " : ""}{formatDate(event.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          </section>

          {complaint.isOverdue && (
            <section className="card p-4 border-error-bg border border-error">
              <h3 className="text-sm font-semibold text-error mb-2">Overdue Notice</h3>
              <p className="text-sm text-error">
                This case is {complaint.daysOverdue} days past its expected disposal date. Immediate attention is required.
              </p>
            </section>
          )}
        </div>
      </div>

      {statusDialog && (
        <Dialog
          isOpen={statusDialog}
          title={`Update Status — ${complaint.caseId}`}
          description="Select a new status and provide a reason. Invalid transitions will be rejected."
          onClose={() => setStatusDialog(false)}
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink block">New Status</label>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                options={validTransitions[complaint.status]?.map((s) => ({ value: s, label: s })) || []}
              />
              {validTransitions[complaint.status]?.length === 0 && (
                <p className="text-xs text-error">No valid transitions available from current status.</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink block">Reason</label>
              <Input
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Reason for status change..."
              />
            </div>
            <div className="dialog-footer">
              <Button variant="ghost" onClick={() => setStatusDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleStatusChange}
                disabled={!newStatus || !statusReason}
              >
                Update Status
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {assignDialog && (
        <Dialog
          isOpen={assignDialog}
          title={`Assign Officer — ${complaint.caseId}`}
          description="Assign a bureau officer to this case."
          onClose={() => setAssignDialog(false)}
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink block">Select Officer</label>
              <Select
                value={assignOfficerId}
                onChange={(e) => setAssignOfficerId(e.target.value)}
                options={users
                  .filter((u) => u.role === "bureau_officer")
                  .map((u) => ({ value: u.id, label: `${u.name} (${u.bureauName})` }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink block">Reason</label>
              <Input
                value={assignReason}
                onChange={(e) => setAssignReason(e.target.value)}
                placeholder="Reason for assignment..."
              />
            </div>
            <div className="dialog-footer">
              <Button variant="ghost" onClick={() => setAssignDialog(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAssign} disabled={!assignOfficerId || !assignReason}>
                Assign Officer
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {transferDialog && (
        <Dialog
          isOpen={transferDialog}
          title={`Transfer Case — ${complaint.caseId}`}
          description="Transfer this case to a different bureau or cell."
          onClose={() => setTransferDialog(false)}
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink block">Target Bureau</label>
              <Select
                value={transferBureau}
                onChange={(e) => setTransferBureau(e.target.value)}
                options={bureaus.map((b) => ({ value: b.code, label: b.name }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink block">Target Officer</label>
              <Select
                value={transferOfficerId}
                onChange={(e) => setTransferOfficerId(e.target.value)}
                options={users
                  .filter((u) => u.role === "bureau_officer")
                  .map((u) => ({ value: u.id, label: `${u.name} (${u.bureauName})` }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink block">Transfer Reason</label>
              <Input
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="Reason for transfer..."
              />
            </div>
            <div className="dialog-footer">
              <Button variant="ghost" onClick={() => setTransferDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleTransfer}
                disabled={!transferBureau || !transferOfficerId || !transferReason}
              >
                Transfer Case
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}