"use client";

import * as React from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useDemoState } from "@/lib/demo-state-context";
import { formatDate } from "@/lib/formatting";
import type { AssignmentHistory, StatusHistory, ActionHistory } from "@/types";
import { Table } from "@/components/ui/table";

interface AuditRow {
  id: string;
  at: string;
  entryType: "Status change" | "Assignment" | "Transfer" | "Action";
  complaintId: string;
  caseId: string;
  actor: string;
  description: string;
}

const ENTRY_TYPE_ORDER: AuditRow["entryType"][] = [
  "Action",
  "Status change",
  "Assignment",
  "Transfer",
];

export default function AuditLogPage() {
  const {
    getActionHistory,
    getStatusHistory,
    getAssignmentHistory,
    complaints,
  } = useDemoState();

  const caseIdById = new Map(complaints.map((c) => [c.id, c.caseId]));

  const rows: AuditRow[] = (() => {
    const out: AuditRow[] = [];

    const actions = getActionHistory() as ActionHistory[];
    for (const a of actions) {
      out.push({
        id: a.id,
        at: a.performedAt,
        entryType: "Action",
        complaintId: a.complaintId,
        caseId: caseIdById.get(a.complaintId) ?? "—",
        actor: a.performedBy || "—",
        description: a.description,
      });
    }

    const statuses = getStatusHistory() as StatusHistory[];
    for (const s of statuses) {
      out.push({
        id: s.id,
        at: s.changedAt,
        entryType: "Status change",
        complaintId: s.complaintId,
        caseId: caseIdById.get(s.complaintId) ?? "—",
        actor: s.changedBy || "—",
        description: `Status “${s.fromStatus ?? "—"}” → “${s.toStatus}”. Reason: ${s.reason || "<none given>"}`,
      });
    }

    const assignments = getAssignmentHistory() as AssignmentHistory[];
    for (const h of assignments) {
      const isTransfer = h.fromBureauCode !== h.toBureauCode;
      out.push({
        id: h.id,
        at: h.transferredAt,
        entryType: isTransfer ? "Transfer" : "Assignment",
        complaintId: h.complaintId,
        caseId: caseIdById.get(h.complaintId) ?? "—",
        actor: h.transferredBy || "—",
        description: isTransfer
          ? `${h.fromBureauName ?? "—"} (${h.fromOfficerName ?? "unassigned"}) → ${h.toBureauName} (${h.toOfficerName}). Reason: ${h.transferReason || "<none given>"}`
          : `Assigned to ${h.toOfficerName} (${h.toBureauName}). Reason: ${h.transferReason || "<none given>"}`,
      });
    }

    return out;
  })();

  const [typeFilter, setTypeFilter] = React.useState("");
  const [caseFilter, setCaseFilter] = React.useState("");

  const filtered = rows
    .filter((r) => !typeFilter || r.entryType === typeFilter)
    .filter((r) => !caseFilter || r.complaintId === caseFilter)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit log</h1>
          <p className="page-subtitle">
            Chronological record of actions taken inside this demo session while
            using the prototype: status changes, officer assignments, bureau
            transfers and general case actions.
          </p>
        </div>
        <span className="badge badge-info">
          {rows.length} demo entr{rows.length === 1 ? "y" : "ies"}
        </span>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="audit-type" className="label">
              Filter by entry type
            </label>
            <select
              id="audit-type"
              className="select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              {ENTRY_TYPE_ORDER.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="audit-case" className="label">
              Filter by case
            </label>
            <select
              id="audit-case"
              className="select"
              value={caseFilter}
              onChange={(e) => setCaseFilter(e.target.value)}
            >
              <option value="">All cases</option>
              {complaints.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseId} — {c.institutionName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card p-5 text-center" role="status">
          <ClipboardList className="h-6 w-6 mx-auto text-ink-subtle" aria-hidden="true" />
          <p className="text-sm text-ink mt-2">
            The audit log is empty — no demo actions have been recorded yet.
          </p>
          <p className="text-xs text-ink-muted mt-1">
            Open any complaint and change its status, assign an officer or transfer
            the case; every action performed in this session appears here.
          </p>
          <Link href="/complaints" className="btn btn-primary btn-sm mt-4">
            Open the complaint register
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-5 text-center" role="status">
          <p className="text-sm text-ink">
            No audit entries match the selected filters.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm mt-3"
            onClick={() => {
              setTypeFilter("");
              setCaseFilter("");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="table-container">
          <Table
            columns={[
              { key: "at", label: "Time" },
              { key: "entryType", label: "Type" },
              { key: "caseId", label: "Case ID" },
              { key: "actor", label: "Performed by" },
              { key: "description", label: "Description" },
              { key: "open", label: "" },
            ]}
            data={filtered.map((r) => ({
              at: formatDate(r.at),
              entryType: (
                <span
                  className={`badge ${
                    r.entryType === "Transfer"
                      ? "badge-warning"
                      : r.entryType === "Status change"
                        ? "badge-info"
                        : r.entryType === "Assignment"
                          ? "badge-primary"
                          : "badge-success"
                  }`}
                >
                  {r.entryType}
                </span>
              ),
              caseId: r.caseId,
              actor: r.actor,
              description: r.description,
              open: (
                <Link
                  href={`/complaints/${r.complaintId}`}
                  className="text-primary text-sm hover:underline"
                  aria-label={`Open case ${r.caseId}`}
                >
                  Open
                </Link>
              ),
            }))}
            rowKey="id"
          />
        </div>
      )}

      <p className="text-xs text-ink-muted">
        Demo note: the audit log records only actions taken inside this prototype
        session and exists purely for demonstration; it is not a legal or systems
        audit trail and is cleared when the demo data is reset or the page is hard
        refreshed.
      </p>
    </>
  );
}
