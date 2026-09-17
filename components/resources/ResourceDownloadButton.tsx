"use client";

import { Download } from "lucide-react";
import { useState } from "react";

type ResourceDownloadButtonProps = {
  slug: string;
  attachmentId: string;
};

export function ResourceDownloadButton({
  slug,
  attachmentId,
}: ResourceDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/proxy/resources/${slug}/attachments/${attachmentId}/download`,
      );
      const json = await res.json().catch(() => ({}));

      if (res.status === 403) {
        setError("This file is locked or view-only.");
        return;
      }

      const downloadUrl = json?.download_url || json?.data?.download_url;

      if (!res.ok) {
        setError(json?.message || "Download is not available right now.");
        return;
      }

      if (!downloadUrl) {
        setError("Download is not available right now.");
        return;
      }

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.rel = "noopener noreferrer";
      link.download = "";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setError("Download is not available right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isLoading}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#b7e4c7] px-3 text-sm font-extrabold text-[#2D6A4F] transition hover:bg-[#f0fbf5] disabled:cursor-wait disabled:opacity-70 dark:border-[#27433a] dark:text-[#b7e4c7] dark:hover:bg-[#183026]"
      >
        <Download className="h-4 w-4" />
        {isLoading ? "Preparing..." : "Download"}
      </button>
      {error && (
        <p className="max-w-60 text-xs font-semibold text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}
    </div>
  );
}
