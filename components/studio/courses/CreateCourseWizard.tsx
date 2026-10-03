"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarClock,
  CalendarRange,
  Check,
  CheckCircle2,
  Clock3,
  Crown,
  Eye,
  Gift,
  ImagePlus,
  Info,
  ListChecks,
  Lock,
  Mountain,
  PackageOpen,
  PencilLine,
  Rocket,
  Search,
  ShieldCheck,
  Sprout,
  Tag,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
  ChoiceCard,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Switch,
  Textarea,
  cn,
} from "@/components/ui/primitives";
import { DateRangePicker } from "@/components/ui/date-picker";
import { useAccess } from "@/components/studio/AccessContext";
import { ApiError, studioApi } from "@/lib/studio/api";
import { CATEGORY_LABELS, LEVEL_LABELS, formatDateTime, formatMoney, fromLocalInput } from "@/lib/studio/labels";
import type { AccessMode, CourseCategory, CourseLevel, CoursePayload } from "@/lib/studio/types";
import { CATEGORY_ICONS, CourseCover } from "./CourseCover";
import { StringListField, cleanList } from "./StringListField";

/* ───────────────────────── Form model ───────────────────────── */

type FormState = {
  title: string;
  description: string;
  category: CourseCategory | "";
  level: CourseLevel | "";
  what_you_will_learn: string[];
  requirements: string[];
  material_includes: string[];
  prerequisite: string;
  is_free: boolean;
  price: string;
  is_exclusive: boolean;
  access_mode: AccessMode;
  access_start_date: string;
  access_end_date: string;
  certificate_enabled: boolean;
};

type FieldKey = keyof FormState;
type Errors = Partial<Record<FieldKey, string>>;

const INITIAL: FormState = {
  title: "",
  description: "",
  category: "",
  level: "",
  what_you_will_learn: [],
  requirements: [],
  material_includes: [],
  prerequisite: "",
  is_free: true,
  price: "",
  is_exclusive: false,
  access_mode: "SELF_PACED",
  access_start_date: "",
  access_end_date: "",
  certificate_enabled: false,
};

const STEPS: { key: string; label: string; description: string; icon: LucideIcon }[] = [
  { key: "basics", label: "Basics", description: "Title, summary and audience", icon: PencilLine },
  { key: "design", label: "Learning design", description: "Outcomes and requirements", icon: ListChecks },
  { key: "pricing", label: "Pricing & access", description: "Price, schedule and certificate", icon: Wallet },
  { key: "review", label: "Review & create", description: "Check and create", icon: Rocket },
];

const FIELD_STEP: Record<FieldKey, number> = {
  title: 0,
  description: 0,
  category: 0,
  level: 0,
  what_you_will_learn: 1,
  requirements: 1,
  material_includes: 1,
  prerequisite: 1,
  is_free: 2,
  price: 2,
  is_exclusive: 2,
  access_mode: 2,
  access_start_date: 2,
  access_end_date: 2,
  certificate_enabled: 2,
};

const LEVEL_CHOICES: { key: CourseLevel; icon: LucideIcon; description: string }[] = [
  { key: "BEGINNER", icon: Sprout, description: "New to the topic — no prior practice needed." },
  { key: "INTERMEDIATE", icon: TrendingUp, description: "Some practice experience; builds on the basics." },
  { key: "ADVANCED", icon: Mountain, description: "For experienced practitioners and specialists." },
];

function validateStep(step: number, f: FormState): Errors {
  const e: Errors = {};
  if (step === 0) {
    const title = f.title.trim();
    if (!title) e.title = "Give your course a title.";
    else if (title.length > 255) e.title = "Keep the title under 255 characters.";
    if (!f.description.trim()) e.description = "Add a short description so learners know what the course is about.";
    if (!f.category) e.category = "Choose a category.";
    if (!f.level) e.level = "Choose a level.";
  }
  if (step === 2) {
    if (!f.is_free) {
      const price = Number(f.price);
      if (!f.price.trim() || !Number.isFinite(price)) e.price = "Enter a price, or make the course free.";
      else if (price <= 0) e.price = "A paid course needs a price above ₦0.";
    }
    if (f.access_mode === "SCHEDULED") {
      if (!f.access_start_date) e.access_start_date = "Choose when access opens.";
      if (!f.access_end_date) e.access_end_date = "Choose when access closes.";
      if (f.access_start_date && f.access_end_date && new Date(f.access_end_date) <= new Date(f.access_start_date)) {
        e.access_end_date = "The end must be after the start.";
      }
    }
  }
  return e;
}

