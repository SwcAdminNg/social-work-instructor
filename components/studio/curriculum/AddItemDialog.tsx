"use client";

import { useId, useState } from "react";
import { ArrowLeft, FileText, Film, Flag, Plus, RefreshCw, X } from "lucide-react";
import { Button, Callout, ChoiceCard, cn, Field, Input, Segmented, Switch, Textarea } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/overlays";
import { ApiError, studioApi } from "@/lib/studio/api";
import { formatBytes, fromLocalInput } from "@/lib/studio/labels";
import type { ItemCreatePayload, Section, SubmissionMode } from "@/lib/studio/types";
import { useCourseEditor } from "../editor/CourseEditorContext";
import { FileDrop } from "./FileDrop";
import { KIND_META, type ItemKind } from "./itemMeta";
import { useUploads } from "./uploads";

const CONTENT_KINDS: ItemKind[] = ["VIDEO", "DOCUMENT", "LINKS", "LIVE_SESSION"];
const ASSESSMENT_KINDS: ItemKind[] = ["QUIZ", "ESSAY", "QUIZ_GROUP"];
const DOC_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf,.odt,.csv,.zip,.png,.jpg,.jpeg";

function titleFromFile(name: string) {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : "";
}

function readVideoMinutes(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(Number.isFinite(v.duration) ? Math.max(1, Math.round(v.duration / 60)) : null);
      };
      v.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      v.src = url;
    } catch {
      resolve(null);
    }
  });
}

type Errors = Partial<Record<string, string>>;

function SelectedFile({ file, onClear }: { file: File; onClear: () => void }) {
  const isVideo = file.type.startsWith("video/");
  const Icon = isVideo ? Film : FileText;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-ink-line dark:bg-ink-raised">
      <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/12 dark:text-brand-300">
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{file.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(file.size)} · uploads in the background after you add it</p>
      </div>
      <Button variant="ghost" size="sm" iconOnly icon={X} aria-label="Remove file" onClick={onClear} />
    </div>
  );
}

