"use client";

import * as React from "react";

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
}

export function Badge({ className = "", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-semibold whitespace-nowrap border ${className}`}
    >
      {children}
    </span>
  );
}