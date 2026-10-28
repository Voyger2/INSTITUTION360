import type {
  Complaint,
  ComplaintStatus,
  User,
  DemoConfig,
  ActionHistory,
  AssignmentHistory,
  StatusHistory,
} from "@/types";
import { COMPLAINTS, USERS, DEMO_CONFIG, BUREAUS, INSTITUTIONS, DEMO_DATA_AS_OF, SEED_STATUS_HISTORY, SEED_ASSIGNMENT_HISTORY, SEED_ACTION_HISTORY } from "@/data/demo-data";
import { detectOverlaps, isStatusActive } from "@/lib/overlap-detection";
import { calculateMetrics } from "@/lib/formatting";

let complaints: Complaint[] = [...COMPLAINTS];
let users: User[] = [...USERS];
let currentUser: User = USERS[0]; // Default to admin
// Alerts are derived from the seeded complaints on first load (seeded review
// states applied), so the Overlap Alerts page is populated before any mutation.
let overlapAlerts: ReturnType<typeof detectOverlaps> = detectOverlaps(complaints, INSTITUTIONS);
let metrics = calculateMetrics(complaints);

let actionHistory: ActionHistory[] = [...SEED_ACTION_HISTORY];
let statusHistory: StatusHistory[] = [...SEED_STATUS_HISTORY];
let assignmentHistory: AssignmentHistory[] = [...SEED_ASSIGNMENT_HISTORY];

let historyCounter = 0;

type Listener = () => void;

const listeners: Listener[] = [];

