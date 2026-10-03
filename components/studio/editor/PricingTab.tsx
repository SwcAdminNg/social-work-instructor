"use client";

import { useId, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CalendarRange, ImageIcon, Infinity as InfinityIcon, Lock, Plus, Sparkles, Tag, Users, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Badge, Button, Callout, Card, CardHeader, ChoiceCard, cn, Field, Input, ProgressBar, Segmented, Switch } from "@/components/ui/primitives";
import { DateRangePicker } from "@/components/ui/date-picker";
import { ApiError, studioApi, uploadToSignedUrl } from "@/lib/studio/api";
import { formatMoney, fromLocalInput, toLocalInput } from "@/lib/studio/labels";
import type { AccessMode, CoursePayload } from "@/lib/studio/types";
import { FileDrop } from "../curriculum/FileDrop";
import { useCourseEditor } from "./CourseEditorContext";
import { SaveBar } from "./SaveBar";
import { useDraft } from "./useDraft";

function LiveHint() {
  return (
    <Badge tone="brand" size="xs" icon={Zap} title="Operational settings don't need review">
      Goes live immediately
    </Badge>
  );
}

type AccessDraft = {
  is_free: boolean;
  price: string;
  is_exclusive: boolean;
  access_mode: AccessMode;
  start: string;
  end: string;
};

