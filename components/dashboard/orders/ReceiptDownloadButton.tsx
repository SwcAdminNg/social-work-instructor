"use client";

import { Download } from "lucide-react";
import { useState } from "react";

type ReceiptDownloadButtonProps = {
  reference: string;
};

export function ReceiptDownloadButton({ reference }: ReceiptDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/proxy/payments/transactions/${encodeURIComponent(reference)}/receipt`,
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Receipt is not available right now.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = getReceiptFilename(res.headers, reference);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Receipt is not available right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isLoading}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#b7e4c7] px-3 text-xs font-bold text-[#2D6A4F] transition hover:bg-[#f0fbf5] disabled:cursor-wait disabled:opacity-70 dark:border-[#27433a] dark:text-[#b7e4c7] dark:hover:bg-[#183026]"
      >
        <Download className="h-4 w-4" />
        {isLoading ? "Preparing..." : "Download receipt"}
      </button>
      {error && (
        <p className="max-w-56 text-xs font-semibold text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}
    </div>
  );
}

function getReceiptFilename(headers: Headers, reference: string) {
  const contentDisposition = headers.get("content-disposition");
  const filename = contentDisposition?.match(/filename="?([^"]+)"?/i)?.[1];

  return filename || `Receipt-${reference}.pdf`;
}
