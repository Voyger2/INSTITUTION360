"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { useDemoSession } from "@/lib/demo-state-context";

function ShellLoading() {
  return (
    <div className="card p-5" aria-busy="true">
      <div className="h-5 w-48 bg-background rounded-sm mb-3" />
      <div className="h-4 w-72 bg-background rounded-sm mb-6" />
      <div className="h-32 w-full bg-background rounded-sm" />
      <p className="text-sm text-ink-muted mt-4">Loading portal&hellip;</p>
    </div>
  );
}

export default function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const signedIn = useDemoSession();

  React.useEffect(() => {
    if (!signedIn) {
      router.replace("/login");
    }
  }, [signedIn, router]);

  return (
    <React.Suspense fallback={<ShellLoading />}>
      <MainLayout>{children}</MainLayout>
    </React.Suspense>
  );
}
