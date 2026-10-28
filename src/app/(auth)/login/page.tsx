import * as React from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in — INSTITUTION360 (Prototype)",
  description:
    "Public entry point for the INSTITUTION360 demonstration portal — AICTE institution complaint monitoring (SIH26264). Frontend prototype, synthetic data only.",
};

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <main id="main-content" tabIndex={-1} className="min-h-dvh bg-background p-6" aria-busy="true">
          <div className="max-w-md mx-auto card p-5 mt-20">
            <p className="text-sm font-semibold text-ink">INSTITUTION360</p>
            <p className="text-sm text-ink-muted">Loading sign-in&hellip;</p>
          </div>
        </main>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
