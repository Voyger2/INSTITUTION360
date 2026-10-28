import type { Complaint, ComplaintStatus, Institution, OverlapAlert } from "@/types";
import { BUREAUS, SEED_ALERT_REVIEWS, type SeedAlertReview } from "@/data/demo-data";

const ACTIVE_STATUSES: ComplaintStatus[] = [
  "Received",
  "Under Process",
  "Action Initiated",
  "Pending Clarification",
  "Referred to Bureau",
];

export function detectOverlaps(
  complaints: Complaint[],
  institutions: Institution[],
  previousAlerts: OverlapAlert[] = [],
  seedReviews: Record<string, SeedAlertReview> = SEED_ALERT_REVIEWS
): OverlapAlert[] {
  const alerts: OverlapAlert[] = [];

  const byInstId = new Map<string, Complaint[]>();
  for (const c of complaints) {
    if (!byInstId.has(c.institutionAicteId)) {
      byInstId.set(c.institutionAicteId, []);
    }
    byInstId.get(c.institutionAicteId)!.push(c);
  }

  for (const [aicteId, instComplaints] of byInstId.entries()) {
    const activeByBureau = new Map<string, Complaint[]>();
    for (const c of instComplaints) {
      if (!ACTIVE_STATUSES.includes(c.status)) continue;
      if (!activeByBureau.has(c.bureauCode)) {
        activeByBureau.set(c.bureauCode, []);
      }
      activeByBureau.get(c.bureauCode)!.push(c);
    }

    if (activeByBureau.size < 2) continue;

    const bureauCodes: string[] = [];
    const caseIds: string[] = [];
    const statuses: ComplaintStatus[] = [];
    const latestActionDates: string[] = [];
    const bureauNames: string[] = [];

    for (const [code, comps] of activeByBureau.entries()) {
      bureauCodes.push(code);
      comps.forEach((c) => {
        caseIds.push(c.caseId);
        statuses.push(c.status);
        latestActionDates.push(c.lastActionDate);
      });
      const b = BUREAUS.find((b) => b.code === code);
      bureauNames.push(b ? b.name : code);
    }

    caseIds.sort();
    const inst = institutions.find((i) => i.aictePermanentId === aicteId);
    const previous = previousAlerts.find(
      (a) => a.institutionAicteId === aicteId && sameCaseSet(a.caseIds, caseIds)
    );
    const seed = seedReviews[aicteId];

    const alertStatus = previous
      ? previous.alertStatus
      : seed
        ? seed.alertStatus
        : "new";
    const reviewedBy = previous?.reviewedBy ?? seed?.reviewedBy;
    const reviewedAt = previous?.reviewedAt ?? seed?.reviewedAt;
    const reviewDecision = previous?.reviewDecision ?? seed?.reviewDecision;
    const reviewReason = previous?.reviewReason ?? seed?.reviewReason;

    alerts.push({
      id: `alert-${aicteId}`,
      institutionId: inst?.id ?? "unknown",
      institutionName: inst?.name ?? "Unknown Institution",
      institutionAicteId: aicteId,
      caseIds,
      bureauCodes: bureauCodes as unknown as import("@/types").BureauCode[],
      bureauNames: bureauNames as unknown as import("@/types").BureauName[],
      statuses,
      latestActionDates,
      matchReasons: [
        `${caseIds.length} active complaints share this institution's AICTE Permanent ID (${aicteId}).`,
        `Cases ${caseIds.join(", ")} are open across ${bureauCodes.length} desks: ${bureauNames.join(", ")}.`,
        "Multiple parallel workflows on the same institution may duplicate effort; coordinate disposal decisions.",
      ],
      detectedAt: previous?.detectedAt ?? new Date().toISOString(),
      alertStatus,
      reviewedBy,
      reviewedAt,
      reviewDecision,
      reviewReason,
      isDemoData: true,
    });
  }

  return alerts.sort(
    (a: OverlapAlert, b: OverlapAlert) =>
      new Date(b.latestActionDates[b.latestActionDates.length - 1] ?? "").getTime() -
      new Date(a.latestActionDates[a.latestActionDates.length - 1] ?? "").getTime()
  );
}

function sameCaseSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, i) => id === sortedB[i]);
}

export function getActiveStatuses(): ComplaintStatus[] {
  return [...ACTIVE_STATUSES];
}

export function isStatusActive(status: ComplaintStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}
