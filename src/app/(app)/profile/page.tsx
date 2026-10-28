"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, ShieldAlert } from "lucide-react";
import { useDemoState } from "@/lib/demo-state-context";

export default function ProfilePage() {
  const { currentUser, complaints, overlapAlerts, signOutDemo, addToast, users } =
    useDemoState();
  const router = useRouter();

  const roleLabel =
    currentUser.role === "admin"
      ? "System Administrator"
      : currentUser.role === "bureau_officer"
        ? "Bureau / Cell Officer"
        : "Oversight Officer";

  const permissions =
    currentUser.role === "admin"
      ? {
          can: [
            "View all prototype pages, including Administration",
            "Change complaint status, assign officers and transfer cases across bureaus",
            "Review overlap alerts",
            "Reset the demonstration dataset",
          ],
          cannot: ["Nothing is restricted for the demo administrator role"],
        }
      : currentUser.role === "bureau_officer"
        ? {
            can: [
              `View all pages except Administration`,
              "Change status, reassign or transfer cases belonging to the user's demo bureau",
              "Review overlap alerts involving any bureau",
              "Export CSV reports",
            ],
            cannot: [
              "Modify cases handled by a different bureau (actions are disabled)",
              "Access the Administration page (demo role rule)",
            ],
          }
        : {
            can: [
              "View monitoring data across all bureaus",
              "Review and annotate overlap alerts",
              "View and export reports",
            ],
            cannot: [
              "Change complaint status, assign or transfer cases (read-only oversight view)",
              "Access the Administration page",
            ],
          };

  const bureauComplaints = complaints.filter(
    (c) => currentUser.bureauCode && c.bureauCode === currentUser.bureauCode
  );

  const handleSignOut = () => {
    addToast({
      type: "info",
      title: "Signed out of demo",
      message: "The demonstration session has ended.",
    });
    signOutDemo();
    router.replace("/login");
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">
            Current demonstration session profile and role rules. These are
            front-end demo rules only — the prototype has no backend or real
            accounts.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-ink">Demo session</h2>
          </div>
          <div className="card-body space-y-3">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Name</dt>
                <dd className="text-ink">{currentUser.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Email</dt>
                <dd className="text-ink font-mono text-xs">{currentUser.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Role</dt>
                <dd>
                  <span
                    className={`badge ${
                      currentUser.role === "admin"
                        ? "badge-primary"
                        : currentUser.role === "bureau_officer"
                          ? "badge-info"
                          : "badge-success"
                    }`}
                  >
                    {roleLabel}
                  </span>
                </dd>
              </div>
              {currentUser.bureauName && (
                <div>
                  <dt className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Bureau / Cell</dt>
                  <dd className="text-ink">
                    {currentUser.bureauName} ({currentUser.bureauCode})
                  </dd>
                </div>
              )}
              {currentUser.region && (
                <div>
                  <dt className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Region</dt>
                  <dd className="text-ink">{currentUser.region}</dd>
                </div>
              )}
            </dl>
            <p className="hint">
              Use the “Demo role” switcher in the sidebar to explore the other demo
              perspectives, or sign out and choose another demo account on the
              sign-in page.
            </p>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-ink">
              What this demo role can and cannot do
            </h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" /> Allowed in demo
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-ink-muted list-disc list-inside">
                {permissions.can.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-error" aria-hidden="true" /> Not allowed in demo
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-ink-muted list-disc list-inside">
                {permissions.cannot.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            {currentUser.bureauCode && (
              <div className="md:col-span-2 border-t border-border pt-3 text-sm">
                <p>
                  Cases currently in your bureau&apos;s register:{" "}
                  <strong>{bureauComplaints.length}</strong> of {complaints.length}{" "}
                  demo cases.{" "}
                  <Link href="/complaints" className="text-primary underline">
                    View them in the complaint filter
                  </Link>
                  .
                </p>
              </div>
            )}
            {currentUser.role !== "admin" && (
              <p className="md:col-span-2 text-xs text-ink-muted border-t border-border pt-3">
                Demo limitation: {users.filter((u) => u.role === currentUser.role).length} demo
                role account(s) exist for this role; session switching here is
                purely visual and no data is changed for other users. Overlap alerts
                currently awaiting review:{" "}
                {overlapAlerts.filter((a) => (a as { alertStatus?: string }).alertStatus === "new").length}.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
