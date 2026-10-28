"use client";

import { Menu } from "lucide-react";

interface HeaderProps {
  currentUser: { name: string; email: string; role: string };
  onRoleChange: (role: string) => void;
  availableRoles: { label: string; value: string }[];
  onMobileMenuToggle: () => void;
}

export function Header({
  currentUser,
  onRoleChange,
  availableRoles,
  onMobileMenuToggle,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuToggle}
            className="flex items-center justify-center w-9 h-9 rounded-sm border border-border text-ink-muted hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Toggle navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold text-sm tracking-tight uppercase">INST</span>
            <span className="text-ink font-semibold text-sm tracking-tight uppercase">IT360</span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="hidden sm:block text-xs text-ink-muted">
            {currentUser.name} &bull; {currentUser.role.replace("_", " ")}
          </span>
          <select
            value={currentUser.role}
            onChange={(e) => onRoleChange(e.target.value)}
            className="w-auto px-2 py-1.5 text-xs bg-surface border border-border rounded-sm focus:outline-none focus:border-primary sm:min-w-[150px]"
          >
            {availableRoles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}