function toPayload(f: FormState): CoursePayload {
  const payload: CoursePayload = {
    title: f.title.trim(),
    description: f.description.trim(),
    category: f.category as CourseCategory,
    level: f.level as CourseLevel,
    what_you_will_learn: cleanList(f.what_you_will_learn),
    requirements: cleanList(f.requirements),
    material_includes: cleanList(f.material_includes),
    is_free: f.is_free,
    is_exclusive: f.is_exclusive,
    access_mode: f.access_mode,
    certificate_enabled: f.certificate_enabled,
  };
  if (f.prerequisite.trim()) payload.prerequisite = f.prerequisite.trim();
  if (!f.is_free) payload.price = Number(f.price);
  if (f.access_mode === "SCHEDULED") {
    payload.access_start_date = fromLocalInput(f.access_start_date);
    payload.access_end_date = fromLocalInput(f.access_end_date);
  }
  return payload;
}

/** Map a 422 `errors[]` onto form fields. Unknown fields come back as `rest`. */
function mapApiErrors(err: ApiError): { fields: Errors; rest: string[] } {
  const fields: Errors = {};
  const rest: string[] = [];
  for (const e of err.errors) {
    const key = e.loc?.find((p) => typeof p === "string" && p !== "body" && p in INITIAL) as FieldKey | undefined;
    const msg = (e.msg ?? "Invalid value").replace(/^Value error, /, "");
    if (key) fields[key] ??= msg;
    else if (e.msg) rest.push(msg);
  }
  return { fields, rest };
}

/* ───────────────────────── Wizard ───────────────────────── */

export function CreateCourseWizard() {
  const { capabilities, governanceEnabled } = useAccess();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(INITIAL), [form]);

  // Warn before leaving with unsaved input.
  useEffect(() => {
    if (!dirty || done) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, done]);

  function set<K extends FieldKey>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function goTo(next: number) {
    setStep(next);
    setReached((r) => Math.max(r, next));
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  /** Validate every step up to (not including) `target`; stop at the first with errors. */
  function advanceTo(target: number) {
    for (let s = 0; s < target; s++) {
      const e = validateStep(s, form);
      if (Object.keys(e).length) {
        setErrors(e);
        goTo(s);
        return;
      }
    }
    setErrors({});
    goTo(target);
  }

  async function create() {
    for (let s = 0; s < 3; s++) {
      const e = validateStep(s, form);
      if (Object.keys(e).length) {
        setErrors(e);
        goTo(s);
        return;
      }
    }
    setSubmitting(true);
    try {
      const course = await studioApi.createCourse(toPayload(form));
      if (governanceEnabled) {
        // Open the INITIAL revision straight away so submit/diff/preview have an id (§5.1). Idempotent.
        await studioApi.openRevision(course.id).catch(() => undefined);
      }
      setDone(true);
      queryClient.invalidateQueries({ queryKey: ["studio", "courses"] });
      queryClient.invalidateQueries({ queryKey: ["studio", "approval"] });
      toast.success("Course created", { description: "Now add your first module and lessons." });
      router.push(`/dashboard/courses/${course.id}?tab=curriculum`);
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiError && err.errors.length) {
        const { fields, rest } = mapApiErrors(err);
        const keys = Object.keys(fields) as FieldKey[];
        if (keys.length) {
          setErrors(fields);
          goTo(Math.min(...keys.map((k) => FIELD_STEP[k])));
          toast.error("A few details need fixing before we can create the course.");
          return;
        }
        toast.error(rest[0] ?? err.message);
        return;
      }
      toast.error(err instanceof Error ? err.message : "We couldn't create the course. Please try again.");
    }
  }

  if (!capabilities.can_create_courses) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <EmptyState
          icon={Lock}
          title="You can't create courses yet"
          description="Your account doesn't have permission to create new courses. If you've recently become an instructor, sign out and back in — otherwise ask a platform administrator to check your roles."
          action={
            <>
              <ButtonLink href="/dashboard/courses" variant="outline" icon={ArrowLeft}>
                Back to my courses
              </ButtonLink>
            </>
          }
        />
      </div>
    );
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div ref={topRef} className="mx-auto flex w-full max-w-7xl scroll-mt-24 flex-col gap-6">
      <PageHeader
        eyebrow={
          <button
            type="button"
            onClick={() => router.push("/dashboard/courses")}
            className="inline-flex cursor-pointer items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> My courses
          </button>
        }
        title="Create a new course"
        description="Four quick steps. You'll add modules, lessons and assessments in the editor right after."
      />

      <Stepper step={step} reached={reached} onSelect={(i) => (i <= step ? goTo(i) : advanceTo(i))} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="min-w-0">
          <div key={step} className="animate-fade-in">
            {step === 0 && <BasicsStep form={form} errors={errors} set={set} />}
            {step === 1 && <DesignStep form={form} errors={errors} set={set} />}
            {step === 2 && <PricingStep form={form} errors={errors} set={set} />}
            {step === 3 && <ReviewStep form={form} governanceEnabled={governanceEnabled} onEdit={goTo} />}
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-ink-line">
            <div>
              {step > 0 && (
                <Button variant="ghost" icon={ArrowLeft} onClick={() => goTo(step - 1)} disabled={submitting}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <span className="text-center text-xs text-slate-400 sm:mr-2">
                Step {step + 1} of {STEPS.length}
              </span>
              {isLast ? (
                <Button size="lg" icon={Rocket} onClick={create} loading={submitting}>
                  Create course
                </Button>
              ) : (
                <Button iconRight={ArrowRight} onClick={() => advanceTo(step + 1)}>
                  Continue
                </Button>
              )}
            </div>
          </div>
        </Card>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <LivePreview form={form} />
        </aside>
      </div>
    </div>
  );
}

