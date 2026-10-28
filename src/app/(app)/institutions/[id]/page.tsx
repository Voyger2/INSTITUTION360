"use client";

import * as React from "react";
import Link from "next/link";
import { useDemoState } from "@/lib/demo-state-context";
import { Badge } from "@/components/ui/badge";
import { NotFoundView } from "@/components/portal/not-found-view";
import { formatDate } from "@/lib/formatting";
import type { OverlapAlert } from "@/types";

export default function InstitutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <React.Suspense fallback={<DetailPageFallback />}>
      <InstitutionDetailView params={params} />
    </React.Suspense>
  );
}

function DetailPageFallback() {
  return (
    <div className="card p-5" aria-busy="true">
      <div className="h-6 w-1/3 bg-background rounded-sm mb-4" />
      <div className="h-4 w-1/2 bg-background rounded-sm" />
      <p className="text-sm text-ink-muted mt-4">Loading institution details...</p>
    </div>
  );
}

function InstitutionDetailView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { institutions, complaints, overlapAlerts } = useDemoState();
  const inst = institutions.find((i) => i.id === id);

  if (!inst) {
    return (
      <NotFoundView
        title="We can't find that institution"
        entityType="institution"
      />
    );
  }

  const instComplaints = complaints.filter((c) => c.institutionId === inst.id);
  const instAlerts = (
    overlapAlerts as unknown as OverlapAlert[]
  ).filter((a) => a.institutionAicteId === inst.aictePermanentId);
  const bureauCounts = Array.from(
    instComplaints.reduce((map, c) => {
      map.set(c.bureauName, (map.get(c.bureauName) ?? 0) + 1);
      return map;
    }, new Map<string, number>())
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{inst.name}</h1>
            <p className="text-sm text-ink-muted">
              AICTE Permanent ID: <span className="font-mono">{inst.aictePermanentId}</span>
            </p>
            <p className="text-sm text-ink-muted">
              {inst.region} &bull; {inst.state} &bull; {inst.district}
            </p>
            <Badge className="badge-info">Synthetic Demo Data</Badge>
          </div>
          <div className="flex gap-2">
            <a href="#complaint-history" className="btn btn-secondary btn-sm">
              View complaints
            </a>
            <Link href="/complaints" className="btn btn-ghost btn-sm">
              Open register
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-5">
            <h2 className="text-lg font-semibold text-ink mb-4">Institution Details</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <dt className="text-xs font-semibold text-ink-muted uppercase">Address</dt>
                <dd className="text-sm text-ink">{inst.address}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Type</dt>
                <dd className="text-sm text-ink">{inst.type}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Established</dt>
                <dd className="text-sm text-ink">{inst.establishedYear}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">Region</dt>
                <dd className="text-sm text-ink">{inst.region}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">State</dt>
                <dd className="text-sm text-ink">{inst.state}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-ink-muted uppercase">District</dt>
                <dd className="text-sm text-ink">{inst.district}</dd>
              </div>
              {inst.website && (
                <div className="col-span-2">
                  <dt className="text-xs font-semibold text-ink-muted uppercase">Website</dt>
                  <dd className="text-sm text-ink">
                    <a href={`https://${inst.website}`} className="text-primary hover:underline">
                      {inst.website}
                    </a>
                  </dd>
                </div>
              )}
              {inst.contactEmail && (
                <div className="col-span-2">
                  <dt className="text-xs font-semibold text-ink-muted uppercase">Contact Email</dt>
                  <dd className="text-sm text-ink">{inst.contactEmail}</dd>
                </div>
              )}
              {inst.contactPhone && (
                <div className="col-span-2">
                  <dt className="text-xs font-semibold text-ink-muted uppercase">Contact Phone</dt>
                  <dd className="text-sm text-ink">{inst.contactPhone}</dd>
                </div>
              )}
            </dl>
          </section>

          <section id="complaint-history" className="card p-5">
            <h2 className="text-lg font-semibold text-ink mb-4">Complaint history</h2>
            {instComplaints.length === 0 ? (
              <p className="text-ink-muted">No complaints registered for this institution.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-background border-b border-border">
                      <th className="px-3 py-2 text-left font-semibold text-ink text-xs">Case ID</th>
                      <th className="px-3 py-2 text-left font-semibold text-ink text-xs">Category</th>
                      <th className="px-3 py-2 text-left font-semibold text-ink text-xs">Bureau</th>
                      <th className="px-3 py-2 text-left font-semibold text-ink text-xs">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-ink text-xs">Received</th>
                      <th className="px-3 py-2 text-left font-semibold text-ink text-xs">Officer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {instComplaints.map((c) => (
                      <tr key={c.id} className="hover:bg-background">
                        <td className="px-3 py-2 font-medium">
                          <Link href={`/complaints/${c.id}`} className="text-primary hover:underline">
                            {c.caseId}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-ink">{c.category}</td>
                        <td className="px-3 py-2 text-ink-muted">{c.bureauName}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-sm text-xs font-semibold border ${
                            c.status === "Disposed" || c.status === "Rejected" || c.status === "Closed"
                              ? "bg-success-bg text-success border-success-border"
                              : c.isOverdue
                                ? "bg-error-bg text-error border-error-border"
                                : "bg-primary-light text-primary border-primary"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-ink-muted">{formatDate(c.receivedDate)}</td>
                        <td className="px-3 py-2 text-ink">{c.assignedOfficerName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-4">
            <h3 className="text-sm font-semibold text-ink mb-3">Case Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-ink-muted">Total Cases</p>
                <p className="text-lg font-bold text-ink">{instComplaints.length}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Active Cases</p>
                <p className="text-lg font-bold text-ink">
                  {instComplaints.filter((c) =>
                    ["Received", "Under Process", "Action Initiated", "Pending Clarification", "Referred to Bureau"].includes(c.status)
                  ).length}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Disposed Cases</p>
                <p className="text-lg font-bold text-ink">
                  {instComplaints.filter((c) => c.status === "Disposed").length}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Overdue Cases</p>
                <p className="text-lg font-bold text-ink">
                  {instComplaints.filter((c) => c.isOverdue).length}
                </p>
              </div>
            </div>
          </section>

          <section className="card p-4">
            <h3 className="text-sm font-semibold text-ink mb-3">Cross-bureau activity</h3>
            {bureauCounts.length === 0 ? (
              <p className="text-xs text-ink-muted">No demo cases on file.</p>
            ) : (
              <>
                <ul className="space-y-2 text-sm">
                  {bureauCounts.map(([bureauName, count]) => (
                    <li key={bureauName} className="flex items-center justify-between gap-2">
                      <span className="text-ink-muted">{bureauName}</span>
                      <span className="font-mono font-medium text-ink">{count}</span>
                    </li>
                  ))}
                </ul>
                {bureauCounts.length > 1 && (
                  <p className="hint mt-2">
                    This institution has active demo records in{" "}
                    {bureauCounts.length} different bureaus — a common trigger for
                    overlap alerts.
                  </p>
                )}
              </>
            )}
          </section>

          <section className="card p-4">
            <h3 className="text-sm font-semibold text-ink mb-3">Overlap alerts</h3>
            {instAlerts.length === 0 ? (
              <p className="text-xs text-ink-muted">
                No overlap alerts detected for this institution&apos;s AICTE
                Permanent ID ({inst.aictePermanentId}) in the demo data.
              </p>
            ) : (
              <ul className="space-y-3">
                {instAlerts.map((alert) => (
                  <li key={alert.id} className="border border-overlap-border bg-overlap-bg rounded-sm p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="badge badge-overlap">
                        {alert.alertStatus === "new"
                          ? "New"
                          : alert.alertStatus === "reviewed"
                            ? "Reviewed"
                            : alert.alertStatus === "not_overlapping"
                              ? "Not overlapping"
                              : alert.alertStatus === "coordination_required"
                                ? "Coordination required"
                                : "Related"}
                      </span>
                      <Link href="/overlaps" className="text-xs text-primary hover:underline">
                        Review
                      </Link>
                    </div>
                    <p className="text-xs text-ink mt-2">
                      Matched cases: <span className="font-mono">{alert.caseIds.join(", ")}</span>
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Bureaus: {alert.bureauNames.join(", ")}
                    </p>
                    {alert.reviewReason && (
                      <p className="text-xs text-ink-muted mt-1">
                        Review note: {alert.reviewReason}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}