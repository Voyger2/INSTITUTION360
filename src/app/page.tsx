"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { isDemoSignedIn } from "@/lib/demo-state";

export default function RootEntry() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace(isDemoSignedIn() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-dvh bg-background p-6"
      aria-busy="true"
    >
      <div className="max-w-md mx-auto card p-5 mt-20">
        <p className="text-sm font-semibold text-ink">INSTITUTION360</p>
        <p className="text-sm text-ink-muted">
          Opening the portal&hellip;
        </p>
        <p className="text-xs text-ink-muted mt-3">
          If you are not redirected automatically, go to{" "}
          <a href="/login" className="text-primary underline">
            the sign-in page
          </a>
          .
        </p>
      </div>
    </main>
  );
}
