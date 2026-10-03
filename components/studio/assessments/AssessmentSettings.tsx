"use client";

import { useMemo, useState } from "react";
import { FileText, Flag, Infinity as InfinityIcon, PenLine, Save, Settings2, Timer, Undo2 } from "lucide-react";
import { Badge, Button, Card, CardHeader, Divider, Field, Input, Meta, Segmented, Switch, Textarea, cn } from "@/components/ui/primitives";
import { DatePicker } from "@/components/ui/date-picker";
import { useCourseEditor } from "@/components/studio/editor/CourseEditorContext";
import { studioApi } from "@/lib/studio/api";
import { formatDateTime, fromLocalInput, toLocalInput } from "@/lib/studio/labels";
import type { AssessmentUpdatePayload, Item, SubmissionMode } from "@/lib/studio/types";
import { RiskHint } from "./shared";
import { useAssessmentWrite } from "./useAssessmentWrite";

type Form = {
  pass: number;
  unlimited: boolean;
  attempts: number;
  showResults: boolean;
  timed: boolean;
  minutes: number;
  question: string;
  description: string;
  mode: SubmissionMode;
  moderation: boolean;
  due: string;
  final: boolean;
};

function fromItem(item: Item): Form {
  const a = item.assessment;
  const type = a?.assessment_type ?? "QUIZ";
  const s = type === "ESSAY" ? a?.essay : type === "QUIZ_GROUP" ? a?.quiz_group : a?.quiz;
  const attempts = s?.max_attempts ?? null; // missing = unlimited (the API strips nulls)
  const seconds = a?.quiz_group?.time_limit_seconds ?? null;
  return {
    pass: s?.pass_mark_percentage ?? 70,
    unlimited: attempts === null,
    attempts: attempts ?? 3,
    showResults: (type === "ESSAY" ? undefined : (s as { show_result_to_student?: boolean } | undefined)?.show_result_to_student) ?? true,
    timed: seconds !== null,
    minutes: seconds ? Math.round((seconds / 60) * 10) / 10 : 30,
    question: a?.essay?.question ?? "",
    description: a?.essay?.description ?? "",
    mode: a?.essay?.submission_mode ?? "TEXT",
    moderation: !!a?.essay?.requires_moderation,
    due: toLocalInput(a?.due_date),
    final: !!a?.is_final_assessment,
  };
}

function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
}

