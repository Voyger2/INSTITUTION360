"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, ShieldAlert } from "lucide-react";
import { useDemoState, useDemoSession } from "@/lib/demo-state-context";
import type { User, UserRole } from "@/types";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "System Administrator",
  bureau_officer: "Bureau / Cell Officer",
  oversight_officer: "Oversight Officer (read-only)",
};

export function LoginForm() {
  const { users, signInDemo, addToast } = useDemoState();
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});
  const [status, setStatus] = React.useState<"idle" | "loading">("idle");
  const alreadySignedIn = useDemoSession();

  const enterDemo = (user: User) => {
    const ok = signInDemo(user.id);
    if (!ok) return;
    addToast({
      type: "info",
      title: "Demo session started",
      message: `Signed in as ${user.name} (${ROLE_LABELS[user.role]}). No real account was authenticated.`,
    });
    router.replace("/dashboard");
  };

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Enter your username or demo email address.";
    if (!password) next.password = "Enter your demonstration password.";
    else if (email.trim()) {
      const match = users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (!match) {
        next.email =
          "This prototype recognises only the listed demo AICTE accounts. Choose one below or enter its email exactly.";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    if (!validate()) return;
    setStatus("loading");
    // Frontend-only demonstration delay. No authentication request is made.
    await new Promise((r) => setTimeout(r, 600));
    const match = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!match) {
      setStatus("idle");
      return;
    }
    enterDemo(match);
  };

  const emailInputClass = errors.email ? "input input-error" : "input";

  return (
    <div className="min-h-dvh flex flex-col bg-background" id="top">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="bg-primary text-white" role="banner">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
            <span className="font-bold text-lg tracking-tight uppercase">
              INSTITUTION360
            </span>
            <span className="badge badge-warning" title="Frontend prototype with synthetic data">
              DEMONSTRATION PROTOTYPE
            </span>
          </div>
          <p className="text-sm text-white/85 mt-1 max-w-2xl leading-snug">
            AICTE Institution Complaint Monitoring — an integrated dashboard for
            registering, routing and disposing of institution-related complaint
            cases across AICTE bureaus and cells (SIH 2026, SIH26264).
          </p>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 sm:py-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <section className="lg:col-span-2 card">
            <div className="card-body">
              <h1 className="text-xl font-semibold text-ink">Sign in to the prototype</h1>
              <p className="text-sm text-ink-muted mt-1">
                Demonstration sign-in only. No real authentication is performed and
                no credentials are collected, validated or stored by this prototype.
              </p>

              {alreadySignedIn && (
                <div className="mt-3 border border-info-border bg-info-bg text-info text-sm rounded-sm p-3">
                  A demo session is already active. Signing in again switches the
                  demo account and resets in-memory role selection.
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
                <div>
                  <label htmlFor="login-email" className="label">
                    Username or email
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    className={emailInputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? "login-email-error" : undefined}
                    placeholder="e.g. rajesh.kumar@aicte.gov.in"
                  />
                  {errors.email && (
                    <p id="login-email-error" className="error-text" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="login-password" className="label">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className={errors.password ? "input input-error pr-10" : "input pr-10"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={errors.password ? true : undefined}
                      aria-describedby="login-password-hint login-password-error"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-sm text-ink-muted hover:bg-background focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p id="login-password-hint" className="hint">
                    Demonstration environment: any password value is accepted; the
                    password is not checked or saved.
                  </p>
                  {errors.password && (
                    <p id="login-password-error" className="error-text" role="alert">
                      {errors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-full"
                  disabled={status === "loading"}
                  aria-busy={status === "loading"}
                >
                  {status === "loading" ? (
                    "Signing in…"
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" /> Sign in
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-border text-xs text-ink-muted space-y-2">
                <p className="flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0 text-warning" aria-hidden="true" />
                  <span>
                    This is a front-end demonstration with an in-browser synthetic
                    dataset. A hard page refresh may reset in-memory demo changes.
                  </span>
                </p>
              </div>
            </div>
          </section>

          <section className="lg:col-span-3 space-y-6" aria-labelledby="demo-accounts-heading">
            <div className="card">
              <div className="card-body">
                <h2 id="demo-accounts-heading" className="text-lg font-semibold text-ink">
                  Demo accounts
                </h2>
                <p className="text-sm text-ink-muted mt-1">
                  Pick an account to explore its role view. The sign-in form accepts
                  any listed demo email with any password, or use the quick buttons
                  below to enter the demonstration workspace.
                </p>
                <ul className="mt-4 divide-y divide-border border border-border rounded-md">
                  {users.map((u) => (
                    <li
                      key={u.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{u.name}</p>
                        <p className="text-xs text-ink-muted font-mono">{u.email}</p>
                        <p className="mt-1">
                          <span
                            className={`badge ${
                              u.role === "admin"
                                ? "badge-primary"
                                : u.role === "bureau_officer"
                                  ? "badge-info"
                                  : "badge-success"
                            }`}
                          >
                            {ROLE_LABELS[u.role]}
                          </span>
                          {u.bureauName && (
                            <span className="text-xs text-ink-muted ml-2">
                              {u.bureauName}
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm self-start sm:self-auto"
                        onClick={() => enterDemo(u)}
                      >
                        Enter demo account
                        <span className="sr-only"> for {u.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h2 className="text-lg font-semibold text-ink">
                  Help, support &amp; accessibility
                </h2>
                <ul className="mt-2 text-sm text-ink-muted space-y-2 list-disc list-outside pl-5">
                  <li>
                    <span className="text-ink font-medium">Getting started:</span> after
                    sign-in, every screen offers left navigation, page headings, filters
                    and action links; the Overview dashboard explains the case flow.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Support:</span> this prototype
                    is part of an SIH 2026 team submission — contact the project team
                    via the event platform.
                  </li>
                  <li>
                    <span className="text-ink font-medium">Accessibility:</span> keyboard
                    navigation is supported across the portal (Tab, Enter, Esc to close
                    dialogs), a skip-to-content link is provided, focus indicators are
                    always visible, and status labels use text in addition to colour.
                  </li>
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/help" className="btn btn-ghost btn-sm">
                    Help &amp; guide (after sign-in)
                  </Link>
                  <Link href="#top" className="btn btn-ghost btn-sm">
                    Back to top
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-surface border-t border-border" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-ink-muted leading-relaxed">
          <p>
            <strong className="text-ink">Prototype notice.</strong> INSTITUTION360 is a
            student prototype for SIH26264. It is not affiliated with, endorsed by, or
            commissioned by AICTE, and it does not represent any official government
            service. All names, complaint cases and institution records shown are
            synthetic demonstration data (“isDemoData: true throughout”). No real
            credentials, personal data or live AICTE systems are involved.
          </p>
        </div>
      </footer>
    </div>
  );
}
