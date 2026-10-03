"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { cn, Spinner } from "@/components/ui/primitives";

/**
 * Click-to-edit text. Enter or blur saves, Escape cancels. Renders plain text
 * when disabled so read-only screens carry no edit affordance.
 */
export function InlineText({
  value,
  onSave,
  disabled,
  placeholder = "Untitled",
  maxLength = 255,
  ariaLabel,
  className,
  inputClassName,
}: {
  value: string;
  onSave: (next: string) => Promise<unknown> | unknown;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  ariaLabel: string;
  className?: string;
  inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  function begin() {
    if (disabled) return;
    setDraft(value);
    setEditing(true);
  }

  async function commit() {
    const next = draft.trim();
    if (!next || next === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  if (editing || saving) {
    return (
      <span className={cn("relative flex min-w-0 flex-1 items-center", className)}>
        <input
          autoFocus
          aria-label={ariaLabel}
          value={draft}
          maxLength={maxLength}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setDraft(value);
              setEditing(false);
            }
          }}
          className={cn(
            "w-full min-w-0 rounded-lg border border-brand-300 bg-white px-2 py-1 pr-8 text-inherit outline-none ring-4 ring-brand-400/15 dark:border-brand-400/60 dark:bg-ink-page/60",
            inputClassName,
          )}
        />
        <span className="pointer-events-none absolute right-2 text-brand-600 dark:text-brand-300">
          {saving ? <Spinner className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" strokeWidth={2.4} />}
        </span>
      </span>
    );
  }

  if (disabled) {
    return <span className={cn("min-w-0 truncate", className)}>{value || placeholder}</span>;
  }

  return (
    <button
      type="button"
      onClick={begin}
      aria-label={`${ariaLabel}: ${value || placeholder}. Click to rename`}
      className={cn(
        "group/inline -mx-1.5 inline-flex min-w-0 max-w-full cursor-text items-center gap-2 rounded-lg px-1.5 py-0.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-white/6",
        className,
      )}
    >
      <span className={cn("min-w-0 truncate", !value && "text-slate-400")}>{value || placeholder}</span>
      <Pencil
        className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 opacity-0 transition-opacity group-hover/inline:opacity-100 group-focus-visible/inline:opacity-100"
        strokeWidth={2}
      />
    </button>
  );
}
