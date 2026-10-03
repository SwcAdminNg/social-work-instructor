"use client";

import { useMemo, useState } from "react";
import {
  Award,
  BadgeCheck,
  CalendarClock,
  Camera,
  Download,
  Info,
  ListChecks,
  Lock,
  RotateCcw,
  Save,
  Share2,
  ShieldAlert,
  Target,
  Zap,
} from "lucide-react";
import { Badge, Button, Callout, Card, cn, Switch } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/overlays";
import { studioApi } from "@/lib/studio/api";
import { formatDate } from "@/lib/studio/labels";
import { useCourseEditor } from "./CourseEditorContext";
import { DEFAULT_CERTIFICATE_PASS_MARK, PassMarkControl } from "./PassMarkControl";

function CertificatePreview({ title, enabled, passMark }: { title: string; enabled: boolean; passMark: number }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white via-brand-50/40 to-white p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] transition-all sm:p-8 dark:from-ink-raised dark:via-brand-400/[0.06] dark:to-ink-raised",
        enabled ? "border-brand-200 dark:border-brand-400/30" : "border-slate-200 opacity-60 grayscale dark:border-ink-line",
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-3 rounded-xl border border-dashed border-brand-200/80 dark:border-brand-400/20" />
      <div className="relative flex flex-col items-center text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md">
          <Award className="h-6 w-6" strokeWidth={1.8} />
        </span>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.28em] text-brand-700 dark:text-brand-300">Certificate of completion</p>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">This certifies that</p>
        <p className="mt-1 font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Learner&apos;s name</p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">has successfully completed</p>
        <p className="mt-1 max-w-sm font-display text-sm font-bold text-slate-800 dark:text-slate-100">{title || "Your course"}</p>
        <div className="mt-6 flex w-full max-w-xs items-end justify-between gap-6 text-[10px] text-slate-400">
          <span className="flex-1 border-t border-slate-300 pt-1.5 dark:border-ink-line">Date</span>
          <span className="flex-1 border-t border-slate-300 pt-1.5 dark:border-ink-line">Verification ID</span>
        </div>
      </div>
      <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-brand-700 ring-1 ring-brand-200 dark:bg-ink-surface/90 dark:text-brand-300 dark:ring-brand-400/30">
        <Target className="h-3 w-3" /> {passMark}%+ overall
      </span>
    </div>
  );
}

