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
  const [focused, setFocused] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const lifted = focused || value.length > 0;
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const capsId = capsLockWarning && capsOn ? `${id}-caps` : undefined;
  const describedBy = [errorId, hintId, capsId, describedById].filter(Boolean).join(" ") || undefined;

  const trackCaps = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (capsLockWarning) setCapsOn(event.getModifierState?.("CapsLock") ?? false);
  };

  return (
    <div>
      <div className="relative">
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-[1.15rem] top-1/2 -translate-y-1/2 transition-colors duration-300 ${
            error ? "text-red-500 dark:text-red-400" : focused ? "text-[#2D6A4F] dark:text-[#95d5b2]" : "text-gray-400 dark:text-gray-500"
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
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setCapsOn(false);
          }}
          onKeyDown={trackCaps}
          onKeyUp={trackCaps}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" "
          className={`peer h-16 w-full rounded-[20px] border-[1.5px] bg-white pb-1.5 pl-12 pt-6 text-base text-ink outline-none transition-[border-color,box-shadow,background-color] duration-300 placeholder-transparent dark:bg-[#0e1913] ${
            suffix ? "pr-12" : "pr-4"
          } ${
            error
              ? "border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.12)] dark:border-red-400"
              : focused
                ? "border-[#2D6A4F] shadow-[0_0_0_5px_rgba(45,106,79,0.16)] dark:border-[#74c69d] dark:shadow-[0_0_0_5px_rgba(116,198,157,0.16)]"
                : "border-ink/15 hover:border-ink/35 dark:border-white/15 dark:hover:border-white/30"
          }`}
        />

        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-12 select-none transition-all duration-300 ease-sw ${
            lifted
              ? "top-[11px] text-[0.74rem] font-semibold tracking-wide text-accent"
              : "top-1/2 -translate-y-1/2 text-base text-ink-3"
          }`}
        >
          {label}
        </label>

        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{suffix}</span>}
      </div>

      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-[0.84rem] font-medium text-red-600 dark:text-red-400">
          <AlertCircle size={15} className="mt-[2px] flex-none" aria-hidden="true" />
          {error}
        </p>
      )}
      {capsId && (
        <p id={capsId} className="mt-1.5 flex items-center gap-1.5 text-[0.84rem] font-medium text-amber-700 dark:text-amber-300" aria-live="polite">
          <ArrowBigUp size={15} aria-hidden="true" /> Caps Lock is on
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-[0.84rem] text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
});
