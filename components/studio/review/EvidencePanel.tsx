"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileText, Link2, Paperclip, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Callout, Card, CardHeader, EmptyState, Field, Input, ProgressBar, Segmented, Skeleton } from "@/components/ui/primitives";
import { studioApi, uploadToSignedUrl } from "@/lib/studio/api";
import { formatBytes, formatDateTime, relativeTime } from "@/lib/studio/labels";
import { qk } from "@/lib/studio/queryKeys";
import type { RevisionEvidence } from "@/lib/studio/types";
import { errorMessage, personName } from "./utils";

export type EvidencePanelProps = {
  revisionId: string;
  /** Show "Add evidence" (`ATTACH_EVIDENCE` in available_actions). */
  canAttach: boolean;
  className?: string;
};

/** Supporting files and links attached to a revision (§7.7). */
export function EvidencePanel({ revisionId, canAttach, className }: EvidencePanelProps) {
  const query = useQuery({
    queryKey: qk.evidence(revisionId),
    queryFn: () => studioApi.listEvidence(revisionId),
    staleTime: 15_000,
  });
  const [adding, setAdding] = useState(false);
  const list = query.data ?? [];

  return (
    <Card className={className}>
      <CardHeader
        icon={Paperclip}
        title="Evidence"
        description="Sources, policies and sign-offs that support this change."
        actions={
          canAttach && !adding ? (
            <Button size="sm" variant="secondary" icon={Plus} onClick={() => setAdding(true)}>
              Add
            </Button>
          ) : undefined
        }
      />
      {adding && <AddEvidence revisionId={revisionId} onDone={() => setAdding(false)} />}

      <div className={adding ? "mt-4" : undefined}>
        {query.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : query.isError ? (
          <Callout
            tone="danger"
            title="Evidence didn't load"
            actions={
              <Button size="sm" variant="outline" onClick={() => query.refetch()}>
                Retry
              </Button>
            }
          >
            {errorMessage(query.error)}
          </Callout>
        ) : list.length === 0 ? (
          !adding && (
            <EmptyState
              compact
              icon={Paperclip}
              title="No evidence attached"
              description={canAttach ? "Attach a source document or link reviewers can check." : "Nothing has been attached to this revision."}
            />
          )
        ) : (
          <ul className="flex flex-col gap-2">
            {list.map((e) => (
              <EvidenceRow key={e.id} evidence={e} />
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function EvidenceRow({ evidence: e }: { evidence: RevisionEvidence }) {
  const href = e.download_url || e.url;
  const isLink = !!e.url && !e.file_name;
  const Icon = isLink ? Link2 : FileText;
  const incomplete = !isLink && e.is_uploaded === false;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 dark:border-ink-line dark:bg-ink-raised/40">
      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{e.title || e.file_name || e.url}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400" title={formatDateTime(e.created_at)}>
          {[isLink ? safeHost(e.url) : e.file_name, formatBytes(e.file_size_bytes), personName(e.uploaded_by, ""), relativeTime(e.created_at)]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      {incomplete ? (
        <Badge size="xs" tone="warning">
          Upload incomplete
        </Badge>
      ) : (
        href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${e.title ?? "evidence"}`}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/8 dark:hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )
      )}
    </li>
  );
}

function safeHost(url?: string) {
  try {
    return url ? new URL(url).host : "";
  } catch {
    return url ?? "";
  }
}

function AddEvidence({ revisionId, onDone }: { revisionId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"file" | "link">("file");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const valid = title.trim().length > 0 && (mode === "link" ? /^https?:\/\/\S+$/i.test(url.trim()) : !!file);

  async function save() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "link") {
        await studioApi.addEvidenceLink(revisionId, { title: title.trim(), url: url.trim() });
      } else if (file) {
        const signed = await studioApi.evidenceUploadUrl(revisionId, {
          title: title.trim(),
          file_name: file.name,
          content_type: file.type || undefined,
        });
        setProgress(0);
        await uploadToSignedUrl(signed.upload_url, file, setProgress);
        await studioApi.finalizeEvidence(signed.evidence_id, { mime_type: file.type || undefined, file_size_bytes: file.size });
      }
      await queryClient.invalidateQueries({ queryKey: qk.evidence(revisionId) });
      toast.success("Evidence added");
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-ink-line dark:bg-white/[0.02]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Segmented
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { key: "file", label: "Upload file", icon: Upload },
            { key: "link", label: "Add link", icon: Link2 },
          ]}
        />
        <Button size="xs" variant="ghost" iconOnly icon={X} aria-label="Cancel" onClick={onDone} disabled={busy} />
      </div>
      <div className="flex flex-col gap-3">
        <Field label="Title" required htmlFor="evidence-title">
          <Input id="evidence-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Working Together 2026, chapter 3" />
        </Field>
        {mode === "link" ? (
          <Field label="Link" required htmlFor="evidence-url" hint="Starts with https://">
            <Input id="evidence-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
          </Field>
        ) : (
          <Field label="File" required>
            <input ref={fileRef} type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 text-left text-sm hover:border-brand-400 dark:border-ink-line dark:bg-ink-page/40"
            >
              <Upload className="h-4 w-4 text-slate-400" />
              {file ? (
                <span className="min-w-0 truncate font-medium text-slate-800 dark:text-slate-100">
                  {file.name} <span className="text-slate-400">· {formatBytes(file.size)}</span>
                </span>
              ) : (
                <span className="text-slate-500">Choose a file…</span>
              )}
            </button>
          </Field>
        )}
        {progress !== null && <ProgressBar value={progress} />}
        {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-300">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onDone} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} loading={busy} disabled={!valid}>
            {mode === "link" ? "Add link" : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
}
