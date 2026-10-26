"use client";

import * as React from "react";
import Link from "next/link";
import { useDemoState } from "@/lib/demo-state-context";
import type { ComplaintStatus } from "@/types";

export default function HelpPage() {
  const { config, complaints } = useDemoState();

  const statuses = Object.entries(
    config.statusDefinitions as Record<
      ComplaintStatus,
      { label: string; description: string; isActive: boolean; isFinal: boolean }
    >
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Help &amp; guide</h1>
          <p className="page-subtitle">
            How to use the INSTITUTION360 prototype, definitions used in the demo
            configuration, and the limitations of this front-end demonstration.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <section className="card">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-ink">Using the prototype</h2>
            <ol className="mt-3 space-y-3 text-sm text-ink-muted list-decimal list-outside pl-5 leading-relaxed">
              <li>
                <span className="text-ink font-medium">Registers.</span> The{" "}
                <Link href="/complaints" className="text-primary underline">Complaint register</Link>{" "}
                supports search, filters (bureau, status, category, overdue) and
                pagination; the{" "}
                <Link href="/institutions" className="text-primary underline">Institution register</Link>{" "}
                supports search by institution name and AICTE Permanent ID.
              </li>
              <li>
                <span className="text-ink font-medium">Case actions.</span> Open any
                complaint record to change its status, reassign an officer, transfer
                it to another bureau, or add a note-style action description. Every
                permitted action updates the shared demo state, its history timeline
                on the record page and the <Link href="/audit-log" className="text-primary underline">Audit log</Link>.
              </li>
              <li>
                <span className="text-ink font-medium">Overlap detection.</span>{" "}
                Institutions are keyed by their <em>AICTE Permanent ID</em>. When
                several active cases on the same institution exist across different
                bureaus, an <Link href="/overlaps" className="text-primary underline">overlap alert</Link>{" "}
                is raised listing matching cases; bureaus then review and mark a
                decision (related, coordination required, not overlapping).
              </li>
              <li>
                <span className="text-ink font-medium">Roles.</span> Demo roles and
                their access rules are described in your{" "}
                <Link href="/profile" className="text-primary underline">Profile</Link>. The
                current role is always shown in the header; sign out to return to
                the public sign-in screen.
              </li>
            </ol>
            <p className="hint mt-3">
              Keyboard: Tab moves between controls, Enter activates links and
              buttons, Esc closes dialogs and menus, and “Skip to main content” is
              the first focus target on every page.
            </p>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-ink">Status definitions (demo configuration)</h2>
          </div>
          <div className="card-body overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th scope="col">Status</th>
                  <th scope="col">Meaning</th>
                  <th scope="col">Active stage</th>
                  <th scope="col">Final stage</th>
                  <th scope="col">Cases now</th>
                </tr>
              </thead>
              <tbody>
                {statuses.map(([key, def]) => (
                  <tr key={key}>
                    <td className="font-medium text-ink">{def.label}</td>
                    <td className="text-ink-muted">{def.description}</td>
                    <td>
                      <span className={`badge ${def.isActive ? "badge-info" : "badge-secondary border border-border text-ink-muted"}`}>
                        {def.isActive ? "Active" : "Not active"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${def.isFinal ? "badge-success" : "badge-secondary border border-border text-ink-muted"}`}>
                        {def.isFinal ? "Final" : "Non-final"}
                      </span>
                    </td>
                    <td className="font-mono">
                      {complaints.filter((c) => c.status === (key as ComplaintStatus)).length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-ink">Permitted status transitions</h2>
            </div>
            <div className="card-body">
              <dl className="space-y-2 text-sm">
                {Object.entries(
                  config.validTransitions as Record<ComplaintStatus, ComplaintStatus[]>
                ).map(([from, tos]) => (
                  <div key={from} className="flex flex-col sm:flex-row sm:gap-2">
                    <dt className="font-medium text-ink sm:w-48 flex-shrink-0">{from}</dt>
                    <dd className="text-ink-muted">
                      → {tos.length > 0 ? tos.join(", ") : "no further transitions"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-ink">Deadline thresholds</h2>
              </div>
              <div className="card-body space-y-2 text-sm">
                <p>
                  <span className="font-medium text-ink">Warning window:</span>{" "}
                  {config.deadlineThresholds.warningDays} days before the expected
                  disposal date.
                </p>
                <p>
                  <span className="font-medium text-ink">Overdue:</span>{" "}
                  {config.deadlineThresholds.overdueDays}+ days past the expected
                  disposal date, or any active case whose deadline has passed.
                </p>
                <p className="hint">These are demonstration values defined in the demo configuration.</p>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-ink">Support &amp; limitations</h2>
              </div>
              <div className="card-body space-y-2 text-sm text-ink-muted leading-relaxed">
                <p>
                  <span className="text-ink font-medium">Support:</span> contact the
                  SIH 2026 project team via the event platform. No official AICTE
                  helpdesk is associated with this prototype.
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Front-end only: there is no backend, and no data leaves the browser session.</li>
                  <li>All records (institutions, users, complaints, alerts) are synthetic demo data.</li>
                  <li>A hard page refresh resets in-memory demo changes to the seed dataset.</li>
                  <li>The sign-in flow is a demonstration gesture; it performs no real authentication.</li>
                  <li>Notifications are generated in-browser only; nothing is emailed or pushed externally.</li>
                  <li>Report dates, counts and exports reflect only the local demo dataset.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
