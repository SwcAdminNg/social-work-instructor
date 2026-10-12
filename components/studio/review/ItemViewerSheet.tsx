"use client";

// In-depth view of one course item for a reviewer: the document rendered inline,
// the video playing, the link, the live-session details or the full assessment.
// Documents/videos are fetched through the revision-scoped endpoint so a reviewer
// never needs to be enrolled or own the course.

import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { HlsVideoPlayer } from "@/components/learning/HlsVideoPlayer";
import { Sheet } from "@/components/ui/overlays";
import { Button, Callout, Skeleton } from "@/components/ui/primitives";
import { studioApi } from "@/lib/studio/api";
import { formatBytes, formatDateTime, formatMinutes } from "@/lib/studio/labels";

export type ViewerItem = {
  id: string;
  title?: string;
  item_type?: string;
  video?: { duration_seconds?: number | null; status?: string; playback_url?: string | null } | null;
  document?: { file_name?: string; mime_type?: string | null; file_size_bytes?: number | null; is_uploaded?: boolean } | null;
  link?: { url?: string; label?: string | null; description?: string | null } | null;
  live_session?: {
    scheduled_start_at?: string;
    duration_minutes?: number;
    guest_name?: string | null;
    guest_title?: string | null;
  } | null;
};

const OFFICE_EXT = /\.(docx?|pptx?|xlsx?)$/i;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg)$/i;

function DocumentViewer({ revisionId, item }: { revisionId: string; item: ViewerItem }) {
  const doc = useQuery({
    queryKey: ["revision-document", revisionId, item.id],
    queryFn: () => studioApi.getRevisionDocument(revisionId, item.id),
    // Presigned URLs are short-lived: never reuse a stale one.
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  if (doc.isPending) return <Skeleton className="h-[70vh] w-full rounded-xl" />;
  if (doc.isError) {
    return (
      <Callout
        tone="danger"
        title="This document couldn't be opened"
        actions={
          <Button size="sm" variant="outline" onClick={() => doc.refetch()}>
            Retry
          </Button>
        }
      >
        {doc.error instanceof Error ? doc.error.message : "Try again in a moment."}
      </Callout>
    );
  }

  const { view_url, download_url, file_name, mime_type, file_size_bytes } = doc.data as typeof doc.data & {
    view_url?: string;
  };
  const src = view_url || download_url;
  const name = file_name || item.document?.file_name || "";
  const mime = (mime_type || item.document?.mime_type || "").toLowerCase();
  const isPdf = mime === "application/pdf" || /\.pdf$/i.test(name);
  const isImage = mime.startsWith("image/") || IMAGE_EXT.test(name);
  const isOffice = OFFICE_EXT.test(name);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm text-slate-600 dark:text-slate-300">
          <FileText className="mr-1.5 inline h-4 w-4 align-text-bottom text-slate-400" />
          {name}
          {file_size_bytes ? ` · ${formatBytes(file_size_bytes)}` : ""}
        </p>
        <div className="flex gap-2">
          <a href={src} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" icon={ExternalLink}>
              New tab
            </Button>
          </a>
          <a href={download_url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" icon={Download}>
              Download
            </Button>
          </a>
        </div>
      </div>

      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="max-h-[75vh] w-full rounded-xl border border-slate-200 object-contain dark:border-ink-line" />
      ) : isPdf ? (
        <iframe title={name || "Document"} src={src} className="h-[75vh] w-full rounded-xl border border-slate-200 bg-white dark:border-ink-line" />
      ) : isOffice ? (
        <iframe
          title={name || "Document"}
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(download_url)}`}
          className="h-[75vh] w-full rounded-xl border border-slate-200 bg-white dark:border-ink-line"
        />
      ) : (
        <Callout tone="info" title="No inline preview for this file type">
          Use <strong>New tab</strong> or <strong>Download</strong> to review it.
        </Callout>
      )}
    </div>
  );
}

function Body({ revisionId, item, extra }: { revisionId: string; item: ViewerItem; extra?: React.ReactNode }) {
  switch (item.item_type) {
    case "DOCUMENT":
      return <DocumentViewer revisionId={revisionId} item={item} />;
    case "VIDEO":
      return item.video?.playback_url ? (
        <div className="overflow-hidden rounded-xl bg-black">
          <HlsVideoPlayer url={item.video.playback_url} className="aspect-video w-full" />
        </div>
      ) : (
        <Callout tone="warning" title="Video not available">
          {item.video?.status && item.video.status !== "READY"
            ? `This video is still ${item.video.status.toLowerCase().replace(/_/g, " ")}.`
            : "No video has been uploaded for this lesson."}
        </Callout>
      );
    case "LINKS":
      return item.link?.url ? (
        <div className="flex flex-col gap-3">
          {item.link.description && <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{item.link.description}</p>}
          <a href={item.link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 break-all text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
            <ExternalLink className="h-4 w-4 flex-shrink-0" />
            {item.link.url}
          </a>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No URL has been set.</p>
      );
    case "LIVE_SESSION": {
      const s = item.live_session;
      return (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Starts</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">{formatDateTime(s?.scheduled_start_at) || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Duration</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">{formatMinutes(s?.duration_minutes) || "-"}</dd>
          </div>
          {s?.guest_name && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Guest</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-100">
                {s.guest_name}
                {s.guest_title ? `, ${s.guest_title}` : ""}
              </dd>
            </div>
          )}
        </dl>
      );
    }
    default:
      return <>{extra}</>;
  }
}

/**
 * Side drawer showing one item in depth. `extra` is rendered for assessments
 * (the caller supplies the questions view it already has).
 */
export function ItemViewerSheet({
  open,
  onOpenChange,
  revisionId,
  item,
  extra,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revisionId: string;
  item: ViewerItem | null;
  extra?: React.ReactNode;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      width="max-w-4xl"
      title={item?.title || "Lesson"}
      description={item?.item_type ? item.item_type.replace(/_/g, " ").toLowerCase() : undefined}
    >
      {open && item ? (
        <Body revisionId={revisionId} item={item} extra={extra} />
      ) : (
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      )}
    </Sheet>
  );
}