/* ───────────────────────── Stepper ───────────────────────── */

function Stepper({ step, reached, onSelect }: { step: number; reached: number; onSelect: (i: number) => void }) {
  return (
    <nav aria-label="Progress">
      <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-slate-200/70 sm:hidden dark:bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-[width] duration-300"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>
      <ol className="m-0 grid list-none grid-cols-4 gap-2 p-0">
        {STEPS.map((s, i) => {
          const complete = i !== step && i < reached;
          const current = i === step;
          const Icon = s.icon;
          return (
            <li key={s.key} className="min-w-0">
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "group flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border p-2 text-center transition sm:flex-row sm:p-3 sm:text-left",
                  current
                    ? "border-brand-300 bg-white shadow-[0_12px_30px_-22px_rgba(45,106,79,0.8)] dark:border-brand-500/50 dark:bg-ink-surface"
                    : "border-transparent hover:border-slate-200 hover:bg-white/70 dark:hover:border-ink-line dark:hover:bg-white/[0.03]",
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl text-sm font-bold transition",
                    current
                      ? "bg-brand-600 text-white dark:bg-brand-400 dark:text-[#06130d]"
                      : complete
                        ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200 dark:bg-brand-400/12 dark:text-brand-300 dark:ring-brand-400/25"
                        : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500",
                  )}
                >
                  {complete ? <Check className="h-4 w-4" strokeWidth={2.6} /> : <Icon className="h-4 w-4" strokeWidth={2} />}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span
                    className={cn(
                      "block truncate text-sm font-semibold",
                      current ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300",
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="hidden truncate text-xs text-slate-500 xl:block dark:text-slate-400">{s.description}</span>
                </span>
                <span className="sr-only sm:hidden">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ───────────────────────── Steps ───────────────────────── */

type StepProps = {
  form: FormState;
  errors: Errors;
  set: <K extends FieldKey>(key: K, value: FormState[K]) => void;
};

function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

function BasicsStep({ form, errors, set }: StepProps) {
  const [catQuery, setCatQuery] = useState("");
  const categories = (Object.keys(CATEGORY_LABELS) as CourseCategory[]).filter((c) =>
    CATEGORY_LABELS[c].toLowerCase().includes(catQuery.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        title="Start with the basics"
        description="This is what learners see first. You can change any of it later."
      />
      <Field
        label="Course title"
        required
        htmlFor="course-title"
        error={errors.title}
        aside={<span className="text-xs tabular-nums text-slate-400">{form.title.length}/255</span>}
        hint="Clear and specific works best, e.g. “Child Protection Essentials for Frontline Workers”."
      >
        <Input
          id="course-title"
          autoFocus
          maxLength={255}
          value={form.title}
          invalid={!!errors.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="What will you teach?"
          className="h-11 text-[15px]"
        />
      </Field>

      <Field
        label="Description"
        required
        htmlFor="course-description"
        error={errors.description}
        hint="Two or three sentences on what the course covers and who it's for."
      >
        <Textarea
          id="course-description"
          rows={5}
          value={form.description}
          invalid={!!errors.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="A practical introduction to…"
        />
      </Field>

      <Field label="Category" required error={errors.category}>
        <div className="flex flex-col gap-3">
          <Input
            aria-label="Search categories"
            placeholder="Search categories"
            value={catQuery}
            onChange={(e) => setCatQuery(e.target.value)}
            leading={<Search className="h-4 w-4" strokeWidth={2} />}
            className="sm:max-w-xs"
          />
          <div role="radiogroup" aria-label="Category" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((c) => {
              const Icon = CATEGORY_ICONS[c];
              const selected = form.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => set("category", c)}
                  className={cn(
                    "flex min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition",
                    selected
                      ? "border-brand-500 bg-brand-50/70 text-brand-800 ring-4 ring-brand-400/15 dark:border-brand-400 dark:bg-brand-400/10 dark:text-brand-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-ink-line dark:bg-ink-surface dark:text-slate-200 dark:hover:border-white/20",
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4 flex-shrink-0", selected ? "text-brand-600 dark:text-brand-300" : "text-slate-400")}
                    strokeWidth={2}
                  />
                  <span className="truncate">{CATEGORY_LABELS[c]}</span>
                </button>
              );
            })}
            {categories.length === 0 && (
              <p className="col-span-full py-3 text-sm text-slate-500 dark:text-slate-400">No category matches “{catQuery}”.</p>
            )}
          </div>
        </div>
      </Field>

      <Field label="Level" required error={errors.level}>
        <div className="grid gap-2 sm:grid-cols-3">
          {LEVEL_CHOICES.map((l) => (
            <ChoiceCard
              key={l.key}
              icon={l.icon}
              title={LEVEL_LABELS[l.key]}
              description={l.description}
              selected={form.level === l.key}
              onClick={() => set("level", l.key)}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}

function DesignStep({ form, errors, set }: StepProps) {
  return (
    <div className="flex flex-col gap-7">
      <StepHeading
        title="Shape the learning"
        description="Tell learners what they'll gain and what they need. All optional — but outcomes really help people decide to enrol."
      />
      <StringListField
        label="What learners will be able to do"
        optional
        icon={CheckCircle2}
        value={form.what_you_will_learn}
        onChange={(v) => set("what_you_will_learn", v)}
        error={errors.what_you_will_learn}
        placeholder="e.g. Recognise the signs of abuse and neglect"
        hint="Start each with an action verb. Press Enter for the next one."
        addLabel="Add outcome"
      />
      <StringListField
        label="Requirements"
        optional
        value={form.requirements}
        onChange={(v) => set("requirements", v)}
        error={errors.requirements}
        placeholder="e.g. A laptop or smartphone with internet access"
        addLabel="Add requirement"
      />
      <StringListField
        label="What's included"
        optional
        icon={PackageOpen}
        value={form.material_includes}
        onChange={(v) => set("material_includes", v)}
        error={errors.material_includes}
        placeholder="e.g. Downloadable case-note templates"
        addLabel="Add material"
      />
      <Field
        label="Prerequisite knowledge"
        optional
        htmlFor="course-prerequisite"
        error={errors.prerequisite}
        hint="Anything learners should already know or have completed."
      >
        <Textarea
          id="course-prerequisite"
          rows={3}
          value={form.prerequisite}
          onChange={(e) => set("prerequisite", e.target.value)}
          placeholder="e.g. None — suitable for newly qualified social workers"
        />
      </Field>
    </div>
  );
}

function PricingStep({ form, errors, set }: StepProps) {
  return (
    <div className="flex flex-col gap-7">
      <StepHeading
        title="Pricing & access"
        description="Decide how learners get in. These settings can be changed at any time — even on a live course they apply straight away."
      />

      <Field label="Price">
        <div className="grid gap-2 sm:grid-cols-2">
          <ChoiceCard
            icon={Gift}
            title="Free"
            description="Anyone signed in can enrol."
            selected={form.is_free}
            onClick={() => set("is_free", true)}
          />
          <ChoiceCard
            icon={Tag}
            title="Paid"
            description="Learners pay once to enrol."
            selected={!form.is_free}
            onClick={() => set("is_free", false)}
          />
        </div>
      </Field>

      {!form.is_free && (
        <Field label="Course price (NGN)" required htmlFor="course-price" error={errors.price} className="animate-fade-in sm:max-w-xs">
          <Input
            id="course-price"
            type="number"
            inputMode="decimal"
            min={0}
            step={500}
            leading={<span className="font-semibold">₦</span>}
            value={form.price}
            invalid={!!errors.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="25000"
          />
        </Field>
      )}

      <div className="rounded-xl border border-slate-200 p-4 dark:border-ink-line">
        <Switch
          checked={form.is_exclusive}
          onChange={(v) => set("is_exclusive", v)}
          label={
            <span className="inline-flex items-center gap-1.5">
              <Crown className="h-4 w-4 text-amber-500" strokeWidth={2} /> Exclusive course
            </span>
          }
          description="Not included in subscription plans — learners must enrol in this course on its own."
        />
      </div>

      <Field label="Access">
        <div className="grid gap-2 sm:grid-cols-2">
          <ChoiceCard
            icon={Clock3}
            title="Self-paced"
            description="Learners start any time and go at their own speed."
            selected={form.access_mode === "SELF_PACED"}
            onClick={() => set("access_mode", "SELF_PACED")}
          />
          <ChoiceCard
            icon={CalendarRange}
            title="Scheduled"
            description="Open only between a start and end date."
            selected={form.access_mode === "SCHEDULED"}
            onClick={() => set("access_mode", "SCHEDULED")}
          />
        </div>
      </Field>

      {form.access_mode === "SCHEDULED" && (
        <Field
          label="Access window"
          required
          htmlFor="access-start"
          error={errors.access_start_date ?? errors.access_end_date}
          className="animate-fade-in"
        >
          <DateRangePicker
            id="access-start"
            start={form.access_start_date}
            end={form.access_end_date}
            onChange={({ start, end }) => {
              set("access_start_date", start);
              set("access_end_date", end);
            }}
            min={new Date()}
            startLabel="Opens"
            endLabel="Closes"
            title="When can learners access this course?"
            invalid={errors.access_start_date ? "start" : errors.access_end_date ? "end" : false}
          />
        </Field>
      )}

      <div className="rounded-xl border border-slate-200 p-4 dark:border-ink-line">
        <Switch
          checked={form.certificate_enabled}
          onChange={(v) => set("certificate_enabled", v)}
          label={
            <span className="inline-flex items-center gap-1.5">
              <Award className="h-4 w-4 text-brand-600 dark:text-brand-300" strokeWidth={2} /> Award a certificate
            </span>
          }
          description="Learners receive a certificate when they complete the course. You can fine-tune the rules in the editor."
        />
      </div>
    </div>
  );
}

function ReviewStep({
  form,
  governanceEnabled,
  onEdit,
}: {
  form: FormState;
  governanceEnabled: boolean;
  onEdit: (step: number) => void;
}) {
  const outcomes = cleanList(form.what_you_will_learn);
  const reqs = cleanList(form.requirements);
  const mats = cleanList(form.material_includes);
  return (
    <div className="flex flex-col gap-6">
      <StepHeading title="Ready to create?" description="Check the details below. Everything can be edited later in the course editor." />

      <SummarySection title="Basics" onEdit={() => onEdit(0)}>
        <SummaryRow label="Title">{form.title.trim() || "—"}</SummaryRow>
        <SummaryRow label="Category">{form.category ? CATEGORY_LABELS[form.category] : "—"}</SummaryRow>
        <SummaryRow label="Level">{form.level ? LEVEL_LABELS[form.level] : "—"}</SummaryRow>
        <SummaryRow label="Description">
          <span className="line-clamp-3 whitespace-pre-line font-normal">{form.description.trim() || "—"}</span>
        </SummaryRow>
      </SummarySection>

      <SummarySection title="Learning design" onEdit={() => onEdit(1)}>
        <SummaryRow label="Outcomes">{outcomes.length ? `${outcomes.length} listed` : "None yet"}</SummaryRow>
        <SummaryRow label="Requirements">{reqs.length ? `${reqs.length} listed` : "None"}</SummaryRow>
        <SummaryRow label="Included">{mats.length ? `${mats.length} listed` : "None"}</SummaryRow>
        <SummaryRow label="Prerequisite">{form.prerequisite.trim() || "None"}</SummaryRow>
      </SummarySection>

      <SummarySection title="Pricing & access" onEdit={() => onEdit(2)}>
        <SummaryRow label="Price">{form.is_free ? "Free" : formatMoney(Number(form.price))}</SummaryRow>
        <SummaryRow label="Exclusive">{form.is_exclusive ? "Yes" : "No"}</SummaryRow>
        <SummaryRow label="Access">
          {form.access_mode === "SELF_PACED"
            ? "Self-paced"
            : `${formatDateTime(fromLocalInput(form.access_start_date))} → ${formatDateTime(fromLocalInput(form.access_end_date))}`}
        </SummaryRow>
        <SummaryRow label="Certificate">{form.certificate_enabled ? "Awarded on completion" : "Off"}</SummaryRow>
      </SummarySection>

      <Callout tone="brand" icon={ShieldCheck} title="Nothing is visible to learners yet">
        {governanceEnabled
          ? "Your course stays private while you build it. When it's ready, submit it for review — once every reviewer has approved it, it's published as version 1.0."
          : "Your course stays private while you build it. Publish it from the editor when it's ready for learners."}
      </Callout>
      <div className="flex items-start gap-2.5 text-sm text-slate-500 dark:text-slate-400">
        <ImagePlus className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" strokeWidth={2} />
        <p className="m-0">You can add a cover image next, in the course editor.</p>
      </div>
    </div>
  );
}

function SummarySection({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 dark:border-ink-line">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 dark:border-ink-line">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        <Button variant="ghost" size="xs" icon={PencilLine} onClick={onEdit}>
          Edit
        </Button>
      </div>
      <dl className="m-0 divide-y divide-slate-100 dark:divide-ink-line">{children}</dl>
    </section>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-4 py-2.5 text-sm sm:grid-cols-[140px_minmax(0,1fr)]">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="m-0 min-w-0 break-words font-semibold text-slate-800 dark:text-slate-100">{children}</dd>
    </div>
  );
}

/* ───────────────────────── Live preview ───────────────────────── */

function LivePreview({ form }: { form: FormState }) {
  const outcomes = cleanList(form.what_you_will_learn);
  const meta = [form.category && CATEGORY_LABELS[form.category], form.level && LEVEL_LABELS[form.level]].filter(Boolean).join(" · ");
  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        <Eye className="h-3.5 w-3.5" /> Live preview
      </p>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] dark:border-ink-line dark:bg-ink-surface">
        <CourseCover
          title={form.title || "New course"}
          seed={form.title || "new-course"}
          category={form.category || undefined}
          className="aspect-[16/9] w-full"
        >
          <span className="absolute right-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            Cover image comes next
          </span>
        </CourseCover>
        <div className="flex flex-col gap-3 p-4">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{meta || "Category · Level"}</p>
            <h3
              className={cn(
                "mt-1 line-clamp-2 font-display text-base font-bold leading-snug",
                form.title.trim() ? "text-slate-900 dark:text-white" : "text-slate-300 dark:text-slate-600",
              )}
            >
              {form.title.trim() || "Your course title"}
            </h3>
            <p
              className={cn(
                "mt-1.5 line-clamp-3 text-sm leading-6",
                form.description.trim() ? "text-slate-600 dark:text-slate-300" : "text-slate-300 dark:text-slate-600",
              )}
            >
              {form.description.trim() || "A short description of what learners will get from this course."}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="neutral" size="xs" dot>
              Draft
            </Badge>
            <Badge tone={form.access_mode === "SCHEDULED" ? "info" : "brand"} size="xs" icon={form.access_mode === "SCHEDULED" ? CalendarClock : Clock3}>
              {form.access_mode === "SCHEDULED" ? "Scheduled" : "Self-paced"}
            </Badge>
            {form.certificate_enabled && (
              <Badge tone="success" size="xs" icon={BadgeCheck}>
                Certificate
              </Badge>
            )}
            {form.is_exclusive && (
              <Badge tone="warning" size="xs" icon={Crown}>
                Exclusive
              </Badge>
            )}
          </div>
          {outcomes.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {outcomes.slice(0, 3).map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand-500" strokeWidth={2.2} />
                  <span className="line-clamp-2">{o}</span>
                </li>
              ))}
              {outcomes.length > 3 && (
                <li className="pl-5 text-xs text-slate-400">+{outcomes.length - 3} more outcomes</li>
              )}
            </ul>
          )}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-ink-line">
            <span className={cn("font-display text-lg font-extrabold", form.is_free ? "text-brand-700 dark:text-brand-300" : "text-slate-900 dark:text-white")}>
              {form.is_free ? "Free" : form.price ? formatMoney(Number(form.price)) : "₦ —"}
            </span>
            <span className="text-xs text-slate-400">0 lessons yet</span>
          </div>
        </div>
      </div>
      <p className="flex items-start gap-2 px-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        This is roughly how your course card will look in the catalogue.
      </p>
    </div>
  );
}
