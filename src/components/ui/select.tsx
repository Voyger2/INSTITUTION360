"use client";

import * as React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}

export function Select({
  className = "",
  label,
  hint,
  error,
  required,
  options,
  id: idProp,
  ...props
}: SelectProps) {
  const generatedId = React.useId();
  const selectId = idProp ?? generatedId;
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-ink">
          {label}{required && " <span class='text-error'>*</span>"}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-3 py-2 text-sm text-ink bg-surface border border-border rounded-sm appearance-none transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light ${error ? "border-error focus:border-error focus:ring-error-bg" : ""} pr-10 ${className}`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && (
        <p id={`${selectId}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${selectId}-error`} className="text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}