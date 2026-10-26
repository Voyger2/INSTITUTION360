import type { Complaint, ComplaintStatus, Institution, OverlapAlert } from "@/types";
import { BUREAUS } from "@/data/demo-data";

const ACTIVE_STATUSES: ComplaintStatus[] = [
  "Received",
  "Under Process",
  "Action Initiated",
  "Pending Clarification",
  "Referred to Bureau",
];

export function detectOverlaps(
  complaints: Complaint[],
  institutions: Institution[]
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

    const inst = institutions.find((i) => i.aictePermanentId === aicteId);

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
      detectedAt: new Date().toISOString(),
      alertStatus: "new",
      isDemoData: true,
    });
  }

  return alerts.sort(
    (a: OverlapAlert, b: OverlapAlert) =>
      new Date(b.latestActionDates[b.latestActionDates.length - 1] ?? "").getTime() -
      new Date(a.latestActionDates[a.latestActionDates.length - 1] ?? "").getTime()
  );
}

export function getActiveStatuses(): ComplaintStatus[] {
  return [...ACTIVE_STATUSES];
}

export function isStatusActive(status: ComplaintStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}