function PriceAndAccess({ blocked }: { blocked: boolean }) {
  const { course, courseId, run } = useCourseEditor();
  const uid = useId();
  const base = useMemo<AccessDraft>(
    () => ({
      is_free: course?.is_free ?? true,
      price: course?.price != null ? String(course.price) : "",
      is_exclusive: !!course?.is_exclusive,
      access_mode: course?.access_mode ?? "SELF_PACED",
      start: toLocalInput(course?.access_start_date),
      end: toLocalInput(course?.access_end_date),
    }),
    [course],
  );
  const draft = useDraft(base);
  const v = draft.values;
  const [errors, setErrors] = useState<Partial<Record<keyof AccessDraft, string>>>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    const e: typeof errors = {};
    const price = Number(v.price);
    if (!v.is_free && (v.price === "" || !Number.isFinite(price) || price <= 0)) e.price = "Enter a price above ₦0, or make the course free.";
    if (v.access_mode === "SCHEDULED") {
      const s = fromLocalInput(v.start);
      const en = fromLocalInput(v.end);
      if (!s) e.start = "When does access open?";
      if (!en) e.end = "When does access close?";
      if (s && en && new Date(en) <= new Date(s)) e.end = "The end must be after the start.";
    }
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload: CoursePayload = {};
    const dirty = new Set(draft.dirtyKeys);
    if (dirty.has("is_free")) payload.is_free = v.is_free;
    if (!v.is_free && (dirty.has("price") || dirty.has("is_free"))) payload.price = price;
    if (dirty.has("is_exclusive")) payload.is_exclusive = v.is_exclusive;
    if (dirty.has("access_mode") || dirty.has("start") || dirty.has("end")) {
      payload.access_mode = v.access_mode;
      if (v.access_mode === "SCHEDULED") {
        payload.access_start_date = fromLocalInput(v.start);
        payload.access_end_date = fromLocalInput(v.end);
      }
    }
    if (!Object.keys(payload).length) return draft.reset();

    setSaving(true);
    try {
      await run(() => studioApi.updateCourse(courseId, payload), { silent: true, success: "Saved — live for learners now" });
      draft.reset();
    } catch (err) {
      if (err instanceof ApiError) {
        const fe: typeof errors = {
          price: err.fieldError("price"),
          start: err.fieldError("access_start_date"),
          end: err.fieldError("access_end_date") ?? (/access/i.test(err.message) ? err.message : undefined),
        };
        setErrors(fe);
        if (!Object.values(fe).some(Boolean)) toast.error(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  const fid = (k: string) => `${uid}-${k}`;

  return (
    <>
      <Card>
        <CardHeader icon={Tag} title="Price" description="What learners pay to enrol." actions={<LiveHint />} />
        <div className="flex flex-col gap-5">
          <Segmented
            options={[
              { key: "free", label: "Free" },
              { key: "paid", label: "Paid" },
            ]}
            value={v.is_free ? "free" : "paid"}
            onChange={(k) => !blocked && draft.set("is_free", k === "free")}
            className={cn("self-start", blocked && "pointer-events-none opacity-60")}
          />
          {!v.is_free && (
            <Field
              label="Price"
              htmlFor={fid("price")}
              required
              error={errors.price}
              hint={!errors.price && v.price && Number(v.price) > 0 ? `Learners pay ${formatMoney(Number(v.price))}` : "In Nigerian naira."}
              className="sm:max-w-xs"
            >
              <Input
                id={fid("price")}
                type="number"
                min={0}
                step={100}
                leading="₦"
                value={v.price}
                disabled={blocked}
                invalid={!!errors.price}
                onChange={(e) => draft.set("price", e.target.value)}
              />
            </Field>
          )}
          <Switch
            checked={v.is_exclusive}
            disabled={blocked}
            onChange={(val) => draft.set("is_exclusive", val)}
            label="Exclusive course"
            description="Only available to learners you invite or enrol, not listed for everyone."
          />
        </div>
      </Card>

      <Card>
        <CardHeader icon={CalendarRange} title="Access" description="When learners can take the course." actions={<LiveHint />} />
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard
            icon={InfinityIcon}
            title="Self-paced"
            description="Learners start any time and go at their own speed."
            selected={v.access_mode === "SELF_PACED"}
            disabled={blocked}
            onClick={() => draft.set("access_mode", "SELF_PACED")}
          />
          <ChoiceCard
            icon={CalendarRange}
            title="Scheduled"
            description="Open between two dates — ideal for cohorts."
            selected={v.access_mode === "SCHEDULED"}
            disabled={blocked}
            onClick={() => draft.set("access_mode", "SCHEDULED")}
          />
        </div>
        {v.access_mode === "SCHEDULED" && (
          <Field label="Access window" htmlFor={fid("start")} required error={errors.start ?? errors.end} className="mt-5">
            <DateRangePicker
              id={fid("start")}
              start={v.start}
              end={v.end}
              onChange={({ start, end }) => {
                draft.set("start", start);
                draft.set("end", end);
              }}
              startLabel="Opens"
              endLabel="Closes"
              title="Course access window"
              disabled={blocked}
              invalid={errors.start ? "start" : errors.end ? "end" : false}
            />
          </Field>
        )}
      </Card>

      <SaveBar
        visible={draft.dirty && !blocked}
        saving={saving}
        onSave={save}
        onDiscard={() => {
          draft.reset();
          setErrors({});
        }}
        message="Unsaved price or access changes — they go live as soon as you save"
      />
    </>
  );
}

function CoverImage({ blocked }: { blocked: boolean }) {
  const { course, courseId, run, refresh } = useCourseEditor();
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file (JPG, PNG or WebP).");
    if (file.size > 10 * 1024 * 1024) return toast.error("That image is over 10 MB. Try a smaller one.");
    const local = URL.createObjectURL(file);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return local;
    });
    setProgress(0);
    const target = await run(() => studioApi.thumbnailUploadUrl(courseId, file), { refresh: false });
    if (!target) {
      setProgress(null);
      setPreview(null);
      return;
    }
    try {
      await uploadToSignedUrl(target.upload_url, file, setProgress);
      await refresh();
      toast.success("Cover image updated");
    } catch (err) {
      toast.error((err as Error).message);
      setPreview(null);
    } finally {
      setProgress(null);
    }
  }

  const src = preview ?? course?.thumbnail_url ?? null;
  const uploading = progress !== null;

  return (
    <Card>
      <CardHeader icon={ImageIcon} title="Cover image" description="Shown on course cards and the course page. Use a 16:9 image, at least 1280×720." actions={<LiveHint />} />
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 via-brand-50 to-white ring-1 ring-slate-200 dark:from-brand-400/20 dark:via-brand-400/5 dark:to-transparent dark:ring-ink-line">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Course cover" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-brand-600/60 dark:text-brand-300/60">
              <ImageIcon className="h-10 w-10" strokeWidth={1.5} />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <ProgressBar value={progress ?? 0} />
              <p className="mt-1.5 text-xs font-semibold text-white">Uploading… {progress}%</p>
            </div>
          )}
        </div>
        {blocked ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">The cover image can&apos;t be changed right now.</p>
        ) : (
          <FileDrop
            accept="image/*"
            onFile={upload}
            disabled={uploading}
            icon={Sparkles}
            title={src ? "Replace the cover image" : "Add a cover image"}
            hint="Drop an image here or browse. JPG, PNG or WebP, up to 10 MB."
          />
        )}
      </div>
    </Card>
  );
}

type Credit = { user_id?: string | null; name: string; profile_picture_url?: string | null };

