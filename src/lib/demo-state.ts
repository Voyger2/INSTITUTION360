import type {
  Complaint,
  ComplaintStatus,
  User,
  DemoConfig,
  ActionHistory,
  AssignmentHistory,
  StatusHistory,
} from "@/types";
import { COMPLAINTS, USERS, DEMO_CONFIG, BUREAUS, INSTITUTIONS } from "@/data/demo-data";
import { detectOverlaps } from "@/lib/overlap-detection";
import { calculateMetrics } from "@/lib/formatting";

let complaints: Complaint[] = [...COMPLAINTS];
let users: User[] = [...USERS];
let currentUser: User = USERS[0]; // Default to admin
let overlapAlerts: ReturnType<typeof detectOverlaps> = [];
let metrics = calculateMetrics(complaints);

let actionHistory: ActionHistory[] = [];
let statusHistory: StatusHistory[] = [];
let assignmentHistory: AssignmentHistory[] = [];

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
    performedBy,
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
    changedBy,
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
    transferredBy,
    transferredAt: new Date().toISOString(),
    isDemoData: true,
  });
}

export function getComplaints(): Complaint[] {
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
  metrics = calculateMetrics(complaints);
  overlapAlerts = detectOverlaps(complaints, INSTITUTIONS);
  notify();
}

export function getMetrics() {
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
  metrics = calculateMetrics(complaints);
  actionHistory = [];
  statusHistory = [];
  assignmentHistory = [];
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
  complaint.isOverdue = new Date(complaint.expectedDisposalDate) < new Date();
  complaint.daysOverdue = complaint.isOverdue
    ? Math.ceil(
        (new Date().getTime() - new Date(complaint.expectedDisposalDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  recordStatusChange(complaintId, oldStatus, newStatus, changedBy, reason);
  recordAction(
    complaintId,
    "status_change",
    `Status changed to ${newStatus}. Reason: ${reason}`,
    changedBy,
    { fromStatus: oldStatus, toStatus: newStatus, reason }
  );

  metrics = calculateMetrics(complaints);
  overlapAlerts = detectOverlaps(complaints, INSTITUTIONS);

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

  metrics = calculateMetrics(complaints);
  overlapAlerts = detectOverlaps(complaints, INSTITUTIONS);

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

  metrics = calculateMetrics(complaints);
  overlapAlerts = detectOverlaps(complaints, INSTITUTIONS);

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