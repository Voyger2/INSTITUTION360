"use client";

import * as React from "react";
import { Bell, LogOut, Menu, X, LayoutDashboard, Building2, FileText, AlertTriangle, BarChart3, Settings, ClipboardList, User, CircleHelp, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDemoState } from "@/lib/demo-state-context";
import type { UserRole } from "@/types";

const DEMO_ROLE_LABELS: Record<UserRole, string> = {
  admin: "System Administrator",
  bureau_officer: "Bureau Officer",
  oversight_officer: "Oversight Officer",
};

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  badge?: number;
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const session = useDemoState();
  const { currentUser, signOutDemo, complaints, overlapAlerts } = session;
  const router = useRouter();
  const pathname = usePathname();

  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);

  const activeCases = complaints.filter(
    (c) =>
      c.isOverdue &&
      !["Disposed", "Closed", "Rejected", "Transferred"].includes(c.status)
  );
  const newAlerts = overlapAlerts.filter(
    (a) => (a as { alertStatus?: string }).alertStatus === "new"
  );
  const notificationCount = activeCases.length + newAlerts.length;

  const handleSignOut = () => {
    signOutDemo();
    router.replace("/login");
  };

  React.useEffect(() => {
    if (!isProfileOpen) return;
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isProfileOpen]);

  React.useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  const NAV_ITEMS: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/complaints", label: "Complaints", icon: FileText },
    { href: "/institutions", label: "Institutions", icon: Building2 },
    { href: "/overlaps", label: "Overlap Alerts", icon: AlertTriangle, badge: newAlerts.length },
    { href: "/notifications", label: "Notifications", icon: Bell, badge: notificationCount },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/audit-log", label: "Audit Log", icon: ClipboardList },
    { href: "/administration", label: "Administration", icon: Settings, adminOnly: true },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/help", label: "Help & Guide", icon: CircleHelp },
  ];

  const roleLabel =
    currentUser.role === "admin"
      ? "System Administrator"
      : currentUser.role === "bureau_officer"
        ? "Bureau Officer"
        : "Oversight Officer";

  const currentPage =
    NAV_ITEMS.find((i) => pathname.startsWith(i.href))?.label ??
    (pathname.startsWith("/complaints/")
      ? "Complaint"
      : pathname.startsWith("/institutions/")
        ? "Institution"
        : "Portal");

  return (
    <div className="flex min-h-dvh bg-background">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <aside
        id="portal-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-surface border-r border-border transform transition-transform duration-200 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Primary"
      >
        <div className="px-4 py-4 border-b border-border bg-primary text-white">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm tracking-tight uppercase">INST</span>
                <span className="text-white font-semibold text-sm tracking-tight uppercase">IT360</span>
              </div>
              <p className="text-xs text-white/80 mt-1 leading-snug">
                AICTE Institution Complaint Monitoring &mdash; Prototype
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close navigation"
              className="lg:hidden inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-white/80 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-2 py-2 overflow-y-auto space-y-1" aria-label="Primary navigation">
          {NAV_ITEMS.filter((item) => !item.adminOnly || currentUser.role === "admin").map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className="sidebar-link justify-between"
                aria-current={isActive ? "page" : undefined}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                {item.badge != null && item.badge > 0 && (
                  <span
                    className="badge badge-error font-mono"
                    aria-label={`${item.badge} new`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-border space-y-3">
          <div>
            <label htmlFor="demo-user-switch" className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Demo user
            </label>
            <select
              id="demo-user-switch"
              value={currentUser.id}
              onChange={(e) => {
                const id = e.target.value;
                if (currentUser.id !== id) {
                  const nextUser =
                    session.users.find((u) => u.id === id) ?? currentUser;
                  session.setCurrentUser(nextUser);
                  router.refresh();
                }
              }}
              className="select mt-1 w-full"
              aria-label="Switch demo user (demonstration only)"
            >
              {session.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {DEMO_ROLE_LABELS[u.role]}
                  {u.bureauName ? ` (${u.bureauName})` : ""}
                </option>
              ))}
            </select>
            <p className="hint">Switching the demo user is demonstration-only and has no backend effect.</p>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink truncate">{currentUser.name}</p>
              <p className="text-xs text-ink-muted truncate">{currentUser.email}</p>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm w-full justify-start" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex min-w-0 flex-col">
        <header
          className="sticky top-0 z-30 bg-surface border-b border-border"
          role="banner"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="portal-sidebar"
                aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
                className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-sm border border-border text-ink-muted hover:bg-background"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="hidden sm:block">
                <nav aria-label="Breadcrumb" className="text-xs text-ink-muted">
                  <ol className="flex items-center gap-1">
                    <li>
                      <Link href="/" className="hover:text-primary hover:underline">
                        Portal
                      </Link>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li aria-current="page" className="font-medium text-ink">
                      {currentPage}
                    </li>
                  </ol>
                </nav>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="badge badge-info hidden md:inline-flex" title="Demonstration environment with synthetic data">
                DEMO DATA
              </span>
              <Link
                href="/notifications"
                className="relative inline-flex items-center justify-center w-9 h-9 rounded-sm border border-border text-ink-muted hover:bg-background"
                aria-label={`Notifications${notificationCount > 0 ? ` — ${notificationCount} new` : ""}`}
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <span
                    className="absolute top-0.5 right-0.5 inline-flex items-center justify-center h-4 min-w-4 px-0.5 text-[10px] font-bold text-white bg-error rounded-full"
                    aria-hidden="true"
                  >
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </Link>

              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-2 py-1.5 rounded-sm border border-border hover:bg-background"
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                  onClick={() => setIsProfileOpen((v) => !v)}
                >
                  <span className="text-left leading-tight">
                    <span className="block text-xs font-medium text-ink">{currentUser.name}</span>
                    <span className="block text-[10px] text-ink-muted">{roleLabel}</span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
                </button>
                {isProfileOpen && (
                  <div
                    role="menu"
                    aria-label="Profile"
                    className="absolute right-0 mt-1 w-56 bg-surface border border-border rounded-md shadow-md py-2"
                  >
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-xs font-medium text-ink">{currentUser.name}</p>
                      <p className="text-xs text-ink-muted">{currentUser.email}</p>
                      {currentUser.bureauName && (
                        <p className="text-xs text-ink-muted mt-1">{currentUser.bureauName}</p>
                      )}
                      <p className="text-xs text-ink-muted">{roleLabel}</p>
                    </div>
                    <Link
                      href="/profile"
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-background"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="h-4 w-4" /> View profile
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-bg"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden"
        >
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>

        <footer className="border-t border-border px-4 py-3 text-xs text-ink-muted" role="contentinfo">
          INSTITUTION360 is an independent demonstration prototype (SIH26264) with synthetic data. Not connected to AICTE production systems; demo changes reset on page refresh. See{" "}
          <Link href="/help" className="text-primary hover:underline">Help</Link> for details.
        </footer>
      </div>
    </div>
  );
}