export function subscribeDemoState(fn: Listener): () => void {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

function notify(): void {
  for (const l of listeners) l();
}

function actorName(idOrName: string): string {
  const u = users.find((x) => x.id === idOrName);
  return u ? u.name : idOrName;
}

// Recompute fields that depend on the current date (overdue flags) and the
// aggregate metrics, so counts always follow the dataset's own rules instead
// of stale manual values.
function refreshDerivedFields(): void {
  const now = new Date(`${DEMO_DATA_AS_OF}T23:59:59`);
  for (const c of complaints) {
    const overdue =
      isStatusActive(c.status) && new Date(c.expectedDisposalDate) < now;
    c.isOverdue = overdue;
    c.daysOverdue = overdue
      ? Math.ceil(
          (now.getTime() - new Date(c.expectedDisposalDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;
  }
  metrics = calculateMetrics(complaints);
}

refreshDerivedFields();

function nextHistoryId(): string {
  historyCounter += 1;
  return `hist-${historyCounter}`;
}

function recordAction(
  complaintId: string,
  actionType: ActionHistory["actionType"],
  description: string,
  performedBy: string,
  metadata?: Record<string, unknown>
): void {
  actionHistory.push({
    id: nextHistoryId(),
    complaintId,
    actionType,
    description,
    performedBy: actorName(performedBy),
    performedAt: new Date().toISOString(),
    metadata,
    isDemoData: true,
  });
}

function recordStatusChange(
  complaintId: string,
  fromStatus: ComplaintStatus | null,
  toStatus: ComplaintStatus,
  changedBy: string,
  reason: string
): void {
  statusHistory.push({
    id: nextHistoryId(),
    complaintId,
    fromStatus,
    toStatus,
    changedBy: actorName(changedBy),
    changedAt: new Date().toISOString(),
    reason,
    isDemoData: true,
  });
}

function recordAssignment(
  complaintId: string,
  fromBureauCode: import("@/types").BureauCode | null,
  fromBureauName: string | null,
  fromOfficerId: string | null,
  fromOfficerName: string | null,
  toBureauCode: import("@/types").BureauCode,
  toBureauName: import("@/types").BureauName,
  toOfficerId: string,
  toOfficerName: string,
  transferReason: string,
  transferredBy: string
): void {
  assignmentHistory.push({
    id: nextHistoryId(),
    complaintId,
    fromBureauCode,
    fromBureauName,
    fromOfficerId,
    fromOfficerName,
    toBureauCode,
    toBureauName,
    toOfficerId,
    toOfficerName,
    transferReason,
    transferredBy: actorName(transferredBy),
    transferredAt: new Date().toISOString(),
    isDemoData: true,
  });
}

export function getComplaints(): Complaint[] {
  refreshDerivedFields();
  return [...complaints];
}

export function getComplaintById(id: string): Complaint | undefined {
  return complaints.find((c) => c.id === id);
}

export function getComplaintByCaseId(caseId: string): Complaint | undefined {
  return complaints.find((c) => c.caseId === caseId);
}

export function setComplaints(next: Complaint[]): void {
  complaints = [...next];
  refreshDerivedFields();
  overlapAlerts = detectOverlaps(complaints, INSTITUTIONS, overlapAlerts);
  notify();
}

export function getMetrics() {
  refreshDerivedFields();
  return { ...metrics, overlapAlerts: overlapAlerts.length };
}

export function getOverlapAlerts() {
  return [...overlapAlerts];
}

export function getAlertById(id: string) {
  return overlapAlerts.find((a) => a.id === id);
}

export function updateAlertStatus(
  alertId: string,
  decision: "reviewed" | "related" | "not_overlapping" | "coordination_required",
  reason?: string,
  reviewedBy?: string
): boolean {
  const alert = overlapAlerts.find((a) => a.id === alertId);
  if (!alert) return false;
  alert.alertStatus = decision;
  alert.reviewedBy = reviewedBy;
  alert.reviewedAt = new Date().toISOString();
  alert.reviewDecision = decision;
  alert.reviewReason = reason;
  notify();
  return true;
}

export function getUsers(): User[] {
  return [...users];
}

export function getCurrentUser(): User {
  return { ...currentUser };
}

export function setCurrentUser(user: User): void {
  currentUser = { ...user };
  notify();
}

let sessionUserId: string | null = null;

export function isDemoSignedIn(): boolean {
  return sessionUserId !== null;
}

export function getSessionUserId(): string | null {
  return sessionUserId;
}

export function signInDemo(userId: string): boolean {
  const user = users.find((u) => u.id === userId);
  if (!user) return false;
  currentUser = { ...user };
  sessionUserId = user.id;
  notify();
  return true;
}

export function signOutDemo(): void {
  sessionUserId = null;
  notify();
}

export function getDemoUserById(userId: string): User | undefined {
  const found = users.find((u) => u.id === userId);
  return found ? { ...found } : undefined;
}

export function getConfig(): DemoConfig {
  return { ...DEMO_CONFIG };
}

export function getBureaus() {
  return [...BUREAUS];
}

export function getInstitutions() {
  return [...INSTITUTIONS];
}

export function getActionHistory(complaintId?: string): ActionHistory[] {
  if (complaintId) {
    return actionHistory.filter((h) => h.complaintId === complaintId);
  }
  return [...actionHistory];
}

export function getStatusHistory(complaintId?: string): StatusHistory[] {
  if (complaintId) {
    return statusHistory.filter((h) => h.complaintId === complaintId);
  }
  return [...statusHistory];
}

export function getAssignmentHistory(complaintId?: string): AssignmentHistory[] {
  if (complaintId) {
    return assignmentHistory.filter((h) => h.complaintId === complaintId);
  }
  return [...assignmentHistory];
}

export function resetDemoData(): void {
  complaints = [...COMPLAINTS];
  users = [...USERS];
  currentUser = sessionUserId
    ? { ...(users.find((u) => u.id === sessionUserId) ?? USERS[0]) }
    : USERS[0];
  overlapAlerts = detectOverlaps(complaints, INSTITUTIONS);
  refreshDerivedFields();
  actionHistory = [...SEED_ACTION_HISTORY];
  statusHistory = [...SEED_STATUS_HISTORY];
  assignmentHistory = [...SEED_ASSIGNMENT_HISTORY];
  historyCounter = 0;
  notify();
}

export function updateComplaintStatus(
  complaintId: string,
  newStatus: ComplaintStatus,
  changedBy: string,
  reason: string
): { success: boolean; error?: string } {
  const complaint = complaints.find((c) => c.id === complaintId);
  if (!complaint) {
    return { success: false, error: "Complaint not found" };
  }

  const config = getConfig();
  const validTransitions = config.validTransitions[complaint.status];
  if (!validTransitions || !validTransitions.includes(newStatus)) {
    return {
      success: false,
      error: `Cannot transition from "${complaint.status}" to "${newStatus}"`,
    };
  }

  const oldStatus = complaint.status;
  complaint.status = newStatus;
  complaint.lastActionDate = new Date().toISOString().split("T")[0];
  refreshDerivedFields();

  recordStatusChange(complaintId, oldStatus, newStatus, changedBy, reason);
  recordAction(
    complaintId,
    "status_change",
    `Status changed to ${newStatus}. Reason: ${reason}`,
    changedBy,
    { fromStatus: oldStatus, toStatus: newStatus, reason }
  );

  overlapAlerts = detectOverlaps(complaints, INSTITUTIONS, overlapAlerts);

  notify();
  return { success: true };
}

export function assignOfficer(
  complaintId: string,
  officerId: string,
  assignedBy: string,
  reason: string
): { success: boolean; error?: string } {
  const complaint = complaints.find((c) => c.id === complaintId);
  if (!complaint) {
    return { success: false, error: "Complaint not found" };
  }

  const officer = users.find((u) => u.id === officerId);
  if (!officer || officer.role !== "bureau_officer") {
    return { success: false, error: "Invalid officer" };
  }

  const oldBureauCode = complaint.bureauCode;
  const oldBureauName = complaint.bureauName;
  const oldOfficerId = complaint.assignedOfficerId;
  const oldOfficerName = complaint.assignedOfficerName;

  complaint.assignedOfficerId = officerId;
  complaint.assignedOfficerName = officer.name;
  complaint.bureauCode = officer.bureauCode!;
  complaint.bureauName = officer.bureauName as import("@/types").BureauName;
  complaint.lastActionDate = new Date().toISOString().split("T")[0];

  recordAssignment(
    complaintId,
    oldBureauCode,
    oldBureauName,
    oldOfficerId,
    oldOfficerName,
    officer.bureauCode!,
    officer.bureauName!,
    officerId,
    officer.name,
    reason,
    assignedBy
  );
  recordAction(
    complaintId,
    "assignment",
    `Assigned to ${officer.name} (${officer.bureauName}). Reason: ${reason}`,
    assignedBy,
    { fromOfficer: oldOfficerName, toOfficer: officer.name, reason }
  );

  refreshDerivedFields();
  overlapAlerts = detectOverlaps(complaints, INSTITUTIONS, overlapAlerts);

  notify();
  return { success: true };
}

export function transferCase(
  complaintId: string,
  toBureauCode: string,
  toOfficerId: string,
  transferReason: string,
  transferredBy: string
): { success: boolean; error?: string } {
  const complaint = complaints.find((c) => c.id === complaintId);
  if (!complaint) {
    return { success: false, error: "Complaint not found" };
  }

  const toOfficer = users.find((u) => u.id === toOfficerId);
  if (!toOfficer || toOfficer.role !== "bureau_officer") {
    return { success: false, error: "Invalid target officer" };
  }

  const bureau = BUREAUS.find((b) => b.code === toBureauCode);
  if (!bureau) {
    return { success: false, error: "Invalid target bureau" };
  }

  const oldStatus = complaint.status;
  const oldBureauCode = complaint.bureauCode;
  const oldBureauName = complaint.bureauName;
  const oldOfficerId = complaint.assignedOfficerId;
  const oldOfficerName = complaint.assignedOfficerName;

  complaint.status = "Transferred";
  complaint.bureauCode = toBureauCode as import("@/types").BureauCode;
  complaint.bureauName = bureau.name as import("@/types").BureauName;
  complaint.assignedOfficerId = toOfficerId;
  complaint.assignedOfficerName = toOfficer.name;
  complaint.lastActionDate = new Date().toISOString().split("T")[0];

  recordAssignment(
    complaintId,
    oldBureauCode,
    oldBureauName,
    oldOfficerId,
    oldOfficerName,
    toBureauCode as import("@/types").BureauCode,
    bureau.name,
    toOfficerId,
    toOfficer.name,
    transferReason,
    transferredBy
  );
  recordAction(
    complaintId,
    "transfer",
    `Transferred to ${bureau.name} (${toOfficer.name}). Reason: ${transferReason}`,
    transferredBy,
    { fromBureau: oldBureauName, toBureau: bureau.name, reason: transferReason }
  );
  recordStatusChange(complaintId, oldStatus, "Transferred", transferredBy, transferReason);

  refreshDerivedFields();
  overlapAlerts = detectOverlaps(complaints, INSTITUTIONS, overlapAlerts);

  notify();
  return { success: true };
}

export function canUserChangeComplaint(complaint: Complaint): boolean {
  const user = getCurrentUser();
  if (user.role === "admin") return true;
  if (user.role === "oversight_officer") return false;
  if (user.role === "bureau_officer") {
    return complaint.bureauCode === user.bureauCode;
  }
  return false;
}