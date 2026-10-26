"use client";

import * as React from "react";
import { useToast } from "@/components/ui/toast-provider";
import {
  getComplaints,
  setComplaints,
  getMetrics,
  getOverlapAlerts,
  updateAlertStatus,
  getUsers,
  getCurrentUser,
  setCurrentUser,
  getConfig,
  getBureaus,
  getInstitutions,
  getActionHistory,
  getStatusHistory,
  getAssignmentHistory,
  resetDemoData,
  updateComplaintStatus,
  assignOfficer,
  transferCase,
  canUserChangeComplaint,
  isDemoSignedIn,
  signInDemo,
  signOutDemo,
  subscribeDemoState,
} from "@/lib/demo-state";
import type { User, Complaint, ComplaintStatus, AlertReviewDecision, DemoConfig, Bureau, Institution, ActionHistory, StatusHistory, AssignmentHistory } from "@/types";

interface DemoStateContextProps {
  children: React.ReactNode;
}

interface DemoStateValue {
  version: number;
  complaints: Complaint[];
  setComplaints: (c: Complaint[]) => void;
  getMetrics: () => { totalCases: number; pendingCases: number; underProcessCases: number; disposedCases: number; transferredCases: number; overdueCases: number; overlapAlerts: number };
  overlapAlerts: Record<string, unknown>[];
  updateAlertStatus: (id: string, decision: AlertReviewDecision, reason?: string, reviewedBy?: string) => boolean;
  users: User[];
  currentUser: User;
  setCurrentUser: (u: User) => void;
  config: DemoConfig;
  bureaus: Bureau[];
  institutions: Institution[];
  resetDemoData: () => void;
  getActionHistory: (complaintId?: string) => ActionHistory[];
  getStatusHistory: (complaintId?: string) => StatusHistory[];
  getAssignmentHistory: (complaintId?: string) => AssignmentHistory[];
  updateComplaintStatus: (
    id: string,
    status: ComplaintStatus,
    changedBy: string,
    reason: string
  ) => { success: boolean; error?: string };
  assignOfficer: (
    id: string,
    officerId: string,
    assignedBy: string,
    reason: string
  ) => { success: boolean; error?: string };
  transferCase: (
    id: string,
    toBureauCode: string,
    toOfficerId: string,
    reason: string,
    transferredBy: string
  ) => { success: boolean; error?: string };
  canUserChangeComplaint: (c: Complaint) => boolean;
  getCurrentUser: () => User;
  isSignedIn: boolean;
  signInDemo: (userId: string) => boolean;
  signOutDemo: () => void;
  refreshDemoState: () => void;
  addToast: (toast: { type: "success" | "error" | "info" | "warning"; title: string; message: string; duration?: number }) => void;
  removeToast: (id: string) => void;
  toasts: Record<string, unknown>[];
}

const DEMO_STATE_CONTEXT = React.createContext<DemoStateValue | null>(null);

export function DemoStateProvider({ children }: DemoStateContextProps) {
  const { toasts, addToast, removeToast } = useToast();
  const [version, setVersion] = React.useState(0);

  const refreshDemoState = React.useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  React.useEffect(() => {
    const unsubscribe = subscribeDemoState(() => setVersion((v) => v + 1));
    return unsubscribe;
  }, []);

  const value = React.useMemo(
    () => ({
      version,
      complaints: getComplaints(),
      setComplaints,
      getMetrics,
      overlapAlerts: getOverlapAlerts() as unknown as Record<string, unknown>[],
      updateAlertStatus,
      users: getUsers(),
      currentUser: getCurrentUser(),
      setCurrentUser,
      config: getConfig(),
      bureaus: getBureaus(),
      institutions: getInstitutions(),
      resetDemoData,
      getActionHistory,
      getStatusHistory,
      getAssignmentHistory,
      updateComplaintStatus,
      assignOfficer,
      transferCase,
      canUserChangeComplaint,
      getCurrentUser,
      isSignedIn: isDemoSignedIn(),
      signInDemo,
      signOutDemo,
      refreshDemoState,
      addToast,
      removeToast,
      toasts: toasts as unknown as Record<string, unknown>[],
    }),
    [version, toasts, addToast, removeToast, refreshDemoState]
  );

  return (
    <DEMO_STATE_CONTEXT.Provider value={value}>
      {children}
    </DEMO_STATE_CONTEXT.Provider>
  );
}

export function useDemoState() {
  const ctx = React.useContext(DEMO_STATE_CONTEXT);
  if (!ctx) throw new Error("useDemoState must be used within DemoStateProvider");
  return ctx;
}

export function useDemoSession(): boolean {
  const subscribe = React.useCallback((cb: () => void) => subscribeDemoState(cb), []);
  return React.useSyncExternalStore(subscribe, isDemoSignedIn, () => false);
}
