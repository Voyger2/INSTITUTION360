"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FileText,
  AlertTriangle,
  BarChart3,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/institutions", label: "Institutions", icon: Building2 },
  { href: "/complaints", label: "Complaints", icon: FileText },
  { href: "/overlaps", label: "Overlap Alerts", icon: AlertTriangle },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/administration", label: "Administration", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { name: string; email: string; role: string };
  onRoleChange: (role: string) => void;
  availableRoles: { label: string; value: string }[];
}

export function Sidebar({
  isOpen,
  onClose,
  currentUser,
  onRoleChange,
  availableRoles,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border transform transition-transform duration-200 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      aria-label="Main navigation"
    >
      <div className="flex flex-col h-full">
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold text-sm tracking-tight uppercase">INST</span>
            <span className="text-ink font-semibold text-sm tracking-tight uppercase">IT360</span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            AICTE Complaint Monitoring
          </p>
        </div>

        <nav className="flex-1 px-2 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-ink-muted hover:bg-background hover:text-ink"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-border">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
              Demo Role
            </label>
            <select
              value={currentUser.role}
              onChange={(e) => onRoleChange(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-surface border border-border rounded-sm focus:outline-none focus:border-primary"
            >
              {availableRoles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs font-medium text-ink">{currentUser.name}</p>
              <p className="text-xs text-ink-muted">{currentUser.email}</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full justify-start"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Collapse sidebar
          </Button>
        </div>
      </div>
    </aside>
  );
}