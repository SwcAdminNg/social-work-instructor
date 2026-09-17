"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ExternalLink, Link2 } from "lucide-react";
import { MarkCompleteButton } from "./MarkCompleteButton";

type LinkResourcePanelProps = {
  courseId: string;
  itemId: string;
  title: string;
  url: string;
  label?: string | null;
  description?: string | null;
  isCompleted?: boolean | null;
};

export function LinkResourcePanel({
  courseId,
  itemId,
  title,
  url,
  label,
  description,
  isCompleted,
}: LinkResourcePanelProps) {
  const router = useRouter();
  const [isMarking, setIsMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const displayLabel = label || title;

  async function openResource() {
    setError(null);
    window.open(url, "_blank", "noopener,noreferrer");

    if (isCompleted || isMarking) return;

    setIsMarking(true);
    try {
      const res = await fetch(
        `/api/proxy/learning/courses/${courseId}/items/${itemId}/complete`,
        { method: "POST" },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Unable to update progress.");
      }
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update progress.",
      );
    } finally {
      setIsMarking(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#dceee4] bg-white shadow-sm dark:border-[#27433a] dark:bg-[#111525]">
      <div className="border-b border-[#dceee4] bg-[#fbfefd] px-4 py-3 dark:border-[#27433a] dark:bg-[#0f1726] sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-[#e7f6ee] text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
              <Link2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#2D6A4F] dark:text-[#b7e4c7]">
                External resource
              </p>
              <h2 className="mt-0.5 line-clamp-2 text-base font-extrabold text-slate-950 dark:text-white">
                {displayLabel}
              </h2>
            </div>
          </div>
          {isCompleted && (
            <span className="inline-flex h-9 items-center gap-2 rounded-md bg-[#e7f6ee] px-3 text-sm font-extrabold text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
              <CheckCircle className="h-4 w-4" />
              Complete
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6">
        {description && (
          <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </p>
        )}
        <div className="rounded-md border border-[#edf5f0] bg-[#f7fcf9] p-4 dark:border-[#24372e] dark:bg-[#0f1726]">
          <p className="truncate text-sm font-semibold text-slate-500 dark:text-slate-400">
            {url}
          </p>
        </div>
        {error && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={openResource}
            disabled={isMarking}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-4 text-sm font-extrabold text-white shadow-sm shadow-[#2D6A4F]/20 transition hover:bg-[#1B4332] disabled:cursor-wait disabled:opacity-75 dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
          >
            <ExternalLink className="h-4 w-4" />
            {isMarking ? "Opening..." : "Open resource"}
          </button>
          {!isCompleted && (
            <MarkCompleteButton
              courseId={courseId}
              itemId={itemId}
              isCompleted={false}
              className="h-11"
            />
          )}
        </div>
      </div>
    </section>
  );
}