export function AddItemDialog({
  section,
  onClose,
  onCreated,
}: {
  section: Section;
  onClose: () => void;
  onCreated: (itemId: string) => void;
}) {
  const { courseId, run, lifecycle } = useCourseEditor();
  const uploads = useUploads();
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;

  const [kind, setKind] = useState<ItemKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Common
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("");
  const [preview, setPreview] = useState(false);
  // Files
  const [file, setFile] = useState<File | null>(null);
  const [downloadable, setDownloadable] = useState(false);
  // Link
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  // Live session
  const [start, setStart] = useState("");
  const [duration, setDuration] = useState("60");
  const [guestName, setGuestName] = useState("");
  const [guestTitle, setGuestTitle] = useState("");
  // Assessment
  const [passMark, setPassMark] = useState("70");
  const [attempts, setAttempts] = useState("");
  const [showResults, setShowResults] = useState(true);
  const [timeLimit, setTimeLimit] = useState("");
  const [isFinal, setIsFinal] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [question, setQuestion] = useState("");
  const [essayDescription, setEssayDescription] = useState("");
  const [submissionMode, setSubmissionMode] = useState<SubmissionMode>("TEXT");
  const [moderation, setModeration] = useState<boolean | null>(null);

  const isAssessment = !!kind && ASSESSMENT_KINDS.includes(kind);
  const existingFinal = (section.items ?? []).find((i) => i.assessment?.is_final_assessment);
  const meta = kind ? KIND_META[kind] : null;

  async function chooseFile(f: File) {
    setFile(f);
    setErrors((e) => ({ ...e, file: undefined }));
    if (!title.trim()) setTitle(titleFromFile(f.name));
    if (kind === "VIDEO" && !minutes) {
      const m = await readVideoMinutes(f);
      if (m) setMinutes((cur) => cur || String(m));
    }
  }

  function validate(): Errors {
    const e: Errors = {};
    const t = title.trim();
    if (!t) e.title = "Give it a title learners will recognise.";
    else if (t.length > 255) e.title = "Keep the title under 255 characters.";
    if (minutes && (!/^\d+$/.test(minutes) || Number(minutes) < 0)) e.minutes = "Use whole minutes.";
    if (kind === "DOCUMENT" && !file) e.file = "Choose the file to upload.";
    if (kind === "LINKS") {
      const u = url.trim();
      if (!u) e.url = "Paste the web address.";
      else if (u.length > 2000) e.url = "That address is too long (2,000 characters max).";
      else {
        try {
          const parsed = new URL(u);
          if (!/^https?:$/.test(parsed.protocol)) e.url = "Use a web address starting with https://";
        } catch {
          e.url = "That doesn't look like a web address. It should start with https://";
        }
      }
    }
    if (kind === "LIVE_SESSION") {
      const iso = fromLocalInput(start);
      if (!iso) e.start = "Pick a date and time.";
      else if (new Date(iso).getTime() <= Date.now()) e.start = "Choose a time in the future.";
      const d = Number(duration);
      if (!Number.isInteger(d) || d < 5 || d > 600) e.duration = "Between 5 and 600 minutes.";
    }
    if (isAssessment) {
      const pm = Number(passMark);
      if (passMark === "" || !Number.isFinite(pm) || pm < 0 || pm > 100) e.passMark = "A percentage from 0 to 100.";
      if (attempts && (!/^\d+$/.test(attempts) || Number(attempts) < 1)) e.attempts = "At least 1, or leave empty for unlimited.";
    }
    if (kind === "QUIZ_GROUP" && timeLimit) {
      const tl = Number(timeLimit);
      if (!Number.isFinite(tl) || tl * 60 < 30) e.timeLimit = "At least half a minute, or leave empty for untimed.";
    }
    if (kind === "ESSAY") {
      if (!question.trim()) e.question = "What should learners write about?";
      if (!essayDescription.trim()) e.essayDescription = "Add guidance — length, structure, what you'll look for.";
    }
    return e;
  }

  function buildPayload(): ItemCreatePayload {
    const base: ItemCreatePayload = {
      title: title.trim(),
      item_type: isAssessment ? "ASSESSMENT" : (kind as ItemCreatePayload["item_type"]),
      order_index: section.items?.length ?? 0,
      is_preview: preview,
      estimated_minutes: minutes ? Number(minutes) : null,
    };
    switch (kind) {
      case "DOCUMENT":
        return { ...base, file_name: file!.name, downloadable };
      case "LINKS":
        return { ...base, url: url.trim(), label: label.trim() || null, description: linkDescription.trim() || null };
      case "LIVE_SESSION":
        return {
          ...base,
          scheduled_start_at: fromLocalInput(start)!,
          duration_minutes: Number(duration),
          guest_name: guestName.trim() || null,
          guest_title: guestTitle.trim() || null,
        };
      case "QUIZ":
      case "ESSAY":
      case "QUIZ_GROUP": {
        const common = {
          ...base,
          assessment_type: kind,
          is_final_assessment: isFinal,
          due_date: dueDate ? fromLocalInput(dueDate) : null,
        };
        const settings = {
          pass_mark_percentage: Number(passMark),
          max_attempts: attempts ? Number(attempts) : null,
        };
        if (kind === "QUIZ") return { ...common, quiz_settings: { ...settings, show_result_to_student: showResults } };
        if (kind === "QUIZ_GROUP")
          return {
            ...common,
            quiz_group_settings: {
              ...settings,
              show_result_to_student: showResults,
              time_limit_seconds: timeLimit ? Math.round(Number(timeLimit) * 60) : null,
            },
          };
        return {
          ...common,
          essay_settings: {
            ...settings,
            question: question.trim(),
            description: essayDescription.trim(),
            submission_mode: submissionMode,
            ...(moderation !== null ? { requires_moderation: moderation } : {}),
          },
        };
      }
      default:
        return base;
    }
  }

  async function submit() {
    const e = validate();
    setErrors(e);
    setFormError(null);
    if (Object.values(e).some(Boolean)) return;
    setBusy(true);
    try {
      const created = await run(() => studioApi.createItem(courseId, section.id, buildPayload()), {
        silent: true,
        success:
          kind === "VIDEO" && file
            ? "Video lesson added — uploading in the background"
            : `${meta!.label} added`,
      });
      if (!created) return;
      if (kind === "VIDEO" && file) uploads.startVideo(created.id, file, { credentials: created.video_upload, title: title.trim() });
      if (kind === "DOCUMENT" && file && created.document_upload?.upload_url)
        void uploads.startDocument(created.id, file, created.document_upload.upload_url);
      onCreated(created.id);
      onClose();
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      const msg = apiErr?.message ?? "Something went wrong. Please try again.";
      const fieldErrors: Errors = {
        title: apiErr?.fieldError("title"),
        url: apiErr?.fieldError("url") ?? (/url/i.test(msg) ? msg : undefined),
        start: apiErr?.fieldError("scheduled_start_at") ?? (/scheduled_start_at/.test(msg) ? "Choose a time in the future." : undefined),
        duration: apiErr?.fieldError("duration_minutes"),
        final: /final assessment/i.test(msg) ? msg : undefined,
        file: apiErr?.fieldError("file_name"),
      };
      if (Object.values(fieldErrors).some(Boolean)) setErrors(fieldErrors);
      else setFormError(msg);
    } finally {
      setBusy(false);
    }
  }

  const footer = kind ? (
    <>
      <Button variant="ghost" icon={ArrowLeft} onClick={() => setKind(null)} disabled={busy} className="sm:mr-auto">
        Change type
      </Button>
      <Button variant="outline" onClick={onClose} disabled={busy}>
        Cancel
      </Button>
      <Button icon={Plus} loading={busy} onClick={submit}>
        Add {meta!.noun}
      </Button>
    </>
  ) : (
    <Button variant="outline" onClick={onClose}>
      Cancel
    </Button>
  );

  return (
    <Dialog
      open
      onOpenChange={(v) => !v && !busy && onClose()}
      dismissible={!busy}
      size="lg"
      icon={meta?.icon ?? Plus}
      title={meta ? `New ${meta.noun}` : "Add to this module"}
      description={
        meta ? (
          <>
            In <span className="font-semibold text-slate-700 dark:text-slate-200">{section.title}</span>
          </>
        ) : (
          <>
            What would you like to add to <span className="font-semibold text-slate-700 dark:text-slate-200">{section.title}</span>?
          </>
        )
      }
      footer={footer}
    >
      {!kind ? (
        <div className="flex flex-col gap-5">
          {[
            { heading: "Learning content", kinds: CONTENT_KINDS },
            { heading: "Assessment", kinds: ASSESSMENT_KINDS },
          ].map((group) => (
            <div key={group.heading}>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{group.heading}</p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {group.kinds.map((k) => (
                  <ChoiceCard
                    key={k}
                    icon={KIND_META[k].icon}
                    tone={KIND_META[k].tone}
                    title={KIND_META[k].label}
                    description={KIND_META[k].description}
                    onClick={() => setKind(k)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {formError && <Callout tone="danger">{formError}</Callout>}

          {/* File first for uploads — it fills the title for you. */}
          {(kind === "VIDEO" || kind === "DOCUMENT") && (
            <Field
              label={kind === "VIDEO" ? "Video file" : "File"}
              required={kind === "DOCUMENT"}
              optional={kind === "VIDEO"}
              error={errors.file}
              hint={kind === "VIDEO" ? "You can also add the video later from the lesson." : undefined}
            >
              {file ? (
                <SelectedFile file={file} onClear={() => setFile(null)} />
              ) : (
                <FileDrop
                  accept={kind === "VIDEO" ? "video/*" : DOC_ACCEPT}
                  onFile={chooseFile}
                  icon={kind === "VIDEO" ? Film : FileText}
                  title={kind === "VIDEO" ? "Drop your video here or browse" : "Drop your document here or browse"}
                  hint={kind === "VIDEO" ? "MP4, MOV or WebM. Large files are fine — uploads resume if your connection drops." : "PDF, Word, PowerPoint, Excel and more."}
                />
              )}
            </Field>
          )}

          <Field label="Title" htmlFor={fid("title")} required error={errors.title}>
            <Input
              id={fid("title")}
              value={title}
              autoFocus={kind !== "VIDEO" && kind !== "DOCUMENT"}
              maxLength={255}
              invalid={!!errors.title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                kind === "LIVE_SESSION"
                  ? "e.g. Case discussion: working with families"
                  : kind === "ESSAY"
                    ? "e.g. Reflective essay"
                    : kind === "QUIZ" || kind === "QUIZ_GROUP"
                      ? "e.g. Module 1 knowledge check"
                      : "e.g. Understanding safeguarding duties"
              }
            />
          </Field>

          {kind === "LINKS" && (
            <>
              <Field label="Web address" htmlFor={fid("url")} required error={errors.url}>
                <Input id={fid("url")} type="url" inputMode="url" value={url} invalid={!!errors.url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Button label" htmlFor={fid("label")} optional hint="Shown on the link, e.g. “Read the guidance”.">
                  <Input id={fid("label")} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Open link" />
                </Field>
                <Field label="Short description" htmlFor={fid("ldesc")} optional>
                  <Input id={fid("ldesc")} value={linkDescription} onChange={(e) => setLinkDescription(e.target.value)} placeholder="Why learners should read it" />
                </Field>
              </div>
            </>
          )}

          {kind === "LIVE_SESSION" && (
            <>
              <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
                <Field label="Starts at" htmlFor={fid("start")} required error={errors.start} hint="Your local time.">
                  <Input id={fid("start")} type="datetime-local" value={start} invalid={!!errors.start} onChange={(e) => setStart(e.target.value)} />
                </Field>
                <Field label="Length (minutes)" htmlFor={fid("dur")} required error={errors.duration}>
                  <Input id={fid("dur")} type="number" min={5} max={600} step={5} value={duration} invalid={!!errors.duration} onChange={(e) => setDuration(e.target.value)} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Guest speaker" htmlFor={fid("gname")} optional>
                  <Input id={fid("gname")} value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Dr Amaka Obi" />
                </Field>
                <Field label="Guest's role" htmlFor={fid("gtitle")} optional>
                  <Input id={fid("gtitle")} value={guestTitle} onChange={(e) => setGuestTitle(e.target.value)} placeholder="Child psychologist" />
                </Field>
              </div>
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                We create the video room for you.{" "}
                {lifecycle === "PUBLISHED"
                  ? "Enrolled learners are invited once this update is approved and published."
                  : "Learners are invited when the course is published."}
              </p>
            </>
          )}

          {kind === "ESSAY" && (
            <>
              <Field label="Essay question" htmlFor={fid("q")} required error={errors.question}>
                <Textarea id={fid("q")} rows={2} value={question} invalid={!!errors.question} onChange={(e) => setQuestion(e.target.value)} placeholder="Reflect on a safeguarding concern you have handled." />
              </Field>
              <Field label="Guidance for learners" htmlFor={fid("qd")} required error={errors.essayDescription}>
                <Textarea id={fid("qd")} rows={3} value={essayDescription} invalid={!!errors.essayDescription} onChange={(e) => setEssayDescription(e.target.value)} placeholder="800–1,000 words. Use the Gibbs reflective cycle." />
              </Field>
              <Field label="Learners submit">
                <Segmented
                  options={[
                    { key: "TEXT", label: "Written answer" },
                    { key: "DOCUMENT", label: "Uploaded document" },
                  ]}
                  value={submissionMode}
                  onChange={setSubmissionMode}
                />
              </Field>
            </>
          )}

          {isAssessment && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-ink-line dark:bg-white/[0.02]">
              <p className="mb-3 text-[13px] font-semibold text-slate-700 dark:text-slate-200">Marking</p>
              <div className={cn("grid gap-4", kind === "QUIZ_GROUP" ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
                <Field label="Pass mark" htmlFor={fid("pm")} error={errors.passMark}>
                  <Input id={fid("pm")} type="number" min={0} max={100} value={passMark} invalid={!!errors.passMark} onChange={(e) => setPassMark(e.target.value)} leading="%" />
                </Field>
                <Field label="Attempts allowed" htmlFor={fid("att")} error={errors.attempts} hint={!errors.attempts ? "Empty = unlimited" : undefined}>
                  <Input id={fid("att")} type="number" min={1} value={attempts} invalid={!!errors.attempts} onChange={(e) => setAttempts(e.target.value)} placeholder="Unlimited" />
                </Field>
                {kind === "QUIZ_GROUP" && (
                  <Field label="Time limit (min)" htmlFor={fid("tl")} error={errors.timeLimit} hint={!errors.timeLimit ? "Empty = untimed" : undefined}>
                    <Input id={fid("tl")} type="number" min={1} step="any" value={timeLimit} invalid={!!errors.timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="Untimed" />
                  </Field>
                )}
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {kind !== "ESSAY" ? (
                  <Switch checked={showResults} onChange={setShowResults} label="Show learners their result" description="They see their score as soon as they finish." />
                ) : (
                  <Switch
                    checked={moderation ?? isFinal}
                    onChange={setModeration}
                    label="Moderate marks before release"
                    description="Marks go through moderation and approval before learners see them. On by default for final assessments."
                  />
                )}
                <Field label="Due date" htmlFor={fid("due")} optional>
                  <Input id={fid("due")} type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="sm:max-w-xs" />
                </Field>
              </div>
            </div>
          )}

          {isAssessment && (
            <div
              className={cn(
                "rounded-xl border p-4",
                isFinal ? "border-violet-200 bg-violet-50/60 dark:border-violet-500/30 dark:bg-violet-500/[0.07]" : "border-slate-200 dark:border-ink-line",
              )}
            >
              <Switch
                checked={isFinal}
                disabled={!!existingFinal}
                onChange={setIsFinal}
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Flag className="h-3.5 w-3.5 text-violet-500" /> Final assessment for this module
                  </span>
                }
                description={
                  existingFinal
                    ? `“${existingFinal.title}” is already this module's final assessment. A module can have only one — unset it there first.`
                    : "Learners must pass it to unlock the next module. Running out of attempts resets the module."
                }
              />
              {errors.final && <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">{errors.final}</p>}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-[10rem_1fr] sm:items-start">
            <Field label="Time to complete" htmlFor={fid("min")} error={errors.minutes}>
              <Input id={fid("min")} type="number" min={0} value={minutes} invalid={!!errors.minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="Minutes" />
            </Field>
            <div className="flex flex-col gap-3 sm:pt-7">
              {kind === "DOCUMENT" && (
                <Switch checked={downloadable} onChange={setDownloadable} label="Allow download" description="Otherwise learners can only view it in the browser." />
              )}
              <Switch checked={preview} onChange={setPreview} label="Free preview" description="Anyone can open this before enrolling." />
            </div>
          </div>

          {kind === "VIDEO" && !file && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <RefreshCw className="h-3.5 w-3.5" /> No file chosen — the lesson will wait for a video.
            </p>
          )}
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      )}
    </Dialog>
  );
}
