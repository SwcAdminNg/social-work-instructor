"use client";

import { useId, useRef } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button, Field, cn } from "@/components/ui/primitives";

/**
 * Edits a list of short strings (learning outcomes, requirements, materials).
 * Enter adds a new line below; Backspace on an empty line removes it.
 * Empty lines are kept while editing — strip them with `cleanList` on save.
 */
export function StringListField({
  label,
  hint,
  error,
  value,
  onChange,
  placeholder,
  addLabel = "Add another",
  max = 30,
  maxLength = 300,
  disabled,
  icon: Icon,
  optional,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  max?: number;
  maxLength?: number;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  optional?: boolean;
}) {
  const id = useId();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const rows = value.length ? value : [""];

  function focus(i: number) {
    requestAnimationFrame(() => refs.current[i]?.focus());
  }

  function update(i: number, text: string) {
    const next = [...rows];
    next[i] = text;
    onChange(next);
  }

  function insertAfter(i: number) {
    if (rows.length >= max) return;
    const next = [...rows];
    next.splice(i + 1, 0, "");
    onChange(next);
    focus(i + 1);
  }

  function remove(i: number) {
    const next = rows.filter((_, j) => j !== i);
    onChange(next);
    focus(Math.max(0, i - 1));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    focus(j);
  }

  return (
    <Field label={label} hint={hint} error={error} optional={optional} htmlFor={`${id}-0`}>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {rows.map((text, i) => (
          <li key={i} className="group flex items-center gap-2">
            <span
              className={cn(
                "grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-xs font-bold",
                text.trim()
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-400/12 dark:text-brand-300"
                  : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500",
              )}
              aria-hidden
            >
              {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={2.2} /> : i + 1}
            </span>
            <input
              id={`${id}-${i}`}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={text}
              disabled={disabled}
              maxLength={maxLength}
              placeholder={i === 0 ? placeholder : undefined}
              aria-label={`${typeof label === "string" ? label : "Item"} ${i + 1}`}
              onChange={(e) => update(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (text.trim()) insertAfter(i);
                } else if (e.key === "Backspace" && !text && rows.length > 1) {
                  e.preventDefault();
                  remove(i);
                }
              }}
              className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-400/15 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-ink-line dark:bg-ink-page/60 dark:text-white dark:placeholder:text-slate-500"
            />
            <div className="flex flex-shrink-0 items-center opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
              <Button
                variant="ghost"
                size="xs"
                iconOnly
                icon={ArrowUp}
                aria-label="Move up"
                disabled={disabled || i === 0}
                onClick={() => move(i, -1)}
                className="hidden sm:inline-flex"
              />
              <Button
                variant="ghost"
                size="xs"
                iconOnly
                icon={ArrowDown}
                aria-label="Move down"
                disabled={disabled || i === rows.length - 1}
                onClick={() => move(i, 1)}
                className="hidden sm:inline-flex"
              />
              <Button
                variant="ghost"
                size="xs"
                iconOnly
                icon={X}
                aria-label="Remove"
                disabled={disabled || (rows.length === 1 && !text)}
                onClick={() => (rows.length === 1 ? onChange([]) : remove(i))}
              />
            </div>
          </li>
        ))}
      </ol>
      {rows.length < max && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            icon={Plus}
            disabled={disabled}
            onClick={() => insertAfter(rows.length - 1)}
            className="-ml-2 text-brand-700 dark:text-brand-300"
          >
            {addLabel}
          </Button>
        </div>
      )}
    </Field>
  );
}

/** Trim and drop empty entries before sending to the API. */
export function cleanList(list: string[]) {
  return list.map((s) => s.trim()).filter(Boolean);
}
