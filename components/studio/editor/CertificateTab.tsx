"use client";

import { useState } from "react";
import { Award, BadgeCheck, Download, Info, Lock, ShieldAlert, Share2 } from "lucide-react";
import { Badge, Callout, Card, cn, Switch } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/overlays";
import { studioApi } from "@/lib/studio/api";
import { useCourseEditor } from "./CourseEditorContext";

function CertificatePreview({ title, enabled }: { title: string; enabled: boolean }) {
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
    </div>
  );
}

export function CertificateTab() {
  const { course, courseId, run, readOnly, lifecycle, governanceEnabled } = useCourseEditor();
  const enabled = !!course?.certificate_enabled;
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<boolean | null>(null);
  const governedLive = governanceEnabled && lifecycle === "PUBLISHED";

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

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
      <div className="flex flex-col gap-6">
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
                Reward learners who finish the course with a certificate they can download and share.
              </p>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-ink-line">
            <Switch
              checked={enabled}
              disabled={readOnly || busy}
              onChange={(next) => (governedLive ? setConfirm(next) : apply(next).catch(() => undefined))}
              label="Issue certificates for this course"
              description={enabled ? "Learners receive one when they complete every module." : "Learners won't receive a certificate."}
            />
          </div>
          {readOnly ? (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Lock className="h-3.5 w-3.5" /> Certificate settings are view-only right now.
            </p>
          ) : governedLive ? (
            <Callout tone="warning" icon={ShieldAlert} className="mt-4">
              On a live course this is a <strong>high-risk change</strong>: it goes through full review, including the Head of Learning, before
              learners are affected.
            </Callout>
          ) : null}
        </Card>

        <Card>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">What learners get</p>
          <ul className="flex flex-col gap-4">
            {[
              { icon: BadgeCheck, title: "Proof of learning", text: "Their name, the course title and completion date, with a unique verification ID." },
              { icon: Download, title: "Theirs to keep", text: "A downloadable PDF kept in their certificates area." },
              { icon: Share2, title: "Easy to verify", text: "Employers can check it's genuine with its verification link — ready for a CV or CPD record." },
            ].map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-white/6 dark:text-slate-300">
                  <f.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{f.title}</p>
                  <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-start gap-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            Final assessments must be passed to move on, so a certificate reflects real progress through the course.
          </p>
        </Card>
      </div>

      <div className="lg:sticky lg:top-6">
        <CertificatePreview title={course?.title ?? ""} enabled={enabled} />
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
    </div>
  );
}
