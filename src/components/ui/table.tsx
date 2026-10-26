"use client";

import * as React from "react";

interface TableProps {
  columns: { key: string; label: string; sortable?: boolean }[];
  data: Record<string, unknown>[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  rowKey?: string;
  className?: string;
}

export function Table({
  columns,
  data,
  onSort,
  sortKey,
  sortDirection,
  rowKey = "id",
  className = "",
}: TableProps) {
  if (data.length === 0) {
    return (
      <div className="table-container">
        <table className="table w-full">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="text-sm font-semibold text-ink border-border">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-ink-muted">
                No records found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`}>
      <table className="table w-full">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-sm font-semibold text-ink border-border sticky top-0 z-10 ${col.sortable ? "cursor-pointer select-none hover:bg-background" : ""}`}
                onClick={() => col.sortable && onSort && onSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span className="text-ink-subtle">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={String(row[rowKey])} className="hover:bg-background">
              {columns.map((col) => (
                <td key={col.key} className="text-sm text-ink border-border p-3">
                  {row[col.key] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}