"use client";

import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

export function Input({
  className = "",
  label,
  hint,
  error,
  required,
  id: idProp,
  ...props
}: InputProps) {
  const generatedId = React.useId();
  const inputId = idProp ?? generatedId;
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-ink"
        >
          {label}{required && " <span class='text-error'>*</span>"}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 text-sm text-ink bg-surface border border-border rounded-sm transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light ${error ? "border-error focus:border-error focus:ring-error-bg" : ""} ${className}`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {hint && (
        <p id={`${inputId}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}