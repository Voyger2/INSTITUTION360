"use client";

import * as React from "react";
import { ToastProvider } from "@/components/ui/toast-provider";
import { DemoStateProvider } from "@/lib/demo-state-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DemoStateProvider>{children}</DemoStateProvider>
    </ToastProvider>
  );
}