function Requirement({ icon: Icon, title, children, tone = "neutral" }: { icon: typeof Award; title: React.ReactNode; children: React.ReactNode; tone?: "neutral" | "brand" | "info" }) {
  return (
    <li className="flex gap-3">
      <span
        className={cn(
          "grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg",
          tone === "brand"
            ? "bg-brand-50 text-brand-600 dark:bg-brand-400/12 dark:text-brand-300"
            : tone === "info"
              ? "bg-sky-50 text-sky-600 dark:bg-sky-500/12 dark:text-sky-300"
              : "bg-slate-100 text-slate-600 dark:bg-white/6 dark:text-slate-300",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{children}</p>
      </div>
    </li>
  );
}

export function CertificateTab() {
  const { course, courseId, run, readOnly, lifecycle, governanceEnabled } = useCourseEditor();
  const enabled = !!course?.certificate_enabled;
  const governedLive = governanceEnabled && lifecycle === "PUBLISHED";

  // Toggle
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<boolean | null>(null);

  // Pass mark: an edit layered over the server value until saved.
  const serverMark = course?.certificate_pass_mark_percentage ?? DEFAULT_CERTIFICATE_PASS_MARK;
  const [markDraft, setMarkDraft] = useState<number | null>(null);
  const mark = markDraft ?? serverMark;
  const markDirty = markDraft !== null && markDraft !== serverMark;
  const [savingMark, setSavingMark] = useState(false);
  const [confirmMark, setConfirmMark] = useState(false);

  const assessmentCount = useMemo(
    () => (course?.sections ?? []).reduce((n, s) => n + (s.items ?? []).filter((i) => i.item_type === "ASSESSMENT").length, 0),
    [course?.sections],
  );
  const hasEssays = useMemo(
    () => (course?.sections ?? []).some((s) => (s.items ?? []).some((i) => i.assessment?.assessment_type === "ESSAY")),
    [course?.sections],
  );
  const scheduledEnd = course?.access_mode === "SCHEDULED" ? course?.access_end_date : null;

  async function apply(next: boolean) {
    setBusy(true);
    const ok = await run(
      async () => {
        await studioApi.updateCourse(courseId, { certificate_enabled: next });
        return true;
      },
      {
        success: governedLive
          ? "Saved to your draft — it changes once the update is approved"
          : next
            ? "Certificates turned on"
            : "Certificates turned off",
      },
    );
    setBusy(false);
    if (!ok) throw new Error("failed");
  }

  async function saveMark() {
    setSavingMark(true);
    const ok = await run(
      async () => {
        await studioApi.updateCourse(courseId, { certificate_pass_mark_percentage: mark });
        return true;
      },
      {
        success: governedLive
          ? `Pass mark of ${mark}% saved to your draft — it applies once the update is approved`
          : `Certificate pass mark set to ${mark}%`,
      },
    );
    setSavingMark(false);
    if (!ok) throw new Error("failed");
    setMarkDraft(null);
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        {/* ── On / off ── */}
        <Card>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/12 dark:text-brand-300">
              <Award className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">Certificate of completion</h2>
                {enabled ? (
                  <Badge tone="success" size="xs" dot>
                    On
                  </Badge>
                ) : (
                  <Badge size="xs">Off</Badge>
                )}
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Reward learners who finish the course and reach the pass mark with a certificate they can download and share.
              </p>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-ink-line">
            <Switch
              checked={enabled}
              disabled={readOnly || busy}
              onChange={(next) => (governedLive ? setConfirm(next) : apply(next).catch(() => undefined))}
              label="Issue certificates for this course"
              description={
                enabled
                  ? `Learners earn one when they finish every lesson with an overall score of ${serverMark}% or more.`
                  : "Learners won't receive a certificate. Leave this off for courses whose content keeps changing."
              }
            />
          </div>
          {readOnly ? (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Lock className="h-3.5 w-3.5" /> Certificate settings are view-only right now.
            </p>
          ) : governedLive ? (
            <Callout tone="warning" icon={ShieldAlert} className="mt-4">
              On a live course, certificate settings are a <strong>high-risk change</strong>: they go through full review, including the Head of
              Learning, before learners are affected.
            </Callout>
          ) : null}
        </Card>

        {/* ── Pass mark ── */}
        <Card>
          <div className="mb-5 flex items-start gap-3">
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/12 dark:text-violet-300">
              <Target className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">Certificate pass mark</h2>
                {serverMark === DEFAULT_CERTIFICATE_PASS_MARK ? (
                  <Badge size="xs">Default</Badge>
                ) : (
                  <Badge size="xs" tone="violet">
                    Custom
                  </Badge>
                )}
                {markDirty && (
                  <Badge size="xs" tone="warning" dot>
                    Unsaved
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                The overall score a learner needs: the average of their <strong className="font-semibold text-slate-700 dark:text-slate-200">best score</strong> on
                every assessment in the course.
              </p>
            </div>
          </div>

          <PassMarkControl value={mark} onChange={setMarkDraft} disabled={readOnly || savingMark} />

          <div className="mt-4 flex flex-col gap-2">
            {assessmentCount === 0 ? (
              <Callout tone="info" icon={Info}>
                This course has no assessments yet, so there&apos;s nothing to fail — everyone who finishes earns the certificate. Add a quiz or
                essay to make the pass mark count.
              </Callout>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <ListChecks className="h-3.5 w-3.5" />
                Averaged across {assessmentCount} assessment{assessmentCount === 1 ? "" : "s"} in this course.
              </p>
            )}
            {mark === 0 && assessmentCount > 0 && (
              <Callout tone="warning" icon={Info}>
                At 0% every learner who finishes passes, whatever they score.
              </Callout>
            )}
            {mark === 100 && (
              <Callout tone="warning" icon={Info}>
                At 100% learners need full marks on every single assessment.
              </Callout>
            )}
            {!enabled && (
              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Info className="h-3.5 w-3.5" /> Certificates are off — the pass mark applies once you turn them on.
              </p>
            )}
          </div>

          {markDirty && !readOnly && (
            <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-ink-line">
              <Button variant="ghost" size="sm" icon={RotateCcw} disabled={savingMark} onClick={() => setMarkDraft(null)}>
                Reset to {serverMark}%
              </Button>
              <Button
                size="sm"
                icon={Save}
                loading={savingMark}
                onClick={() => (governedLive ? setConfirmMark(true) : saveMark().catch(() => undefined))}
              >
                Save pass mark
              </Button>
            </div>
          )}
        </Card>

        {/* ── Rules ── */}
        <Card>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">How learners earn a certificate</p>
          <ul className="flex flex-col gap-4">
            <Requirement icon={ListChecks} title="Finish every lesson" tone="brand">
              Every module and item in the course must be complete.
            </Requirement>
            <Requirement icon={Target} title={`Score ${serverMark}% or more overall`} tone="brand">
              The average of their best score on every quiz, quiz group and essay.
              {hasEssays && " Essays count once the grade is released — until then the result is pending, and the certificate follows automatically if they pass."}
            </Requirement>
            <Requirement icon={Camera} title="Have a profile photo">
              The photo appears on the certificate, so one is needed before it can be issued.
            </Requirement>
            {scheduledEnd ? (
              <Requirement icon={CalendarClock} title={`Issued when access closes on ${formatDate(scheduledEnd)}`} tone="info">
                This course is scheduled, so everyone who qualifies is certified together at the end of the access window — even if they
                finish early.
              </Requirement>
            ) : (
              <Requirement icon={Zap} title="Issued instantly" tone="info">
                The certificate appears the moment a learner qualifies.
              </Requirement>
            )}
          </ul>
          <p className="mt-5 flex items-start gap-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            Changing these rules never takes away certificates learners have already earned.
          </p>
        </Card>

        <Card>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">What learners get</p>
          <ul className="flex flex-col gap-4">
            <Requirement icon={BadgeCheck} title="Proof of learning">
              Their name, photo, the course title and completion date, with a unique verification ID.
            </Requirement>
            <Requirement icon={Download} title="Theirs to keep">
              A downloadable PDF kept in their certificates area.
            </Requirement>
            <Requirement icon={Share2} title="Easy to verify">
              Employers can check it&apos;s genuine with its verification link — ready for a CV or CPD record.
            </Requirement>
          </ul>
        </Card>
      </div>

      <div className="lg:sticky lg:top-6">
        <CertificatePreview title={course?.title ?? ""} enabled={enabled} passMark={mark} />
        <p className="mt-3 text-center text-xs text-slate-400">Illustration — the final design is set by the platform.</p>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        tone="warning"
        title={confirm ? "Turn certificates on?" : "Turn certificates off?"}
        description="This change is saved to your draft and needs full review — including the Head of Learning — before learners see it."
        confirmLabel={confirm ? "Turn on in draft" : "Turn off in draft"}
        onConfirm={() => apply(!!confirm)}
      />
      <ConfirmDialog
        open={confirmMark}
        onOpenChange={setConfirmMark}
        tone="warning"
        title={`Change the pass mark to ${mark}%?`}
        description={`It's currently ${serverMark}%. This is saved to your draft and needs full review — including the Head of Learning — before it applies to learners.`}
        confirmLabel="Save to draft"
        onConfirm={saveMark}
      />
    </div>
  );
}
