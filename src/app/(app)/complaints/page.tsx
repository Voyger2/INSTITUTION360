"use client";

import * as React from "react";
import { useDemoState } from "@/lib/demo-state-context";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import Link from "next/link";

const BUREAUS = [
  { code: "RB", name: "Regulation Bureau" },
  { code: "PGRC", name: "Public Grievance Redressal Cell" },
  { code: "APC", name: "Approval Process Cell" },
  { code: "EOA", name: "Expert Opinion Assessment" },
  { code: "NWRO", name: "North Western Regional Office" },
  { code: "SWRO", name: "South Western Regional Office" },
  { code: "SCRO", name: "South Central Regional Office" },
  { code: "NCRO", name: "North Central Regional Office" },
  { code: "CRO", name: "Central Regional Office" },
  { code: "WRO", name: "Western Regional Office" },
];

const STATUSES = [
  "Received",
  "Under Process",
  "Action Initiated",
  "Pending Clarification",
  "Referred to Bureau",
  "Disposed",
  "Transferred",
  "Rejected",
  "Closed",
];

const CATEGORIES = [
  "Approval Process Violation",
  "Infrastructure Deficiency",
  "Faculty Shortage",
  "Admission Irregularity",
  "Fee Structure Violation",
  "Academic Quality",
  "Grievance Redressal",
  "Document Verification",
  "Compliance Failure",
  "Other",
];

export function ComplaintsPage() {
  const { complaints, getCurrentUser, canUserChangeComplaint } = useDemoState();
  const currentUser = getCurrentUser();
  const [search, setSearch] = React.useState("");
  const [bureauFilter, setBureauFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [overdueFilter, setOverdueFilter] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 15;

  const filtered = complaints.filter((c) => {
    const matchesSearch =
      c.caseId.toLowerCase().includes(search.toLowerCase()) ||
      c.institutionName.toLowerCase().includes(search.toLowerCase());
    const matchesBureau = !bureauFilter || c.bureauCode === bureauFilter;
    const matchesStatus = !statusFilter || c.status === statusFilter;
    const matchesCategory = !categoryFilter || c.category === categoryFilter;
    const matchesOverdue =
      overdueFilter === "true" ? c.isOverdue : overdueFilter === "false" ? !c.isOverdue : true;
    return matchesSearch && matchesBureau && matchesStatus && matchesCategory && matchesOverdue;
  });

  const sorted = [...filtered].sort((a, b) => {
    return new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime();
  });

  const total = sorted.length;
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="flex flex-col lg:col-span-2">
            <label className="text-xs font-semibold text-ink-muted mb-1">Search</label>
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Case ID, institution..."
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-ink-muted mb-1">Bureau</label>
            <Select
              value={bureauFilter}
              onChange={(e) => {
                setBureauFilter(e.target.value);
                setPage(1);
              }}
              options={BUREAUS.map((b) => ({ value: b.code, label: b.name }))}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-ink-muted mb-1">Status</label>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={STATUSES.map((s) => ({ value: s, label: s }))}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-ink-muted mb-1">Category</label>
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-ink-muted mb-1">Overdue</label>
            <Select
              value={overdueFilter}
              onChange={(e) => {
                setOverdueFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "", label: "All" },
                { value: "true", label: "Yes" },
                { value: "false", label: "No" },
              ]}
            />
          </div>
          <div className="flex flex-col h-[78px]">
            <Button
              variant="secondary"
              onClick={() => {
                setSearch("");
                setBureauFilter("");
                setStatusFilter("");
                setCategoryFilter("");
                setOverdueFilter("");
                setPage(1);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <Table
          columns={[
            { key: "caseId", label: "Case ID", sortable: true },
            { key: "institutionName", label: "Institution", sortable: true },
            { key: "category", label: "Category", sortable: true },
            { key: "priority", label: "Priority", sortable: true },
            { key: "bureauName", label: "Bureau/Cell", sortable: true },
            { key: "assignedOfficerName", label: "Assigned Officer", sortable: true },
            { key: "status", label: "Status", sortable: true },
            { key: "receivedDate", label: "Received", sortable: true },
            { key: "expectedDisposalDate", label: "Expected Disposal", sortable: true },
            { key: "lastActionDate", label: "Last Action", sortable: true },
            { key: "action", label: "Action", sortable: false },
          ]}
          data={paginated.map((c) => ({
            ...c,
            status: (
              <span className={`px-2 py-0.5 rounded-sm text-xs font-semibold border ${
                c.status === "Disposed" || c.status === "Rejected" || c.status === "Closed"
                  ? "bg-success-bg text-success border-success-border"
                  : c.isOverdue
                    ? "bg-error-bg text-error border-error-border"
                    : "bg-primary-light text-primary border-primary"
              }`}>
                {c.status}
              </span>
            ),
            overdue: c.isOverdue ? (
              <span className="text-xs font-semibold text-error">Overdue</span>
            ) : (
              <span className="text-xs text-ink-muted">—</span>
            ),
            action: (
              <Link href={`/complaints/${c.id}`} className="text-primary font-medium hover:underline">
                View
              </Link>
            ),
          }))}
          rowKey="id"
        />
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />

      <div className="mt-4 text-xs text-ink-muted">
        <p>Showing {paginated.length} of {total} cases. All records are synthetic demonstration data.</p>
        <p>
          Role: <strong>{currentUser.role.replace("_", " ")}</strong> —{" "}
          {canUserChangeComplaint(complaints[0] ?? complaints[0]) ? "Can modify" : "Read-only"}
        </p>
      </div>
    </div>
  );
}

export default ComplaintsPage;