export function AssessmentSettings({ item, sectionId }: { item: Item; sectionId: string }) {
  const { course, readOnly, lifecycle, governanceEnabled } = useCourseEditor();
  const write = useAssessmentWrite();
  const type = item.assessment?.assessment_type ?? "QUIZ";
  const live = lifecycle === "PUBLISHED" && governanceEnabled;

  const baseline = useMemo(() => fromItem(item), [item]);
  const baselineKey = JSON.stringify(baseline);
  const [form, setForm] = useState<Form>(baseline);
  const [prevKey, setPrevKey] = useState(baselineKey);
  // Settings changed on the server (after save / re-fetch): adopt them.
  if (baselineKey !== prevKey) {
    setPrevKey(baselineKey);
    setForm(baseline);
  }
  const [saving, setSaving] = useState(false);

  const otherFinal = useMemo(() => {
    const section = course?.sections?.find((s) => s.id === sectionId);
    return section?.items?.find((i) => i.id !== item.id && i.assessment?.is_final_assessment) ?? null;
  }, [course, sectionId, item.id]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const changed = (key: keyof Form) => form[key] !== baseline[key];

  const timeInvalid = type === "QUIZ_GROUP" && form.timed && (!form.minutes || form.minutes * 60 < 30);
  const attemptsInvalid = !form.unlimited && (!form.attempts || form.attempts < 1);
  const essayInvalid = type === "ESSAY" && (!form.question.trim() || !form.description.trim());
  const invalid = timeInvalid || attemptsInvalid || essayInvalid;

  function buildPayload(): AssessmentUpdatePayload {
    const payload: AssessmentUpdatePayload = {};
    if (changed("due")) payload.due_date = fromLocalInput(form.due); // explicit null clears
    if (changed("final")) payload.is_final_assessment = form.final;

    const attemptsChanged = changed("unlimited") || (!form.unlimited && changed("attempts"));
    const common: { pass_mark_percentage?: number; max_attempts?: number | null } = {};
    if (changed("pass")) common.pass_mark_percentage = clampPct(form.pass);
    if (attemptsChanged) common.max_attempts = form.unlimited ? null : Math.max(1, Math.floor(form.attempts));

    if (type === "ESSAY") {
      const essay = { ...common } as NonNullable<AssessmentUpdatePayload["essay_settings"]>;
      if (changed("question")) essay.question = form.question.trim();
      if (changed("description")) essay.description = form.description.trim();
      if (changed("mode")) essay.submission_mode = form.mode;
      if (changed("moderation")) essay.requires_moderation = form.moderation;
      if (Object.keys(essay).length) payload.essay_settings = essay;
    } else {
      const quiz = { ...common } as NonNullable<AssessmentUpdatePayload["quiz_group_settings"]>;
      if (changed("showResults")) quiz.show_result_to_student = form.showResults;
      if (type === "QUIZ_GROUP" && (changed("timed") || (form.timed && changed("minutes")))) {
        quiz.time_limit_seconds = form.timed ? Math.max(30, Math.round(form.minutes * 60)) : null;
      }
      if (Object.keys(quiz).length) {
        if (type === "QUIZ_GROUP") payload.quiz_group_settings = quiz;
        else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { time_limit_seconds, ...rest } = quiz;
          payload.quiz_settings = rest;
        }
      }
    }
    return payload;
  }

  const payload = buildPayload();
  const dirty = Object.keys(payload).length > 0;

  async function save() {
    if (!dirty || invalid) return;
    setSaving(true);
    await write(() => studioApi.updateAssessment(item.id, payload), { success: "Assessment settings saved" });
    setSaving(false);
  }

  if (readOnly) return <SettingsReadView item={item} form={baseline} />;

  return (
    <Card className="relative">
      <CardHeader
        icon={Settings2}
        title="Settings"
        description="How this assessment is graded and what learners see."
      />

      <div className="flex flex-col gap-6">
        {type === "ESSAY" && (
          <>
            <Field
              label="Essay question"
              required
              htmlFor="essay-question"
              error={!form.question.trim() ? "The essay needs a question." : undefined}
            >
              <Textarea
                id="essay-question"
                rows={3}
                value={form.question}
                onChange={(e) => set("question", e.target.value)}
                placeholder="e.g. Reflect on a safeguarding concern you handled."
              />
            </Field>
            <Field
              label="Instructions for learners"
              required
              htmlFor="essay-description"
              hint="Word count, structure, models to use, how it will be marked."
              error={!form.description.trim() ? "Add instructions for learners." : undefined}
            >
              <Textarea
                id="essay-description"
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="800–1000 words. Use the Gibbs reflective cycle."
              />
            </Field>
            <Field label="How learners submit" aside={<RiskHint show={live} />}>
              <Segmented<SubmissionMode>
                value={form.mode}
                onChange={(v) => set("mode", v)}
                className="self-start"
                options={[
                  { key: "TEXT", label: "Type in the browser", icon: PenLine },
                  { key: "DOCUMENT", label: "Upload a document", icon: FileText },
                ]}
              />
            </Field>
            <Divider />
          </>
        )}

        <Field
          label="Pass mark"
          htmlFor="pass-mark"
          aside={<RiskHint show={live} />}
          hint={type === "ESSAY" ? "The score a marker must award for a pass." : "Share of correct answers needed to pass."}
        >
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              aria-label="Pass mark slider"
              value={form.pass}
              onChange={(e) => set("pass", clampPct(Number(e.target.value)))}
              className="h-2 flex-1 cursor-pointer accent-brand-600 dark:accent-brand-400"
            />
            <div className="relative w-24">
              <Input
                id="pass-mark"
                type="number"
                min={0}
                max={100}
                value={form.pass}
                onChange={(e) => set("pass", clampPct(Number(e.target.value)))}
                className="pr-8 text-right font-semibold"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">%</span>
            </div>
          </div>
        </Field>

        <Field
          label="Attempts allowed"
          htmlFor="max-attempts"
          aside={<RiskHint show={live} />}
          error={attemptsInvalid ? "Allow at least one attempt." : undefined}
          hint={form.final && !form.unlimited ? "Running out of attempts resets the module (or the course, for the last module)." : undefined}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              value={form.unlimited ? "unlimited" : "limited"}
              onChange={(k) => set("unlimited", k === "unlimited")}
              options={[
                { key: "limited", label: "Limited" },
                { key: "unlimited", label: "Unlimited", icon: InfinityIcon },
              ]}
            />
            {!form.unlimited && (
              <div className="flex items-center gap-2">
                <Input
                  id="max-attempts"
                  type="number"
                  min={1}
                  value={form.attempts || ""}
                  onChange={(e) => set("attempts", Math.max(0, Math.floor(Number(e.target.value))))}
                  className="w-20 text-center font-semibold"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400">attempt{form.attempts === 1 ? "" : "s"}</span>
              </div>
            )}
          </div>
        </Field>

        {type === "QUIZ_GROUP" && (
          <Field
            label="Time limit"
            htmlFor="time-limit"
            aside={<RiskHint show={live} />}
            error={timeInvalid ? "The time limit must be at least 30 seconds." : undefined}
          >
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                value={form.timed ? "timed" : "untimed"}
                onChange={(k) => set("timed", k === "timed")}
                options={[
                  { key: "untimed", label: "Untimed" },
                  { key: "timed", label: "Timed", icon: Timer },
                ]}
              />
              {form.timed && (
                <div className="flex items-center gap-2">
                  <Input
                    id="time-limit"
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={form.minutes || ""}
                    onChange={(e) => set("minutes", Math.max(0, Number(e.target.value)))}
                    className="w-24 text-center font-semibold"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400">minutes</span>
                </div>
              )}
            </div>
          </Field>
        )}

        {type !== "ESSAY" && (
          <Switch
            checked={form.showResults}
            onChange={(v) => set("showResults", v)}
            label="Show results to learners"
            description="Learners see their score and which answers were right after each attempt."
          />
        )}

        {type === "ESSAY" && (
          <Switch
            checked={form.moderation}
            onChange={(v) => set("moderation", v)}
            label="Moderate marks before release"
            description={
              governanceEnabled
                ? "Marks go marker → moderator → approver, and learners only see the approved result."
                : "Content review is switched off on this platform, so marks are released in one step."
            }
          />
        )}

        <Divider />

        <Field
          label="Due date"
          optional
          htmlFor="due-date"
          hint="Shown to learners as a target. Leave empty for no deadline."
        >
          <DatePicker
            id="due-date"
            value={form.due}
            onChange={(value) => set("due", value)}
            clearable
            defaultTime={{ hour: 23, minute: 59 }}
            placeholder="No due date"
            title="Due date"
          />
        </Field>

        <div
          className={cn(
            "rounded-xl border p-4 transition-colors",
            form.final
              ? "border-violet-200 bg-violet-50/60 dark:border-violet-500/25 dark:bg-violet-500/[0.06]"
              : "border-slate-200 bg-slate-50/60 dark:border-ink-line dark:bg-white/[0.02]",
          )}
        >
          <Switch
            checked={form.final}
            disabled={!form.final && !!otherFinal}
            onChange={(v) => set("final", v)}
            label={
              <span className="inline-flex flex-wrap items-center gap-2">
                <Flag className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                Final assessment for this module
                <RiskHint show={live} />
              </span>
            }
            description={
              otherFinal && !form.final
                ? `Unset “${otherFinal.title}” first — each module can have only one final assessment.`
                : "Learners must pass this to unlock the next module. Running out of attempts resets the module, or the whole course if it's the last one."
            }
          />
          {live && changed("final") && (
            <p className="mt-3 text-xs leading-5 text-amber-700 dark:text-amber-300">
              This course is live. Changing the module gate is a high-risk change and goes through full review before learners are affected.
            </p>
          )}
        </div>
      </div>

      {dirty && (
        <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6 dark:border-ink-line dark:bg-ink-surface/95">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Unsaved changes
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" icon={Undo2} onClick={() => setForm(baseline)} disabled={saving}>
              Discard
            </Button>
            <Button size="sm" icon={Save} loading={saving} disabled={invalid} onClick={save}>
              Save settings
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function SettingsReadView({ item, form }: { item: Item; form: Form }) {
  const type = item.assessment?.assessment_type ?? "QUIZ";
  return (
    <Card>
      <CardHeader icon={Settings2} title="Settings" />
      {type === "ESSAY" && (
        <div className="mb-5 flex flex-col gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Question</p>
            <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-900 dark:text-white">{form.question || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Instructions</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{form.description || "—"}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Meta label="Pass mark">{form.pass}%</Meta>
        <Meta label="Attempts">{form.unlimited ? "Unlimited" : form.attempts}</Meta>
        {type === "QUIZ_GROUP" && <Meta label="Time limit">{form.timed ? `${form.minutes} min` : "Untimed"}</Meta>}
        {type !== "ESSAY" && <Meta label="Results shown">{form.showResults ? "Yes" : "No"}</Meta>}
        {type === "ESSAY" && <Meta label="Submission">{form.mode === "DOCUMENT" ? "Document upload" : "Typed answer"}</Meta>}
        {type === "ESSAY" && <Meta label="Moderation">{form.moderation ? "Required" : "Not required"}</Meta>}
        <Meta label="Due">{item.assessment?.due_date ? formatDateTime(item.assessment.due_date) : "No deadline"}</Meta>
        <Meta label="Module gate">
          {form.final ? (
            <Badge size="xs" tone="violet" icon={Flag}>
              Final assessment
            </Badge>
          ) : (
            "No"
          )}
        </Meta>
      </div>
    </Card>
  );
}