function InstructorCredits({ blocked }: { blocked: boolean }) {
  const { course, courseId, run } = useCourseEditor();
  const base = useMemo(
    () => ({
      list: (course?.instructors ?? [])
        .filter((i) => !i.is_guest)
        .map((i) => ({ user_id: i.user_id ?? null, name: i.name, profile_picture_url: i.profile_picture_url ?? null })) as Credit[],
    }),
    [course],
  );
  const guests = (course?.instructors ?? []).filter((i) => i.is_guest);
  const draft = useDraft(base);
  const list = draft.values.list;
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  function add() {
    const n = name.trim();
    if (!n) return;
    if (list.some((c) => c.name.toLowerCase() === n.toLowerCase())) return toast.error(`${n} is already credited.`);
    draft.set("list", [...list, { name: n, user_id: null }]);
    setName("");
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...list];
    const [x] = next.splice(i, 1);
    next.splice(i + dir, 0, x);
    draft.set("list", next);
  }

  async function save() {
    if (!list.length) return toast.error("Credit at least one instructor.");
    setSaving(true);
    const ok = await run(
      async () => {
        await studioApi.updateCourse(courseId, {
          instructors: list.map((c) => (c.user_id ? { user_id: c.user_id, name: c.name } : { name: c.name })),
        });
        return true;
      },
      { success: "Instructor credits updated" },
    );
    setSaving(false);
    if (ok) draft.reset();
  }

  return (
    <Card>
      <CardHeader icon={Users} title="Instructor credits" description="Who's named as teaching this course, in this order." actions={<LiveHint />} />
      <ul className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-ink-line dark:border-ink-line">
        {list.map((c, i) => (
          <li key={`${c.user_id ?? "ext"}-${c.name}`} className="flex items-center gap-3 px-3 py-2.5">
            <Avatar name={c.name} src={c.profile_picture_url} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{c.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{c.user_id ? "Platform instructor" : "External contributor"}</p>
            </div>
            {!blocked && (
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="xs" iconOnly icon={ArrowUp} aria-label={`Move ${c.name} up`} disabled={i === 0} onClick={() => move(i, -1)} />
                <Button variant="ghost" size="xs" iconOnly icon={ArrowDown} aria-label={`Move ${c.name} down`} disabled={i === list.length - 1} onClick={() => move(i, 1)} />
                <Button
                  variant="ghost"
                  size="xs"
                  iconOnly
                  icon={X}
                  aria-label={`Remove ${c.name}`}
                  disabled={list.length === 1}
                  onClick={() => draft.set("list", list.filter((_, j) => j !== i))}
                />
              </div>
            )}
          </li>
        ))}
        {guests.map((g) => (
          <li key={`guest-${g.name}`} className="flex items-center gap-3 bg-slate-50/60 px-3 py-2.5 dark:bg-white/[0.02]">
            <Avatar name={g.name} src={g.profile_picture_url} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{g.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Guest lecturer · managed on its module</p>
            </div>
            <Badge size="xs">Guest</Badge>
          </li>
        ))}
      </ul>
      {!blocked && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Add a co-instructor's full name"
            aria-label="Co-instructor name"
          />
          <Button variant="outline" icon={Plus} onClick={add} disabled={!name.trim()}>
            Add
          </Button>
        </div>
      )}
      {draft.dirty && !blocked && (
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-ink-line">
          <span className="mr-auto text-xs font-semibold text-amber-600 dark:text-amber-300">Unsaved changes</span>
          <Button variant="outline" size="sm" onClick={draft.reset} disabled={saving}>
            Discard
          </Button>
          <Button size="sm" onClick={save} loading={saving}>
            Save credits
          </Button>
        </div>
      )}
    </Card>
  );
}

export function PricingTab() {
  const { lockReason } = useCourseEditor();
  const blocked = lockReason === "archived" || lockReason === "live-layer";
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {blocked ? (
        <Callout tone="neutral" icon={Lock}>
          {lockReason === "archived"
            ? "This course is archived, so its price and access can't be changed."
            : "You're viewing the live version. Switch back to your draft to change these settings."}
        </Callout>
      ) : (
        <Callout tone="brand" icon={Zap} title="These settings skip review">
          Price, access dates, the cover image and credits update for learners as soon as you save — even while an update is in review.
        </Callout>
      )}
      <PriceAndAccess blocked={blocked} />
      <CoverImage blocked={blocked} />
      <InstructorCredits blocked={blocked} />
    </div>
  );
}
