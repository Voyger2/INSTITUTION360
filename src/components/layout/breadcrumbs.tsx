"use client";

import * as React from "react";

interface BreadcrumbsProps {
  items: { label: string; href?: string }[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-xs text-ink-muted" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.label}>
            {isLast ? (
              <span className="text-ink">{item.label}</span>
            ) : (
              <>
                <span>{item.label}</span>
                <span className="mx-1">/</span>
              </>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}