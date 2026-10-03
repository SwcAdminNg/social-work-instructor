"use client";

import { useId, useMemo, useState } from "react";
import { CalendarClock, Download, ExternalLink, Eye, FileText, Flag, Lock, Radio, Trash2, Zap } from "lucide-react";
import { Badge, Button, Callout, Card, cn, Field, Input, Switch, Textarea, toneClasses } from "@/components/ui/primitives";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmDialog, Sheet } from "@/components/ui/overlays";
import { AssessmentEditor } from "@/components/studio/assessments/AssessmentEditor";
import { studioApi } from "@/lib/studio/api";
import { formatBytes, formatDateTime, fromLocalInput, toLocalInput } from "@/lib/studio/labels";
import { itemHealth } from "@/lib/studio/health";
import type { Item, ItemUpdatePayload, Section } from "@/lib/studio/types";
import { useCourseEditor } from "../editor/CourseEditorContext";
import { useDraft } from "../editor/useDraft";
import { FileDrop } from "./FileDrop";
import { itemKind, KIND_META } from "./itemMeta";
import { useUploads } from "./uploads";
import { UploadProgressCard, VideoPanel } from "./VideoUpload";

type Draft = {
  title: string;
  minutes: string;
  is_preview: boolean;
  downloadable: boolean;
  url: string;
  label: string;
  description: string;
  start: string;
  duration: string;
  guest_name: string;
  guest_title: string;
};

function draftFrom(item: Item): Draft {
  return {
    title: item.title ?? "",
    minutes: item.estimated_minutes != null ? String(item.estimated_minutes) : "",
    is_preview: !!item.is_preview,
    downloadable: !!item.document?.downloadable,
    url: item.link?.url ?? "",
    label: item.link?.label ?? "",
    description: item.link?.description ?? "",
    start: toLocalInput(item.live_session?.scheduled_start_at),
    duration: String(item.live_session?.duration_minutes ?? 60),
    guest_name: item.live_session?.guest_name ?? "",
    guest_title: item.live_session?.guest_title ?? "",
  };
}

function PanelCard({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card padded={false} className="p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-sm font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
        {aside}
      </div>
      {children}
    </Card>
  );
}

function DocumentPanel({
  item,
  section,
  readOnly,
  downloadable,
  onDownloadable,
  onReplaced,
}: {
  item: Item;
  section: Section;
  readOnly: boolean;
  downloadable: boolean;
  onDownloadable: (v: boolean) => void;
  onReplaced: (newId: string) => void;
}) {
  const { courseId, run } = useCourseEditor();
  const uploads = useUploads();
  const upload = uploads.get(item.id);
  const [replacing, setReplacing] = useState(false);
  const doc = item.document ?? {};

  // There is no re-upload endpoint for an existing document item, so recovery
  // recreates the item in the same place with the same settings.
  async function replace(file: File) {
    setReplacing(true);
    const created = await run(
      () =>
        studioApi.createItem(courseId, section.id, {
          title: item.title,
          item_type: "DOCUMENT",
          order_index: item.order_index,
          is_preview: !!item.is_preview,
          estimated_minutes: item.estimated_minutes ?? null,
          file_name: file.name,
          downloadable: !!doc.downloadable,
        }),
      { refresh: false },
    );
    if (!created?.document_upload?.upload_url) {
      setReplacing(false);
      return;
    }
    const ok = await uploads.startDocument(created.id, file, created.document_upload.upload_url);
    if (ok) {
      await run(async () => {
        await studioApi.deleteItem(item.id);
        return true;
      });
      onReplaced(created.id);
    }
    setReplacing(false);
  }

  if (upload) return <UploadProgressCard upload={upload} onCancel={upload.phase === "error" ? () => uploads.dismiss(item.id) : undefined} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-ink-line dark:bg-white/[0.02]">
        <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-white text-sky-600 shadow-sm ring-1 ring-slate-200 dark:bg-ink-raised dark:text-sky-300 dark:ring-ink-line">
          <FileText className="h-5 w-5" strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{doc.file_name || "Untitled file"}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {[formatBytes(doc.file_size_bytes), doc.mime_type?.split("/").pop()?.toUpperCase()].filter(Boolean).join(" · ") || "No file details yet"}
          </p>
        </div>
        {doc.is_uploaded ? (
          <Badge tone="success" size="xs">
            Uploaded
          </Badge>
        ) : (
          <Badge tone="warning" size="xs">
            Upload incomplete
          </Badge>
        )}
      </div>

      {!doc.is_uploaded && (
        <div className="flex flex-col gap-3">
          <Callout tone="warning" title="The file never finished uploading">
            Learners will see an empty document.{" "}
            {readOnly
              ? "Once editing is available again, upload the file again here."
              : "Upload it again below — we'll recreate this lesson in the same place with the same settings and remove the incomplete one."}
          </Callout>
          {!readOnly && (
            <FileDrop
              compact
              disabled={replacing}
              onFile={replace}
              icon={FileText}
              title={replacing ? "Re-creating the lesson…" : "Upload the file again"}
              hint="Drop it here or browse."
            />
          )}
        </div>
      )}

      <Switch
        checked={downloadable}
        disabled={readOnly}
        onChange={onDownloadable}
        label={
          <span className="inline-flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5 text-slate-400" /> Allow learners to download
          </span>
        }
        description="When off, learners can read it in the browser but not save a copy."
      />
    </div>
  );
}

