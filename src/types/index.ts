export type BureauCode = "RB" | "PGRC" | "APC" | "EOA" | "NWRO" | "SWRO" | "SCRO" | "NCRO" | "CRO" | "WRO";

export type BureauName =
  | "Regulation Bureau"
  | "Public Grievance Redressal Cell"
  | "Approval Process Cell"
  | "Expert Opinion Assessment"
  | "North Western Regional Office"
  | "South Western Regional Office"
  | "South Central Regional Office"
  | "North Central Regional Office"
  | "Central Regional Office"
  | "Western Regional Office";

export type RegionCode =
  | "NW"
  | "SW"
  | "SC"
  | "NC"
  | "C"
  | "W"
  | "NE"
  | "E"
  | "N"
  | "S";

export type RegionName =
  | "North Western"
  | "South Western"
  | "South Central"
  | "North Central"
  | "Central"
  | "Western"
  | "North Eastern"
  | "Eastern"
  | "Northern"
  | "Southern";

export type ComplaintStatus =
  | "Received"
  | "Under Process"
  | "Action Initiated"
  | "Pending Clarification"
  | "Referred to Bureau"
  | "Disposed"
  | "Transferred"
  | "Rejected"
  | "Closed";

export type ComplaintCategory =
  | "Approval Process Violation"
  | "Infrastructure Deficiency"
  | "Faculty Shortage"
  | "Admission Irregularity"
  | "Fee Structure Violation"
  | "Academic Quality"
  | "Grievance Redressal"
  | "Document Verification"
  | "Compliance Failure"
  | "Other";

export type ComplaintPriority = "High" | "Medium" | "Low";

export type UserRole = "admin" | "bureau_officer" | "oversight_officer";

export type AlertStatus = "new" | "reviewed" | "related" | "not_overlapping" | "coordination_required";

export type AlertReviewDecision = "reviewed" | "related" | "not_overlapping" | "coordination_required";

export interface Bureau {
  code: BureauCode;
  name: BureauName;
  region: RegionCode;
  description: string;
}

export interface Region {
  code: RegionCode;
  name: RegionName;
  bureaus: BureauCode[];
}

export interface Institution {
  id: string;
  aictePermanentId: string;
  name: string;
  region: RegionCode;
  state: string;
  district: string;
  type: "University" | "Deemed University" | "Institute of National Importance" | "Government" | "Government Aided" | "Private" | "Autonomous" | "State University";
  establishedYear: number;
  address: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  isDemoData: boolean;
}

export interface Complaint {
  id: string;
  caseId: string;
  institutionId: string;
  institutionName: string;
  institutionAicteId: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  bureauCode: BureauCode;
  bureauName: BureauName;
  assignedOfficerId: string;
  assignedOfficerName: string;
  status: ComplaintStatus;
  receivedDate: string;
  expectedDisposalDate: string;
  lastActionDate: string;
  description: string;
  isOverdue: boolean;
  daysOverdue: number;
  isDemoData: boolean;
}

export interface AssignmentHistory {
  id: string;
  complaintId: string;
  fromBureauCode: BureauCode | null;
  fromBureauName: string | null;
  fromOfficerId: string | null;
  fromOfficerName: string | null;
  toBureauCode: BureauCode;
  toBureauName: BureauName;
  toOfficerId: string;
  toOfficerName: string;
  transferReason: string;
  transferredBy: string;
  transferredAt: string;
  isDemoData: boolean;
}

export interface StatusHistory {
  id: string;
  complaintId: string;
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  changedBy: string;
  changedAt: string;
  reason: string;
  isDemoData: boolean;
}

export interface ActionHistory {
  id: string;
  complaintId: string;
  actionType: "status_change" | "assignment" | "transfer" | "clarification_requested" | "clarification_received" | "escalation" | "note";
  description: string;
  performedBy: string;
  performedAt: string;
  metadata?: Record<string, unknown>;
  isDemoData: boolean;
}

export interface OverlapAlert {
  id: string;
  institutionId: string;
  institutionName: string;
  institutionAicteId: string;
  caseIds: string[];
  bureauCodes: BureauCode[];
  bureauNames: BureauName[];
  statuses: ComplaintStatus[];
  latestActionDates: string[];
  matchReasons: string[];
  detectedAt: string;
  alertStatus: AlertStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewDecision?: AlertReviewDecision;
  reviewReason?: string;
  isDemoData: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  bureauCode?: BureauCode;
  bureauName?: BureauName;
  region?: RegionCode;
  isDemoData: boolean;
}

export interface DemoConfig {
  deadlineThresholds: {
    warningDays: number;
    overdueDays: number;
  };
  statusDefinitions: Record<ComplaintStatus, { label: string; description: string; isActive: boolean; isFinal: boolean }>;
  validTransitions: Record<ComplaintStatus, ComplaintStatus[]>;
}

export interface DashboardMetrics {
  totalCases: number;
  pendingCases: number;
  underProcessCases: number;
  disposedCases: number;
  transferredCases: number;
  overdueCases: number;
  overlapAlerts: number;
}

export interface BureauWorkload {
  bureauCode: BureauCode;
  bureauName: BureauName;
  totalCases: number;
  activeCases: number;
  overdueCases: number;
  avgDisposalDays: number;
}

export interface StatusDistribution {
  status: ComplaintStatus;
  count: number;
  percentage: number;
}

export interface RegionDistribution {
  regionCode: RegionCode;
  regionName: RegionName;
  totalCases: number;
  activeCases: number;
  overdueCases: number;
}

export interface InstitutionCaseHistory {
  institution: Institution;
  complaints: Complaint[];
  totalCases: number;
  activeCases: number;
  disposedCases: number;
  overlapAlerts: OverlapAlert[];
}

export interface ReportData {
  bureauWise: BureauWorkload[];
  regionWise: RegionDistribution[];
  statusWise: StatusDistribution[];
  pendingAgeing: { bucket: string; count: number }[];
  overdueCases: Complaint[];
  institutionWise: { institutionId: string; institutionName: string; totalCases: number; activeCases: number; disposedCases: number }[];
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortState {
  column: string;
  direction: "asc" | "desc";
}

export interface FilterState {
  search: string;
  bureauCode?: BureauCode;
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  regionCode?: RegionCode;
  dateFrom?: string;
  dateTo?: string;
  isOverdue?: boolean;
  hasOverlap?: boolean;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  duration?: number;
}

export interface DialogState<T = unknown> {
  isOpen: boolean;
  data?: T;
  title: string;
  description?: string;
}