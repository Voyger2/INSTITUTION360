"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, LogOut } from "lucide-react";
import { useDemoState } from "@/lib/demo-state-context";

export default function AccessDeniedPage() {
  const { currentUser, signOutDemo } = useDemoState();
  const router = useRouter();

  const roleLabel =
    currentUser.role === "admin"
      ? "System Administrator"
      : currentUser.role === "bureau_officer"
        ? "Bureau / Cell Officer"
        : "Oversight Officer (read-only)";

  const handleSignOut = () => {
    signOutDemo();
    router.replace("/login");
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Access denied in this demo role</h1>
          <p className="page-subtitle">
            The current demonstration role does not include the page or action you
            requested.
          </p>
        </div>
      </div>

      <div className="card p-6 max-w-2xl">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-error mt-0.5" aria-hidden="true" />
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              You are currently exploring the prototype as{" "}
              <strong className="text-ink">{currentUser.name}</strong> (
              <span className="text-ink-muted">{roleLabel}</span>). Demonstration
              role rules shown in your{" "}
              <Link href="/profile" className="text-primary underline">
                Profile
              </Link>{" "}
              intentionally restrict some pages and actions so each demo account
              shows a realistic view of the portal.
            </p>
            <p className="text-ink-muted">
              These rules are presentation-only frontend behaviour within a
              prototype; nothing here enforces real security controls, and no actual
              AICTE systems are involved.
            </p>
            <ul className="list-disc list-inside text-ink-muted space-y-1">
              <li>Bureau Officer: case handling for its demo bureau, no Administration page.</li>
              <li>Oversight Officer: read-only monitoring, reporting and alert review only.</li>
              <li>System Administrator: full access to all prototype pages.</li>
            </ul>
            <p className="text-xs text-ink-muted">
              Demo note: to try the restricted view, switch the “Demo role” in the
              sidebar or sign out and pick another demo account.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/dashboard" className="btn btn-primary">
            Return to dashboard
          </Link>
          <Link href="/profile" className="btn btn-secondary">
            View role permissions
          </Link>
          <button type="button" className="btn btn-ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign out and use another demo role
          </button>
        </div>
      </div>
    </>
  );
}
