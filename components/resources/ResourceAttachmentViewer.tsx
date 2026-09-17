"use client";

import { ExternalLink, FileText } from "lucide-react";
import { HlsVideoPlayer } from "@/components/learning/HlsVideoPlayer";

type ResourceAttachmentViewerProps = {
  attachmentType?: string | null;
  title: string;
  url: string;
  mimeType?: string | null;
  downloadable?: boolean;
};

export function ResourceAttachmentViewer({
  attachmentType,
  title,
  url,
  mimeType,
  downloadable = false,
}: ResourceAttachmentViewerProps) {
  if (attachmentType === "VIDEO") {
    return (
      <div className="mx-auto flex h-[calc(100dvh-112px)] max-w-7xl items-center rounded-lg bg-black shadow-sm">
        <HlsVideoPlayer url={url} className="h-full w-full rounded-lg" />
      </div>
    );
  }

  if (!isPdf(url, mimeType)) {
    return (
      <div className="mx-auto flex h-[calc(100dvh-112px)] max-w-7xl flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-[#dceee4] bg-white p-8 text-center shadow-sm dark:border-[#27433a] dark:bg-[#111525]">
        <FileText className="h-10 w-10 text-slate-400" />
        <div>
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
            No inline preview for this file type
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
            {downloadable
              ? "Open it in a new tab, or use the download button above to save a copy."
              : "This file is view-only. Downloads and external opening are disabled."}
          </p>
        </div>
        {downloadable && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-4 text-sm font-extrabold text-white transition hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
          >
            <ExternalLink className="h-4 w-4" />
            Open document
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto h-[calc(100dvh-112px)] max-w-7xl overflow-hidden rounded-lg border border-[#dceee4] bg-white shadow-sm dark:border-[#27433a] dark:bg-[#111525]">
      <iframe
        src={appendPdfViewerOptions(url)}
        title={title}
        referrerPolicy="no-referrer"
        className="h-full w-full border-0 bg-white"
      />
    </div>
  );
}

function isPdf(url: string, mimeType?: string | null) {
  if (mimeType) return mimeType.toLowerCase() === "application/pdf";
  const withoutQuery = url.split("?")[0]?.toLowerCase() || url.toLowerCase();
  return withoutQuery.endsWith(".pdf");
}

function appendPdfViewerOptions(url: string) {
  const separator = url.includes("#") ? "&" : "#";
  return `${url}${separator}toolbar=0&navpanes=0&scrollbar=0`;
}
