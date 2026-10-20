"use client";

// Editor panel for a SCORM / interactive-package lesson: package details and
// status, re-upload, a "preview as learner" window and the completion rule.

import { useEffect, useState } from "react";
import { AlertTriangle, Boxes, CheckCircle2, Loader2, Play, RefreshCw } from "lucide-react";
import { Badge, Button, Callout, Switch } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/overlays";
import { ApiError, studioApi } from "@/lib/studio/api";
import { formatBytes } from "@/lib/studio/labels";
import type { Item } from "@/lib/studio/types";
import { FileDrop } from "./FileDrop";
import { useUploads } from "./uploads";
import { UploadProgressCard } from "./VideoUpload";

export const SCORM_ACCEPT = ".zip,application/zip,application/x-zip-compressed";

export function scormVersionLabel(version?: string | null) {
  if (!version) return "Web package";
  if (version === "2004") return "SCORM 2004";
  return `SCORM ${version}`;
}

function PreviewDialog({ itemId, title, onClose }: { itemId: string; title: string; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    studioApi
      .scormPreview(itemId)
      .then((r) => {
        if (!cancelled) setUrl(r.launch_url);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Couldn't open the preview.");
      });
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} size="xl" icon={Play} title="Preview as a learner" description={title}>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Runs in browse mode — nothing you do here is saved or counted as progress.
        </p>
        <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 dark:bg-black dark:ring-ink-line">
          {error ? (
            <div className="grid h-full place-items-center p-6 text-center text-sm text-rose-600 dark:text-rose-300">{error}</div>
          ) : url ? (
            <iframe src={url} title={title} className="h-full w-full border-0" allow="autoplay; fullscreen" allowFullScreen />
          ) : (
            <div className="grid h-full place-items-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

export function ScormPanel({
  item,
  readOnly,
  completionFromPackage,
  onCompletionFromPackage,
}: {
  item: Item;
  readOnly: boolean;
  completionFromPackage: boolean;
  onCompletionFromPackage: (v: boolean) => void;
}) {
  const uploads = useUploads();
  const upload = uploads.get(item.id);
  const [replacing, setReplacing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const pkg = item.scorm ?? {};
  const status = pkg.status ?? "PENDING";

  async function replace(file: File) {
    if (!/\.zip$/i.test(file.name)) return;
    setReplacing(true);
    try {
      const creds = await studioApi.refreshScormUpload(item.id, file.name);
      void uploads.startScorm(item.id, file, creds.upload_url);
    } catch {
      /* the upload manager / run wrapper already surfaces the error */
    } finally {
      setReplacing(false);
    }
  }

  if (upload) return <UploadProgressCard upload={upload} onCancel={upload.phase === "error" ? () => uploads.dismiss(item.id) : undefined} />;

  const details = [
    scormVersionLabel(pkg.scorm_version),
    formatBytes(pkg.total_size_bytes ?? pkg.file_size_bytes),
    pkg.file_count ? `${pkg.file_count} files` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-ink-line dark:bg-white/[0.02]">
        <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-white text-teal-600 shadow-sm ring-1 ring-slate-200 dark:bg-ink-raised dark:text-teal-300 dark:ring-ink-line">
          <Boxes className="h-5 w-5" strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{pkg.manifest_title || pkg.file_name || "Untitled package"}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {[pkg.file_name, details].filter(Boolean).join(" · ") || "No package details yet"}
          </p>
        </div>
        {status === "READY" ? (
          <Badge tone="success" size="xs" icon={CheckCircle2}>
            Ready
          </Badge>
        ) : status === "PROCESSING" ? (
          <Badge tone="info" size="xs" dot pulse>
            Unpacking
          </Badge>
        ) : status === "FAILED" ? (
          <Badge tone="danger" size="xs">
            Failed
          </Badge>
        ) : (
          <Badge tone="warning" size="xs">
            Upload incomplete
          </Badge>
        )}
      </div>

      {status === "READY" && (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" icon={Play} onClick={() => setPreviewing(true)}>
            Preview as a learner
          </Button>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Opens <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] dark:bg-white/10">{pkg.launch_path}</code> inside the lesson page.
          </span>
        </div>
      )}

      {status === "FAILED" && (
        <Callout tone="danger" title="We couldn't unpack this package" icon={AlertTriangle}>
          {pkg.error_message || "The zip could not be read."} Export it again from your authoring tool and upload the new zip below.
        </Callout>
      )}
      {status === "PENDING" && (
        <Callout tone="warning" title="The package never finished uploading">
          Learners will see an empty lesson until a zip is uploaded.
        </Callout>
      )}

      {!readOnly && (
        <FileDrop
          compact
          accept={SCORM_ACCEPT}
          disabled={replacing}
          onFile={replace}
          icon={status === "READY" ? RefreshCw : Boxes}
          title={replacing ? "Preparing the upload…" : status === "READY" ? "Replace the package" : "Upload the package zip"}
          hint="A SCORM 1.2 / 2004 export, or any zipped web page with an index.html. Learners keep their saved progress."
        />
      )}

      <Switch
        checked={completionFromPackage}
        disabled={readOnly}
        onChange={onCompletionFromPackage}
        label="Completion comes from the package"
        description="On: the lesson is complete when the package reports completed or passed. Off: opening the lesson is enough — use this for content that never reports a status."
      />

      {previewing && <PreviewDialog itemId={item.id} title={item.title} onClose={() => setPreviewing(false)} />}
    </div>
  );
}
