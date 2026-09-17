"use client";

import { useState, forwardRef } from "react";

export const FloatingInput = forwardRef<HTMLInputElement, {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  suffix?: React.ReactNode;
  autoComplete?: string;
  required?: boolean;
  error?: string;
}>(({
  id,
  label,
  type,
  value,
  onChange,
  icon,
  suffix,
  autoComplete,
  required,
  error,
}, ref) => {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className="relative">
      {/* Icon */}
      <span
        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-150 ${
          focused
            ? "text-[#2D6A4F] dark:text-[#52b788]"
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        {icon}
      </span>

      {/* Input */}
      <input
        ref={ref}
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        className={`
          peer w-full h-[54px] pl-11 pr-${suffix ? "11" : "4"} pt-5 pb-1
          rounded-xl border bg-white dark:bg-white/5
          text-[0.9rem] text-gray-900 dark:text-white
          outline-none transition-all duration-150
          placeholder-transparent
          ${
            error
              ? "border-red-500 dark:border-red-400 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]"
              : focused
              ? "border-[#2D6A4F] dark:border-[#52b788] shadow-[0_0_0_3px_rgba(45,106,79,0.12)] dark:shadow-[0_0_0_3px_rgba(82,183,136,0.12)]"
              : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
          }
        `}
      />

      {/* Floating label */}
      <label
        htmlFor={id}
        className={`
          absolute left-11 transition-all duration-150 pointer-events-none select-none
          ${
            lifted
              ? "top-[9px] text-[0.65rem] font-semibold tracking-wide text-[#2D6A4F] dark:text-[#52b788]"
              : "top-1/2 -translate-y-1/2 text-[0.88rem] text-gray-500 dark:text-gray-500"
          }
        `}
      >
        {label}
      </label>

      {/* Suffix (show/hide toggle) */}
      {suffix && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {suffix}
        </span>
      )}

      {/* Inline error */}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1 text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
});
