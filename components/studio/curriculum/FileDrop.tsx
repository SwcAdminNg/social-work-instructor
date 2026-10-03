"use client";

import { useId, useRef, useState } from "react";
import { UploadCloud, type LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/primitives";

/** Drag-and-drop zone that also opens the file picker on click / Enter. */
export function FileDrop({
  accept,
  onFile,
  title = "Drop a file here or browse",
  hint,
  icon: Icon = UploadCloud,
  disabled,
  compact,
  className,
  children,
}: {
  accept?: string;
  onFile: (file: File) => void;
  title?: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function pick(files: FileList | null | undefined) {
    const file = files?.[0];
    if (file && !disabled) onFile(file);
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-labelledby={`${id}-title`}
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          input.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        pick(e.dataTransfer.files);
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed text-center outline-none transition-all focus-visible:ring-4 focus-visible:ring-brand-400/20",
        compact ? "px-4 py-5" : "px-6 py-9",
        over
          ? "border-brand-500 bg-brand-50/80 dark:border-brand-400 dark:bg-brand-400/10"
          : "border-slate-200 bg-slate-50/50 hover:border-brand-300 hover:bg-brand-50/40 dark:border-ink-line dark:bg-white/[0.02] dark:hover:border-brand-400/50 dark:hover:bg-brand-400/5",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
      {children ?? (
        <>
          <span
            className={cn(
              "grid place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200 transition-transform group-hover:-translate-y-0.5 dark:bg-ink-raised dark:text-brand-300 dark:ring-ink-line",
              compact ? "h-9 w-9" : "h-12 w-12",
            )}
          >
            <Icon className={compact ? "h-4.5 w-4.5" : "h-6 w-6"} strokeWidth={1.9} />
          </span>
          <p id={`${id}-title`} className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </p>
          {hint && <p className="max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</p>}
        </>
      )}
    </div>
  );
}
