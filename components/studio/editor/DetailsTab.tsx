"use client";

import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { BookOpenText, Check, ClipboardCheck, Info, Lock, Package, Target } from "lucide-react";
import { Callout, Card, CardHeader, Field, Input, Textarea } from "@/components/ui/primitives";
import { Select } from "@/components/ui/select";
import { CATEGORY_ICONS } from "../courses/CourseCover";
import { ApiError, studioApi } from "@/lib/studio/api";
import { CATEGORY_LABELS, LEVEL_LABELS } from "@/lib/studio/labels";
import type { CourseCategory, CourseLevel, CoursePayload } from "@/lib/studio/types";
import { useCourseEditor } from "./CourseEditorContext";
import { SaveBar } from "./SaveBar";
import { StringListEditor } from "./StringListEditor";
import { useDraft } from "./useDraft";

type DetailsDraft = {
  title: string;
  description: string;
  level: CourseLevel | "";
  category: CourseCategory | "";
  prerequisite: string;
  what_you_will_learn: string[];
  material_includes: string[];
  requirements: string[];
};

export function DetailsTab() {
  const { course, courseId, run, readOnly, lifecycle, governanceEnabled } = useCourseEditor();
  const uid = useId();
  const base = useMemo<DetailsDraft>(
    () => ({
      title: course?.title ?? "",
      description: course?.description ?? "",
      level: course?.level ?? "",
      category: course?.category ?? "",
      prerequisite: course?.prerequisite ?? "",
      what_you_will_learn: course?.what_you_will_learn ?? [],
      material_includes: course?.material_includes ?? [],
      requirements: course?.requirements ?? [],
    }),
    [course],
  );
  const draft = useDraft(base);
  const v = draft.values;
  const [errors, setErrors] = useState<Partial<Record<keyof DetailsDraft, string>>>({});
  const [saving, setSaving] = useState(false);
  const heldForReview = governanceEnabled && lifecycle === "PUBLISHED";

  async function save() {
    const e: typeof errors = {};
    if (draft.isDirty("title") && !v.title.trim()) e.title = "Your course needs a title.";
    if (draft.isDirty("description") && !v.description.trim()) e.description = "Add a short description for the course page.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload: CoursePayload = {};
    const clean = (list: string[]) => list.map((s) => s.trim()).filter(Boolean);
    for (const k of draft.dirtyKeys) {
      if (k === "title") payload.title = v.title.trim();
      if (k === "description") payload.description = v.description.trim();
      if (k === "prerequisite") payload.prerequisite = v.prerequisite.trim() || null;
      if (k === "level" && v.level) payload.level = v.level;
      if (k === "category" && v.category) payload.category = v.category;
      if (k === "what_you_will_learn") payload.what_you_will_learn = clean(v.what_you_will_learn);
      if (k === "material_includes") payload.material_includes = clean(v.material_includes);
      if (k === "requirements") payload.requirements = clean(v.requirements);
    }
    if (!Object.keys(payload).length) return draft.reset();

    setSaving(true);
    try {
      await run(() => studioApi.updateCourse(courseId, payload), {
        silent: true,
        success: heldForReview ? "Saved to your draft — it goes live once approved" : "Course details saved",
      });
      draft.reset();
    } catch (err) {
      if (err instanceof ApiError) {
        const fe: typeof errors = {};
        for (const k of Object.keys(base) as (keyof DetailsDraft)[]) {
          const m = err.fieldError(k);
          if (m) fe[k] = m;
        }
        setErrors(fe);
        if (!Object.keys(fe).length) toast.error(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  const fid = (k: string) => `${uid}-${k}`;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {readOnly ? (
        <Callout tone="neutral" icon={Lock}>
          Course details are view-only right now.
        </Callout>
      ) : heldForReview ? (
        <Callout tone="info" icon={Info} title="These changes go through review">
          Learners keep seeing the current details until your update is approved and published.
        </Callout>
      ) : null}

      <Card>
        <CardHeader icon={BookOpenText} title="About this course" description="What learners see first on the course page." />
        <div className="flex flex-col gap-5">
          <Field label="Course title" htmlFor={fid("title")} required error={errors.title} aside={<span className="text-xs text-slate-400">{v.title.length}/255</span>}>
            <Input
              id={fid("title")}
              value={v.title}
              maxLength={255}
              disabled={readOnly}
              invalid={!!errors.title}
              onChange={(e) => draft.set("title", e.target.value)}
            />
          </Field>
          <Field
            label="Description"
            htmlFor={fid("desc")}
            required
            error={errors.description}
            hint="Who it's for, what it covers and why it matters. A few short paragraphs work best."
          >
            <Textarea
              id={fid("desc")}
              rows={7}
              value={v.description}
              disabled={readOnly}
              invalid={!!errors.description}
              onChange={(e) => draft.set("description", e.target.value)}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Level" htmlFor={fid("level")} error={errors.level}>
              <Select
                id={fid("level")}
                value={v.level}
                disabled={readOnly}
                invalid={!!errors.level}
                onChange={(value) => draft.set("level", value as CourseLevel)}
                placeholder="Choose a level"
                title="Course level"
                options={[
                  { value: "BEGINNER", label: LEVEL_LABELS.BEGINNER, description: "No prior knowledge needed" },
                  { value: "INTERMEDIATE", label: LEVEL_LABELS.INTERMEDIATE, description: "Builds on the fundamentals" },
                  { value: "ADVANCED", label: LEVEL_LABELS.ADVANCED, description: "For experienced practitioners" },
                ]}
              />
            </Field>
            <Field label="Category" htmlFor={fid("cat")} error={errors.category}>
              <Select
                id={fid("cat")}
                value={v.category}
                disabled={readOnly}
                invalid={!!errors.category}
                onChange={(value) => draft.set("category", value as CourseCategory)}
                placeholder="Choose a category"
                title="Course category"
                searchPlaceholder="Search categories…"
                options={(Object.keys(CATEGORY_LABELS) as CourseCategory[]).map((k) => ({ value: k, label: CATEGORY_LABELS[k], icon: CATEGORY_ICONS[k] }))}
              />
            </Field>
          </div>
          <Field label="Prerequisites" htmlFor={fid("pre")} optional error={errors.prerequisite} hint="Knowledge or experience learners should have before starting.">
            <Input
              id={fid("pre")}
              value={v.prerequisite}
              disabled={readOnly}
              placeholder="e.g. None — open to anyone working with children and families"
              onChange={(e) => draft.set("prerequisite", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          icon={Target}
          title="What learners will gain"
          description="Clear outcomes help learners choose your course — and reviewers check them carefully."
        />
        <div className="flex flex-col gap-6">
          <Field label="Learning outcomes" htmlFor={fid("wyl")} error={errors.what_you_will_learn} hint="Start each with a verb: “Recognise…”, “Apply…”, “Explain…”.">
            <StringListEditor
              id={fid("wyl")}
              value={v.what_you_will_learn}
              onChange={(next) => draft.set("what_you_will_learn", next)}
              disabled={readOnly}
              icon={Check}
              placeholder="Add an outcome and press Enter"
              emptyText="No outcomes listed."
            />
          </Field>
          <div className="grid gap-6 lg:grid-cols-2">
            <Field label={<span className="inline-flex items-center gap-1.5"><Package className="h-3.5 w-3.5 text-slate-400" /> This course includes</span>} htmlFor={fid("mat")} error={errors.material_includes}>
              <StringListEditor
                id={fid("mat")}
                value={v.material_includes}
                onChange={(next) => draft.set("material_includes", next)}
                disabled={readOnly}
                placeholder="e.g. Downloadable templates"
                emptyText="No materials listed."
              />
            </Field>
            <Field label={<span className="inline-flex items-center gap-1.5"><ClipboardCheck className="h-3.5 w-3.5 text-slate-400" /> Requirements</span>} htmlFor={fid("req")} error={errors.requirements}>
              <StringListEditor
                id={fid("req")}
                value={v.requirements}
                onChange={(next) => draft.set("requirements", next)}
                disabled={readOnly}
                placeholder="e.g. A laptop and internet access"
                emptyText="No requirements listed."
              />
            </Field>
          </div>
        </div>
      </Card>

      <SaveBar
        visible={draft.dirty && !readOnly}
        saving={saving}
        onSave={save}
        onDiscard={() => {
          draft.reset();
          setErrors({});
        }}
        message={heldForReview ? "Unsaved changes — saved to your draft for review" : "You have unsaved changes"}
      />
    </div>
  );
}
