"use client";

import { Button } from "@/components/ui/primitives";

/** Sticky "Unsaved changes" bar shown at the bottom of a dirty form. */
export function SaveBar({
  visible,
  saving,
  onSave,
  onDiscard,
  message = "You have unsaved changes",
  saveLabel = "Save changes",
}: {
  visible: boolean;
  saving?: boolean;
  onSave: () => void;
  onDiscard: () => void;
  message?: React.ReactNode;
  saveLabel?: string;
}) {
  if (!visible) return null;
  return (
    <div className="sticky bottom-4 z-30 animate-pop-in">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)] backdrop-blur sm:flex-row sm:items-center dark:border-ink-line dark:bg-ink-raised/95">
        <p className="flex flex-1 items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          {message}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDiscard} disabled={saving} className="flex-1 sm:flex-none">
            Discard
          </Button>
          <Button size="sm" onClick={onSave} loading={saving} className="flex-1 sm:flex-none">
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
