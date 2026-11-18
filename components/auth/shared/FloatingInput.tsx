"use client";

import { forwardRef, useState } from "react";
import { AlertCircle, ArrowBigUp } from "lucide-react";

type Props = {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  suffix?: React.ReactNode;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
  error?: string;
  /** Short help shown under the field and read with it. */
  hint?: React.ReactNode;
  /** Extra content under the field (e.g. a password checklist); linked for screen readers. */
  describedById?: string;
  /** Show a Caps Lock warning while typing (password fields). */
  capsLockWarning?: boolean;
  maxLength?: number;
};

export const FloatingInput = forwardRef<HTMLInputElement, Props>(function FloatingInput(
  {
    id,
    label,
    type,
    value,
    onChange,
    icon,
    suffix,
    autoComplete,
    inputMode,
    required,
    error,
    hint,
    describedById,
    capsLockWarning,
    maxLength,
  },
  ref,
) {
  const [capsOn, setCapsOn] = useState(false);
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const capsId = capsLockWarning && capsOn ? `${id}-caps` : undefined;
  const describedBy = [errorId, hintId, capsId, describedById].filter(Boolean).join(" ") || undefined;

  const trackCaps = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (capsLockWarning) setCapsOn(event.getModifierState?.("CapsLock") ?? false);
  };

  return (
    <div>
      <label htmlFor={id} className="swc-label-text">
        {label}
      </label>
      <div className="relative">
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${
            error ? "text-red-700 dark:text-red-300" : "text-swc-ink-3"
          }`}
        >
          {icon}
        </span>

        <input
          ref={ref}
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          inputMode={inputMode}
          required={required}
          aria-required={required || undefined}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          maxLength={maxLength}
          autoCapitalize={type === "email" || autoComplete?.startsWith("username") ? "none" : undefined}
          spellCheck={type === "email" || type === "password" || autoComplete?.startsWith("username") ? false : undefined}
          onBlur={() => setCapsOn(false)}
          onKeyDown={trackCaps}
          onKeyUp={trackCaps}
          onChange={(e) => onChange(e.target.value)}
          className={`swc-input min-h-[50px] pl-11 ${suffix ? "pr-12" : ""} ${
            error ? "border-red-600 dark:border-red-400" : "hover:border-swc-ink-3"
          }`}
        />

        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2">{suffix}</span>}
      </div>

      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-[0.86rem] font-medium text-red-700 dark:text-red-300">
          <AlertCircle size={15} className="mt-[2px] flex-none" aria-hidden="true" />
          {error}
        </p>
      )}
      {capsId && (
        <p id={capsId} className="mt-1.5 flex items-center gap-1.5 text-[0.86rem] font-medium text-amber-800 dark:text-amber-300" aria-live="polite">
          <ArrowBigUp size={15} aria-hidden="true" /> Caps Lock is on
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-[0.86rem] text-swc-ink-3">
          {hint}
        </p>
      )}
    </div>
  );
});
