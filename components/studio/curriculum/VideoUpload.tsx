"use client";

import { AlertTriangle, CheckCircle2, Clock3, Film, Loader2, RotateCcw, X } from "lucide-react";
import { HlsVideoPlayer } from "@/components/learning/HlsVideoPlayer";
import { Badge, Button, Callout, ProgressBar } from "@/components/ui/primitives";
import { formatMinutes } from "@/lib/studio/labels";
import type { Item } from "@/lib/studio/types";
import { FileDrop } from "./FileDrop";
import { useUploads, type UploadState } from "./uploads";

export function UploadProgressCard({ upload, onCancel, onRetry }: { upload: UploadState; onCancel?: () => void; onRetry?: () => void }) {
  const failed = upload.phase === "error";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-ink-line dark:bg-ink-surface">
      <div className="flex items-center gap-3">
        <span
          className={
            failed
              ? "grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/12 dark:text-rose-300"
              : "grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/12 dark:text-brand-300"
          }
        >
          {failed ? <AlertTriangle className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{upload.fileName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {failed
              ? upload.error ?? "Upload failed"
              : upload.phase === "preparing"
                ? "Getting ready…"
                : upload.phase === "finalizing"
                  ? "Finishing up…"
                  : `Uploading · ${upload.progress}% — you can keep working while this runs`}
          </p>
        </div>
        {failed && onRetry && (
          <Button size="sm" variant="secondary" icon={RotateCcw} onClick={onRetry}>
            Try again
          </Button>
        )}
        {onCancel && (
          <Button size="sm" variant="ghost" iconOnly icon={X} aria-label={failed ? "Dismiss" : "Cancel upload"} onClick={onCancel} />
        )}
      </div>
      {!failed && <ProgressBar value={upload.phase === "preparing" ? 2 : upload.progress} className="mt-3" />}
    </div>
  );
}

/** Video status, player and upload/retry for a VIDEO item. */
export function VideoPanel({ item, readOnly }: { item: Item; readOnly: boolean }) {
  const uploads = useUploads();
  const upload = uploads.get(item.id);
  const video = item.video ?? {};
  const status = video.status ?? "PENDING";

  const startUpload = (file: File) => uploads.startVideo(item.id, file, { title: item.title });

  if (upload) {
    return (
<UploadProgressCard upload={upload} onCancel={() => uploads.cancel(item.id)} />
    );
  }

  if (status === "READY" && video.playback_url) {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-black ring-1 ring-slate-200 dark:ring-ink-line">
          <HlsVideoPlayer url={video.playback_url} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Badge tone="success" size="xs" icon={CheckCircle2}>
            Ready to watch
          </Badge>
          {video.duration_seconds ? <span>{formatMinutes(Math.round(video.duration_seconds / 60)) || "Under a minute"} long</span> : null}
          <span className="basis-full sm:basis-auto">To use a different recording, add a new video lesson and delete this one.</span>
        </div>
      </div>
    );
  }

  if (status === "PROCESSING") {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-sky-200 bg-sky-50/70 p-5 dark:border-sky-500/25 dark:bg-sky-500/[0.07]">
        <span className="relative grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-white text-sky-600 shadow-sm dark:bg-ink-raised dark:text-sky-300">
          <Film className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-sky-400/70" />
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-slate-900 dark:text-white">Processing your video</p>
          <p className="mt-0.5 text-slate-600 dark:text-slate-300">
            This usually takes a few minutes. The page updates on its own when it&apos;s ready.
          </p>
        </div>
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className="flex flex-col gap-3">
        <Callout tone="danger" icon={AlertTriangle} title="We couldn't process this video">
          The file may be damaged or in a format we can&apos;t read. Upload it again — MP4 works best.
        </Callout>
        {!readOnly && (
          <FileDrop accept="video/*" onFile={startUpload} icon={RotateCcw} title="Upload the video again" hint="Drop a file here or browse." compact />
        )}
      </div>
    );
  }

  // PENDING — nothing uploaded yet, or an upload is waiting to be picked up.
  return (
    <div className="flex flex-col gap-3">
      {video.bunny_video_guid && (
        <p className="flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          <Clock3 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          Waiting for a video. If you&apos;ve just uploaded one it will show as processing shortly.
        </p>
      )}
      {readOnly ? (
        <Callout tone="warning" icon={Film}>
          No video has been uploaded for this lesson yet.
        </Callout>
      ) : (
        <FileDrop
          accept="video/*"
          onFile={startUpload}
          icon={Film}
          title="Drop your video here or browse"
          hint="MP4, MOV or WebM. Uploads resume automatically if your connection drops."
        />
      )}
    </div>
  );
}
