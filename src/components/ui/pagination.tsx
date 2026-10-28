"use client";

import * as React from "react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pagesToShow = 5;
  const startPage = Math.max(1, Math.min(page - Math.floor(pagesToShow / 2), totalPages - pagesToShow + 1));
  const endPage = Math.min(totalPages, startPage + pagesToShow - 1);

  return (
    <nav className="flex items-center justify-between gap-2" aria-label="Pagination">
      <div className="text-sm text-ink-muted">
        Showing <strong>{(page - 1) * pageSize + 1}</strong> to{" "}
        <strong>{Math.min(page * pageSize, total)}</strong> of <strong>{total}</strong> results
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-sm border border-border text-sm text-ink disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background"
          aria-label="Previous page"
        >
          Previous
        </button>
        {startPage > 1 && (
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-1.5 rounded-sm border border-border text-sm text-ink hover:bg-background"
          >
            1
          </button>
        )}
        {startPage > 2 && <span className="px-2 text-ink-muted">...</span>}
        {[...Array(endPage - startPage + 1)].map((_, i) => {
          const p = startPage + i;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1.5 rounded-sm border text-sm font-medium ${
                page === p
                  ? "bg-primary text-white border-primary"
                  : "text-ink hover:bg-background border-transparent"
              }`}
            >
              {p}
            </button>
          );
        })}
        {endPage < totalPages - 1 && <span className="px-2 text-ink-muted">...</span>}
        {endPage < totalPages && (
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-1.5 rounded-sm border border-border text-sm text-ink hover:bg-background"
          >
            {totalPages}
          </button>
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-sm border border-border text-sm text-ink disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </nav>
  );
}