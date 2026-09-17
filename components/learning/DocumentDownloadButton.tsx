"use client";

import { useState } from "react";
import { Download } from "lucide-react";

type DocumentDownloadButtonProps = {
  courseId: string;
  itemId: string;
};

export function DocumentDownloadButton({
  courseId,
  itemId,
}: DocumentDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/proxy/courses/${courseId}/items/${itemId}/download`,
      );
      const json = await res.json().catch(() => ({}));

      if (res.status === 403) {
        setError("This handout is view-only.");
        return;
      }

      if (!res.ok || !json?.download_url) {
        setError(json?.message || "Download is not available right now.");
        return;
      }

      window.open(json.download_url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Download is not available right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isLoading}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-[#b7e4c7] px-3 text-sm font-bold text-[#2D6A4F] transition hover:bg-[#f0fbf5] disabled:cursor-wait disabled:opacity-70 dark:border-[#27433a] dark:text-[#b7e4c7] dark:hover:bg-[#183026]"
      >
        <Download className="h-4 w-4" />
        {isLoading ? "Preparing..." : "Download"}
      </button>
      {error && (
        <p className="max-w-52 text-xs font-semibold text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}
    </div>
  );
}