function ItemEditorBody({
  item,
  section,
  onClose,
  onOpenItem,
}: {
  item: Item;
  section: Section;
  onClose: () => void;
  onOpenItem: (id: string) => void;
}) {
  const { run, readOnly, lockReason, lifecycle } = useCourseEditor();
  const uid = useId();
  const base = useMemo(() => draftFrom(item), [item]);
  const draft = useDraft(base);
  const v = draft.values;
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const kind = itemKind(item);
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const operationalBlocked = lockReason === "archived" || lockReason === "live-layer";
  const liveStatus = item.live_session?.status ?? "SCHEDULED";
  const canEditLive = !operationalBlocked && liveStatus === "SCHEDULED";
  const issues = itemHealth(item, section.title, section.id);

  async function save() {
    const e: typeof errors = {};
    const dirty = draft.dirtyKeys;
    const payload: ItemUpdatePayload = {};
    for (const k of dirty) {
      switch (k) {
        case "title":
          if (!v.title.trim()) e.title = "A title is required.";
          else payload.title = v.title.trim();
          break;
        case "minutes":
          if (v.minutes && !/^\d+$/.test(v.minutes)) e.minutes = "Use whole minutes.";
          else payload.estimated_minutes = v.minutes ? Number(v.minutes) : null;
          break;
        case "is_preview":
          payload.is_preview = v.is_preview;
          break;
        case "downloadable":
          payload.downloadable = v.downloadable;
          break;
        case "url": {
          try {
            const u = new URL(v.url.trim());
            if (!/^https?:$/.test(u.protocol)) throw new Error();
            payload.url = v.url.trim();
          } catch {
            e.url = "Enter a full web address starting with https://";
          }
          break;
        }
        case "label":
          payload.label = v.label.trim() || null;
          break;
        case "description":
          payload.description = v.description.trim() || null;
          break;
        case "start": {
          const iso = fromLocalInput(v.start);
          if (!iso) e.start = "Pick a date and time.";
          else if (new Date(iso).getTime() <= Date.now()) e.start = "Choose a time in the future.";
          else payload.scheduled_start_at = iso;
          break;
        }
        case "duration": {
          const d = Number(v.duration);
          if (!Number.isInteger(d) || d < 5 || d > 600) e.duration = "Between 5 and 600 minutes.";
          else payload.duration_minutes = d;
          break;
        }
        case "guest_name":
          payload.guest_name = v.guest_name.trim() || null;
          break;
        case "guest_title":
          payload.guest_title = v.guest_title.trim() || null;
          break;
      }
    }
    setErrors(e);
    if (Object.keys(e).length || !Object.keys(payload).length) return;
    const liveOnly = Object.keys(payload).every((k) => ["scheduled_start_at", "duration_minutes", "guest_name", "guest_title"].includes(k));
    setSaving(true);
    const ok = await run(
      async () => {
        await studioApi.updateItem(item.id, payload);
        return true;
      },
      {
        success:
          liveOnly && lifecycle === "PUBLISHED"
            ? "Live session updated — learners have been notified"
            : lifecycle === "PUBLISHED"
              ? "Saved to your draft"
              : "Changes saved",
      },
    );
    setSaving(false);
    if (ok) draft.reset();
  }

  const fid = (k: string) => `${uid}-${k}`;

  return (
    <Sheet
      open
      onOpenChange={(o) => !o && onClose()}
      width={kind === "QUIZ" || kind === "QUIZ_GROUP" || kind === "ESSAY" ? "max-w-3xl" : "max-w-2xl"}
      title={
        <span className="flex min-w-0 items-center gap-3">
          <span className={cn("grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ring-1 ring-inset", toneClasses(meta.tone))}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </span>
          <span className="truncate">{item.title}</span>
        </span>
      }
      description={
        <>
          {meta.label} in <span className="font-medium text-slate-700 dark:text-slate-200">{section.title}</span>
        </>
      }
      headerExtra={
        (item.is_preview || item.assessment?.is_final_assessment || readOnly) && (
          <div className="flex flex-wrap gap-1.5">
            {readOnly && (
              <Badge tone="neutral" size="xs" icon={Lock}>
                View only
              </Badge>
            )}
            {item.assessment?.is_final_assessment && (
              <Badge tone="violet" size="xs" icon={Flag}>
                Final assessment
              </Badge>
            )}
            {item.is_preview && (
              <Badge tone="brand" size="xs" icon={Eye}>
                Free preview
              </Badge>
            )}
          </div>
        )
      }
      footer={
        <>
          {!readOnly && (
            <Button variant="soft-danger" icon={Trash2} onClick={() => setConfirmDelete(true)} className="mr-auto">
              Delete
            </Button>
          )}
          {draft.dirty ? (
            <>
              <span className="mr-1 hidden items-center gap-1.5 text-xs font-semibold text-amber-600 sm:inline-flex dark:text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Unsaved changes
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  draft.reset();
                  setErrors({});
                }}
                disabled={saving}
              >
                Discard
              </Button>
              <Button onClick={save} loading={saving}>
                Save changes
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {issues.length > 0 && (
          <Callout tone={issues.some((i) => i.severity === "error") ? "danger" : "warning"} title="Needs attention before review">
            <ul className="list-disc pl-4">
              {issues.map((i) => (
                <li key={i.message}>{i.message.split(": ").slice(1).join(": ") || i.message}</li>
              ))}
            </ul>
          </Callout>
        )}

        <PanelCard title="Basics">
          <div className="flex flex-col gap-4">
            <Field label="Title" htmlFor={fid("title")} required error={errors.title}>
              <Input
                id={fid("title")}
                value={v.title}
                maxLength={255}
                disabled={readOnly}
                invalid={!!errors.title}
                onChange={(e) => draft.set("title", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[10rem_1fr] sm:items-start">
              <Field label="Time to complete" htmlFor={fid("min")} error={errors.minutes}>
                <Input
                  id={fid("min")}
                  type="number"
                  min={0}
                  value={v.minutes}
                  disabled={readOnly}
                  placeholder="Minutes"
                  onChange={(e) => draft.set("minutes", e.target.value)}
                />
              </Field>
              <Switch
                className="sm:pt-7"
                checked={v.is_preview}
                disabled={readOnly}
                onChange={(val) => draft.set("is_preview", val)}
                label="Free preview"
                description="Anyone can open this before enrolling — a great way to show what the course is like."
              />
            </div>
          </div>
        </PanelCard>

        {kind === "VIDEO" && (
          <PanelCard title="Video">
            <VideoPanel item={item} readOnly={readOnly} />
          </PanelCard>
        )}

        {kind === "DOCUMENT" && (
          <PanelCard title="Document">
            <DocumentPanel
              item={item}
              section={section}
              readOnly={readOnly}
              downloadable={v.downloadable}
              onDownloadable={(val) => draft.set("downloadable", val)}
              onReplaced={onOpenItem}
            />
          </PanelCard>
        )}

        {kind === "LINKS" && (
          <PanelCard
            title="Link"
            aside={
              item.link?.url ? (
                <a
                  href={item.link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 no-underline hover:underline dark:text-brand-300"
                >
                  Open <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : undefined
            }
          >
            <div className="flex flex-col gap-4">
              <Field label="Web address" htmlFor={fid("url")} required error={errors.url}>
                <Input id={fid("url")} type="url" value={v.url} disabled={readOnly} invalid={!!errors.url} onChange={(e) => draft.set("url", e.target.value)} />
              </Field>
              <Field label="Button label" htmlFor={fid("label")} optional>
                <Input id={fid("label")} value={v.label} disabled={readOnly} placeholder="Open link" onChange={(e) => draft.set("label", e.target.value)} />
              </Field>
              <Field label="Short description" htmlFor={fid("desc")} optional>
                <Textarea id={fid("desc")} rows={2} value={v.description} disabled={readOnly} onChange={(e) => draft.set("description", e.target.value)} />
              </Field>
            </div>
          </PanelCard>
        )}

        {kind === "LIVE_SESSION" && (
          <PanelCard
            title="Live session"
            aside={
              <Badge tone={liveStatus === "LIVE" ? "danger" : liveStatus === "SCHEDULED" ? "info" : "neutral"} size="xs" icon={liveStatus === "LIVE" ? Radio : CalendarClock}>
                {liveStatus === "SCHEDULED" ? "Scheduled" : liveStatus === "LIVE" ? "Live now" : liveStatus === "ENDED" ? "Ended" : "Cancelled"}
              </Badge>
            }
          >
            <div className="flex flex-col gap-4">
              {liveStatus !== "SCHEDULED" ? (
                <Callout tone="neutral" icon={Lock}>
                  This session {liveStatus === "LIVE" ? "is running now" : liveStatus === "ENDED" ? "has ended" : "was cancelled"}, so its time and guest can no
                  longer be changed.
                </Callout>
              ) : operationalBlocked ? (
                <Callout tone="neutral" icon={Lock}>
                  Scheduling is locked while you&apos;re viewing {lockReason === "archived" ? "an archived course" : "the live version"}.
                </Callout>
              ) : (
                <Callout tone="brand" icon={Zap}>
                  Time, length and guest changes apply straight away — no review needed
                  {lifecycle === "PUBLISHED" ? " — and enrolled learners are notified." : "."}
                </Callout>
              )}
              <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
                <Field
                  label="Starts at"
                  htmlFor={fid("start")}
                  error={errors.start}
                  hint={item.live_session?.scheduled_start_at ? `Currently ${formatDateTime(item.live_session.scheduled_start_at)}` : "Your local time."}
                >
                  <DatePicker
                    id={fid("start")}
                    value={v.start}
                    onChange={(value) => draft.set("start", value)}
                    min={new Date()}
                    disabled={!canEditLive}
                    invalid={!!errors.start}
                    title="When does the session start?"
                  />
                </Field>
                <Field label="Length (minutes)" htmlFor={fid("dur")} error={errors.duration}>
                  <Input
                    id={fid("dur")}
                    type="number"
                    min={5}
                    max={600}
                    step={5}
                    value={v.duration}
                    disabled={!canEditLive}
                    invalid={!!errors.duration}
                    onChange={(e) => draft.set("duration", e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Guest speaker" htmlFor={fid("gn")} optional>
                  <Input id={fid("gn")} value={v.guest_name} disabled={!canEditLive} onChange={(e) => draft.set("guest_name", e.target.value)} />
                </Field>
                <Field label="Guest's role" htmlFor={fid("gt")} optional>
                  <Input id={fid("gt")} value={v.guest_title} disabled={!canEditLive} onChange={(e) => draft.set("guest_title", e.target.value)} />
                </Field>
              </div>
            </div>
          </PanelCard>
        )}

        {item.item_type === "ASSESSMENT" && <AssessmentEditor item={item} sectionId={section.id} />}

        {readOnly && kind !== "LIVE_SESSION" && (
          <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Lock className="h-3.5 w-3.5" /> Editing is paused for this course, so this lesson is view-only.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete “${item.title}”?`}
        description={
          item.item_type === "ASSESSMENT"
            ? "The assessment and all of its questions will be removed from this module."
            : lifecycle === "PUBLISHED"
              ? "It's removed from your draft. Learners keep seeing it until the update is approved."
              : "It will be removed from this module."
        }
        confirmLabel="Delete"
        onConfirm={async () => {
          const ok = await run(
            async () => {
              await studioApi.deleteItem(item.id);
              return true;
            },
            { success: `${meta.label} deleted` },
          );
          if (!ok) throw new Error("failed");
          onClose();
        }}
      />
    </Sheet>
  );
}

/** Right-hand drawer for editing one curriculum item. */
export function ItemEditorSheet({
  item,
  section,
  onClose,
  onOpenItem,
}: {
  item: Item | null;
  section: Section | null;
  onClose: () => void;
  onOpenItem: (id: string) => void;
}) {
  if (!item || !section) return null;
  // Remount per item so the form starts from that item's values.
  return <ItemEditorBody key={item.id} item={item} section={section} onClose={onClose} onOpenItem={onOpenItem} />;
}
