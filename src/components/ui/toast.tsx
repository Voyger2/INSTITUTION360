"use client";

import * as React from "react";

interface ToastProps {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  duration?: number;
  onDismiss: () => void;
}

const typeStyles: Record<string, string> = {
  success: "border-l-4 border-success",
  error: "border-l-4 border-error",
  info: "border-l-4 border-info",
  warning: "border-l-4 border-warning",
};

const typeIcons: Record<string, React.ReactNode> = {
  success: (
    <svg className="h-4 w-4 text-success" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-4 w-4 text-error" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="h-4 w-4 text-info" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-4 w-4 text-warning" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

export function Toast({
  type,
  title,
  message,
  duration = 5000,
  onDismiss,
}: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => onDismiss(), duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-sm border shadow-sm bg-surface min-w-[20rem] max-w-[28rem] ${typeStyles[type]}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0 mt-0.5">{typeIcons[type]}</div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="text-sm text-ink-muted mt-1">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 w-6 h-6 rounded-sm border-none bg-transparent text-ink-subtle hover:bg-background hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Dismiss toast"
      >
        <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}