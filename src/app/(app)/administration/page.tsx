"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useDemoState } from "@/lib/demo-state-context";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import type { User } from "@/types";

export function AdministrationPage() {
  const {
    users,
    bureaus,
    config,
    resetDemoData,
    getCurrentUser,
    addToast,
  } = useDemoState();
  const router = useRouter();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser.role === "admin";

  const [confirmResetOpen, setConfirmResetOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isAdmin) {
      router.replace("/access-denied");
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    const fallbackRoles = users
      .filter((u) => u.role === "admin")
      .map((u: User) => u.name) as string[];
    return (
      <div className="card p-5 text-sm text-ink-muted" role="status">
        <p>
          This page is restricted to the demo System Administrator role
          ({fallbackRoles.join(", ")}). You are being redirected to the{" "}
          <a href="/access-denied" className="text-primary underline">
            access-denied explanation
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Administration</h1>
            <p className="text-sm text-ink-muted">
              Demonstration configuration. These are prototype settings, not official AICTE SLAs.
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmResetOpen(true)}
            >
              Reset Demo Data
            </Button>
          )}
        </div>
      </div>

      <Dialog
        isOpen={confirmResetOpen}
        title="Reset demonstration data?"
        description="This restores the synthetic dataset to its initial seeded state. All demo complaints, status/assignment/action histories, overlap review decisions and the current session view are reset. This cannot be undone."
        onClose={() => setConfirmResetOpen(false)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                resetDemoData();
                setConfirmResetOpen(false);
                addToast({
                  type: "success",
                  title: "Demo data reset",
                  message: "All demonstration data was restored to the seeded synthetic state.",
                });
              }}
            >
              Reset demo data
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          Applies to in-browser demonstration state only. No external records are
          affected and no real data exists behind this prototype.
        </p>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card p-5">
          <h2 className="text-lg font-semibold text-ink mb-4">Demo Users & Roles</h2>
          <div className="table-container">
            <Table
              columns={[
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                { key: "role", label: "Role" },
                { key: "bureau", label: "Bureau/Cell" },
              ]}
              data={users.map((u) => ({
                ...u,
                role: (
                  <Badge className={`badge-${u.role === "admin" ? "primary" : u.role === "bureau_officer" ? "info" : "success"}`}>
                    {u.role.replace("_", " ")}
                  </Badge>
                ),
                bureau: u.bureauName || "—",
              }))}
              rowKey="id"
            />
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-semibold text-ink mb-4">Bureaus & Cells</h2>
          <div className="table-container">
            <Table
              columns={[
                { key: "code", label: "Code" },
                { key: "name", label: "Bureau/Cell Name" },
                { key: "region", label: "Region" },
                { key: "description", label: "Description" },
              ]}
              data={bureaus as unknown as Record<string, unknown>[]}
              rowKey="code"
            />
          </div>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="text-lg font-semibold text-ink mb-4">Prototype Deadline Thresholds</h2>
        <p className="text-sm text-ink-muted mb-4">
          These thresholds are used to calculate overdue indicators. They are demonstration values only.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-ink-muted">Warning Threshold</p>
            <p className="text-lg font-bold text-ink">
              {config.deadlineThresholds.warningDays} days
            </p>
            <p className="text-xs text-ink-muted">Cases approaching disposal date</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-muted">Overdue Threshold</p>
            <p className="text-lg font-bold text-ink">
              {config.deadlineThresholds.overdueDays} days
            </p>
            <p className="text-xs text-ink-muted">Cases past expected disposal date</p>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold text-ink mb-4">Status Definitions</h2>
        <p className="text-sm text-ink-muted mb-4">
          Valid statuses and their meanings in the prototype.
        </p>
        <div className="table-container">
          <Table
            columns={[
              { key: "status", label: "Status" },
              { key: "label", label: "Description" },
              { key: "active", label: "Active" },
              { key: "final", label: "Final" },
            ]}
            data={Object.entries(config.statusDefinitions as Record<string, Record<string, unknown>>).map(([key, def]) => ({
              status: key,
              label: def.description,
              active: def.isActive ? "Yes" : "No",
              final: def.isFinal ? "Yes" : "No",
            }))}
            rowKey="status"
          />
        </div>
      </section>
    </div>
  );
}

export default AdministrationPage;