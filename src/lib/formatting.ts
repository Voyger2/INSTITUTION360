import type { Complaint, ComplaintStatus, DashboardMetrics, Institution, ReportData } from "@/types";
import { BUREAUS, REGIONS } from "@/data/demo-data";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function formatDateISO(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toISOString().split("T")[0];
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return "0%";
  return ((value / total) * 100).toFixed(1) + "%";
}

export function daysBetween(from: string, to: string): number {
  const d1 = new Date(from);
  const d2 = new Date(to);
  const diff = d2.getTime() - d1.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isDateOverdue(dateStr: string, today: string = new Date().toISOString().split("T")[0]): boolean {
  return new Date(dateStr) < new Date(today);
}

export function getStatusColor(status: ComplaintStatus): string {
  const statusColors: Record<ComplaintStatus, string> = {
    Received: "bg-primary-light text-primary",
    "Under Process": "bg-primary-light text-primary",
    "Action Initiated": "bg-primary-light text-primary",
    "Pending Clarification": "bg-warning-bg text-warning",
    "Referred to Bureau": "bg-info-bg text-info",
    Disposed: "bg-success-bg text-success",
    Transferred: "bg-warning-bg text-warning",
    Rejected: "bg-error-bg text-error",
    Closed: "bg-success-bg text-success",
  };
  return statusColors[status] ?? "bg-border text-ink-muted";
}

export function getStatusBadgeClass(status: ComplaintStatus): string {
  const badgeMap: Record<ComplaintStatus, string> = {
    Received: "badge-info",
    "Under Process": "badge-primary",
    "Action Initiated": "badge-primary",
    "Pending Clarification": "badge-warning",
    "Referred to Bureau": "badge-info",
    Disposed: "badge-success",
    Transferred: "badge-warning",
    Rejected: "badge-error",
    Closed: "badge-success",
  };
  return badgeMap[status] ?? "badge-info";
}

export function calculateMetrics(complaints: Complaint[]): DashboardMetrics {
  const totalCases = complaints.length;
  const pendingCases = complaints.filter(
    (c) => c.status === "Received" || c.status === "Under Process" || c.status === "Action Initiated"
  ).length;
  const underProcessCases = complaints.filter((c) => c.status === "Under Process").length;
  const disposedCases = complaints.filter((c) => c.status === "Disposed").length;
  const transferredCases = complaints.filter((c) => c.status === "Transferred").length;
  const overdueCases = complaints.filter((c) => c.isOverdue).length;

  return {
    totalCases,
    pendingCases,
    underProcessCases,
    disposedCases,
    transferredCases,
    overdueCases,
    overlapAlerts: 0, // Will be set by overlap detection
  };
}

export function generateReportData(
  complaints: Complaint[],
  institutions: Institution[]
): ReportData {
  const bureauMap = new Map<string, { total: number; active: number; overdue: number; days: number[] }>();
  const regionMap = new Map<string, { total: number; active: number; overdue: number; regionName: string }>();
  const statusMap = new Map<ComplaintStatus, number>();

  for (const c of complaints) {
    // Bureau-wise
    if (!bureauMap.has(c.bureauCode)) {
      bureauMap.set(c.bureauCode, { total: 0, active: 0, overdue: 0, days: [] });
    }
    const b = bureauMap.get(c.bureauCode)!;
    b.total += 1;
    const activeStatuses = ["Received", "Under Process", "Action Initiated", "Pending Clarification", "Referred to Bureau"];
    if (activeStatuses.includes(c.status)) b.active += 1;
    if (c.isOverdue) b.overdue += 1;
    b.days.push(daysBetween(c.receivedDate, c.lastActionDate));

    // Region-wise (using institution region)
    const inst = institutions.find((i) => i.id === c.institutionId);
    const regionCode = inst ? inst.region : "C";
    const regionName = inst
      ? (REGIONS.find((r) => r.code === inst.region)?.name ?? "Central")
      : "Central";
    if (!regionMap.has(regionCode)) {
      regionMap.set(regionCode, { total: 0, active: 0, overdue: 0, regionName });
    }
    const r = regionMap.get(regionCode)!;
    r.total += 1;
    if (activeStatuses.includes(c.status)) r.active += 1;
    if (c.isOverdue) r.overdue += 1;

    // Status-wise
    statusMap.set(c.status, (statusMap.get(c.status) || 0) + 1);
  }

  const bureauWise = Array.from(bureauMap.entries()).map(([code, data]) => {
    const bureau = BUREAUS.find((b) => b.code === code);
    return {
      bureauCode: code as unknown as import("@/types").BureauCode,
      bureauName: bureau ? bureau.name : (code as unknown as import("@/types").BureauName),
      totalCases: data.total,
      activeCases: data.active,
      overdueCases: data.overdue,
      avgDisposalDays: data.days.length > 0
        ? Math.round(data.days.reduce((a: number, b: number) => a + b, 0) / data.days.length)
        : 0,
    };
  });

  const regionWise = Array.from(regionMap.entries()).map(([code, data]) => ({
    regionCode: code as unknown as import("@/types").RegionCode,
    regionName: data.regionName as unknown as import("@/types").RegionName,
    totalCases: data.total,
    activeCases: data.active,
    overdueCases: data.overdue,
  }));

  const statusWise = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
    percentage: Math.round((count / complaints.length) * 100),
  }));

  const pendingAgeing = [
    { bucket: "0-7 days", count: 0 },
    { bucket: "8-14 days", count: 0 },
    { bucket: "15-30 days", count: 0 },
    { bucket: "31-60 days", count: 0 },
    { bucket: "60+ days", count: 0 },
  ];

  const overdueCases = complaints.filter((c) => c.isOverdue);

  const institutionWise = institutions.map((inst) => {
    const instComplaints = complaints.filter((c) => c.institutionId === inst.id);
    return {
      institutionId: inst.id,
      institutionName: inst.name,
      totalCases: instComplaints.length,
      activeCases: instComplaints.filter((c) =>
        ["Received", "Under Process", "Action Initiated", "Pending Clarification", "Referred to Bureau"].includes(c.status)
      ).length,
      disposedCases: instComplaints.filter((c) => c.status === "Disposed").length,
    };
  });

  return {
    bureauWise,
    regionWise,
    statusWise,
    pendingAgeing,
    overdueCases,
    institutionWise,
  };
}

export function groupComplaintsByInstitution(
  complaints: Complaint[],
  institutions: { id: string; name: string; aictePermanentId: string }[]
) {
  const byInst = new Map<string, Complaint[]>();
  for (const c of complaints) {
    if (!byInst.has(c.institutionId)) byInst.set(c.institutionId, []);
    byInst.get(c.institutionId)!.push(c);
  }
  return Array.from(byInst.entries()).map(([instId, comps]) => {
    const inst = institutions.find((i) => i.id === instId);
    return {
      institution: inst ?? { id: instId, name: "Unknown", aictePermanentId: "" },
      complaints: comps,
      totalCases: comps.length,
      activeCases: comps.filter((c) =>
        ["Received", "Under Process", "Action Initiated", "Pending Clarification", "Referred to Bureau"].includes(c.status)
      ).length,
      disposedCases: comps.filter((c) => c.status === "Disposed").length,
    };
  });
}