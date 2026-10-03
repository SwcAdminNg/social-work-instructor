"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  GitCompareArrows,
  PartyPopper,
  Send,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Badge, Button, Callout, Checkbox, Field, Segmented, Skeleton, Textarea, cn } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/overlays";
import { RiskBadge, VersionBadge } from "@/components/studio/StatusBadges";
import { useCourseEditor } from "@/components/studio/editor/CourseEditorContext";
import { ApiError, studioApi } from "@/lib/studio/api";
import { curriculumHealth } from "@/lib/studio/health";
import { DIFF_OP, RISK, RISK_FLAGS } from "@/lib/studio/labels";
import type { DiffOp, Revision, Risk, RiskFlag } from "@/lib/studio/types";
import { ReasonLine } from "./DiffView";
import { useRevision, useRevisionDiff } from "./hooks";
import { RouteChips, StageStepper } from "./StageStepper";
import { diffCounts, errorMessage, higherRisks, maxRisk, routeForRisk } from "./utils";

type Step = "readiness" | "details" | "done";

const SUMMARY_MAX = 5000;

export function SubmitForReviewDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { courseId, course, revision, lifecycle, run } = useCourseEditor();

  const [step, setStep] = useState<Step>("readiness");
  const [acknowledged, setAcknowledged] = useState(false);
  const [summary, setSummary] = useState("");
  const [reason, setReason] = useState("");
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [declared, setDeclared] = useState<Risk | "NONE">("NONE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; summary?: string } | null>(null);
  const [result, setResult] = useState<Revision | null>(null);

  // Make sure a revision exists (idempotent POST) when the course has none yet.
  const ensured = useQuery({
    queryKey: ["studio", "ensure-revision", courseId],
    queryFn: () => studioApi.openRevision(courseId),
    enabled: open && !revision?.id,
    staleTime: Infinity,
    retry: false,
  });
  const revisionId = revision?.id ?? ensured.data?.id;

  const detail = useRevision(revisionId, { enabled: open && step !== "done" });
  const diffQuery = useRevisionDiff(revisionId, open && step !== "done");
  const diff = diffQuery.data;

  const health = useMemo(() => curriculumHealth(course), [course]);
  const errors = health.filter((h) => h.severity === "error");
  const warnings = health.filter((h) => h.severity === "warning");

  const isNew = (detail.data?.kind ?? revision?.kind) === "INITIAL" || lifecycle === "DRAFT";
  const kind = detail.data?.kind ?? revision?.kind;
  const computed: Risk | undefined = isNew ? "HIGH" : maxRisk(diff?.computed_risk, kind === "ROLLBACK" ? "HIGH" : undefined);
  const effective = maxRisk(computed, declared === "NONE" ? undefined : declared, flags.length ? "HIGH" : undefined);
  const touchesAssessment = !!diff?.touches_assessment;
  const route = kind === "ROLLBACK" ? ["FINAL_APPROVAL" as const] : kind === "REINSTATE" ? ["QUICK_APPROVAL" as const] : routeForRisk(effective, touchesAssessment);
  const counts = diffCounts(diff?.changes);
  const noChanges = !!diff && (diff.changes?.length ?? 0) === 0 && !isNew;
  const canSubmitAction = !detail.data || (detail.data.available_actions ?? []).includes("SUBMIT");
  const isResubmit = detail.data?.status === "RETURNED_FOR_REVISION";

  function reset() {
    setStep("readiness");
    setAcknowledged(false);
    setSummary("");
    setReason("");
    setFlags([]);
    setDeclared("NONE");
    setError(null);
    setResult(null);
  }

  function handleOpenChange(v: boolean) {
    if (busy) return;
    onOpenChange(v);
    if (!v) setTimeout(reset, 200);
  }

  async function submit() {
    if (!revisionId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await run(
        () =>
          studioApi.submit(revisionId, {
            change_summary: summary.trim(),
            reason: reason.trim() || undefined,
            declared_risk: declared === "NONE" ? undefined : declared,
            flags: flags.length ? flags : undefined,
          }),
        { silent: true },
      );
      if (res) {
        setResult(res);
        setStep("done");
      }
    } catch (err) {
      const e = err instanceof ApiError ? err : null;
      setError({ message: errorMessage(err), summary: e?.fieldError("change_summary") });
    } finally {
      setBusy(false);
    }
  }

  const summaryLen = summary.trim().length;
  const summaryValid = summaryLen >= 5 && summaryLen <= SUMMARY_MAX;
  const loadingReadiness = (!revisionId && ensured.isPending) || (!!revisionId && diffQuery.isPending);

  /* ───────────── Done ───────────── */
  if (step === "done" && result) {
    const round = result.round;
    return (
      <Dialog open={open} onOpenChange={handleOpenChange} size="lg" title="Submitted for review" icon={PartyPopper}
        footer={
          <>
            <Link
              href={`/dashboard/approval-centre/revisions/${result.id}`}
              className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/8"
            >
              Open review page
            </Link>
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-brand-400/20" />
            <span className="relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-[0_18px_40px_-16px_rgba(45,106,79,0.8)]">
              <CheckCircle2 className="h-10 w-10" strokeWidth={2} />
            </span>
            <Sparkles aria-hidden className="absolute -right-3 -top-2 h-5 w-5 text-amber-400" />
            <Sparkles aria-hidden className="absolute -bottom-1 -left-4 h-4 w-4 text-brand-400" />
          </div>
          <p className="mt-5 font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Nice work — it&apos;s with the reviewers</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
            Submitted for review.{" "}
            {result.proposed_version_label ? (
              <>
                Version <span className="font-semibold text-slate-900 dark:text-white">{result.proposed_version_label}</span> will be published once approved.
              </>
            ) : (
              "It will be published once approved."
            )}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <RiskBadge risk={result.effective_risk ?? result.computed_risk} />
            <VersionBadge label={result.proposed_version_label} />
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 dark:border-ink-line dark:bg-white/[0.02]">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Review path</p>
          <StageStepper stages={result.stages} round={round} currentStage={result.current_stage} planned={result.required_stages} />
        </div>
        {!!result.risk_reasons?.length && (
          <ul className="mt-4 space-y-1">
            {result.risk_reasons.slice(0, 5).map((r, i) => (
              <ReasonLine key={i} reason={r} />
            ))}
          </ul>
        )}
      </Dialog>
    );
  }

  /* ───────────── Steps ───────────── */
  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={!busy}
      size="lg"
      icon={Send}
      title={isResubmit ? "Resubmit for review" : "Submit for review"}
      description={step === "readiness" ? "Step 1 of 2 · Check it's ready" : "Step 2 of 2 · Tell reviewers about it"}
      footer={
        step === "readiness" ? (
          <>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              iconRight={ArrowRight}
              onClick={() => setStep("details")}
              disabled={!revisionId || loadingReadiness || (errors.length > 0 && !acknowledged) || !canSubmitAction}
            >
              Continue
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep("readiness")} disabled={busy} className="sm:mr-auto">
              Back
            </Button>
            <Button icon={Send} onClick={submit} loading={busy} disabled={!summaryValid || !revisionId}>
              {isResubmit ? "Resubmit" : "Submit for review"}
            </Button>
          </>
        )
      }
    >
      <StepDots step={step} />

      {step === "readiness" ? (
        <div className="flex flex-col gap-5">
          {ensured.isError && !revisionId && (
            <Callout tone="danger" title="We couldn't prepare this course for review">
              {errorMessage(ensured.error)}
            </Callout>
          )}
          {detail.data && !canSubmitAction && (
            <Callout tone="warning" icon={AlertTriangle} title="This can't be submitted right now">
              {detail.data.blocked_reason || "It may already be in review. Check the Review & history tab."}
            </Callout>
          )}

          {/* Health */}
          <section>
            <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Readiness check</h3>
            {health.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4" /> Looks good — nothing a reviewer would bounce.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <IssueList tone="danger" title={`${errors.length} ${errors.length === 1 ? "problem" : "problems"} to fix`} items={errors.map((e) => e.message)} />
                <IssueList tone="warning" title={`${warnings.length} ${warnings.length === 1 ? "thing" : "things"} worth a look`} items={warnings.map((e) => e.message)} />
                {errors.length > 0 && (
                  <Checkbox
                    className="mt-1 rounded-xl border border-slate-200 p-3 dark:border-ink-line"
                    checked={acknowledged}
                    onChange={setAcknowledged}
                    label="Submit anyway"
                    description="Reviewers will probably return it until these are fixed."
                  />
                )}
              </div>
            )}
          </section>

          {/* What changed */}
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <GitCompareArrows className="h-4 w-4 text-slate-400" /> What changed
            </h3>
            {loadingReadiness ? (
              <Skeleton className="h-28 w-full rounded-xl" />
            ) : diffQuery.isError ? (
              <Callout tone="warning" title="We couldn't compare your changes">
                {errorMessage(diffQuery.error)}
              </Callout>
            ) : noChanges ? (
              <Callout tone="warning" icon={AlertTriangle} title="There are no changes to submit">
                This draft matches the live course. Make an edit first, then submit it for review.
              </Callout>
            ) : (
              <div className="rounded-xl border border-slate-200 p-4 dark:border-ink-line">
                <div className="flex flex-wrap items-center gap-2">
                  {isNew ? (
                    <Badge tone="brand">New course · everything is new</Badge>
                  ) : (
                    (["ADDED", "MODIFIED", "REMOVED", "MOVED"] as DiffOp[]).map((k) =>
                      counts[k] ? (
                        <Badge key={k} size="xs" tone={DIFF_OP[k].tone}>
                          {counts[k]} {DIFF_OP[k].label.toLowerCase()}
                        </Badge>
                      ) : null,
                    )
                  )}
                  {touchesAssessment && (
                    <Badge size="xs" tone="violet" icon={ClipboardCheck}>
                      Touches assessments
                    </Badge>
                  )}
                </div>
                <RoutingSummary risk={computed} route={route} isNew={isNew} className="mt-3" />
                {!!diff?.reasons?.length && (
                  <ul className="mt-3 space-y-1">
                    {diff.reasons.slice(0, 4).map((r, i) => (
                      <ReasonLine key={i} reason={r} />
                    ))}
                    {diff.reasons.length > 4 && <li className="pl-3.5 text-xs text-slate-400">+ {diff.reasons.length - 4} more</li>}
                  </ul>
                )}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {error && (
            <Callout tone="danger" icon={AlertTriangle} title="Couldn't submit">
              {error.message}
            </Callout>
          )}
          <Field
            label="What's in this submission?"
            required
            htmlFor="submit-summary"
            error={error?.summary ?? (summaryLen > SUMMARY_MAX ? "Keep it under 5000 characters." : null)}
            hint="Reviewers read this first. A sentence or two is perfect."
            aside={
              <span className={cn("text-xs tabular-nums", summaryLen > SUMMARY_MAX ? "text-rose-600" : "text-slate-400")}>
                {summaryLen}/{SUMMARY_MAX}
              </span>
            }
          >
            <Textarea
              id="submit-summary"
              rows={4}
              autoFocus
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={isNew ? "e.g. First release of the safeguarding course for the 2026 intake" : "e.g. Updated module 2 for the new statutory guidance and fixed two broken links"}
              invalid={!!error?.summary}
            />
          </Field>
          <Field label="Why is it needed?" optional htmlFor="submit-reason">
            <Textarea id="submit-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Required by the 2026 practice framework" />
          </Field>

          <section>
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Does it touch any of these?</p>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Flagged changes always get the full review, including the Head of Learning.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(RISK_FLAGS) as RiskFlag[]).map((f) => (
                <Checkbox
                  key={f}
                  className={cn(
                    "rounded-xl border p-3 transition-colors",
                    flags.includes(f) ? "border-rose-300 bg-rose-50/60 dark:border-rose-500/40 dark:bg-rose-500/[0.06]" : "border-slate-200 dark:border-ink-line",
                  )}
                  checked={flags.includes(f)}
                  onChange={(v) => setFlags((cur) => (v ? [...cur, f] : cur.filter((x) => x !== f)))}
                  label={RISK_FLAGS[f].label}
                  description={RISK_FLAGS[f].description}
                />
              ))}
            </div>
          </section>

          {computed !== "HIGH" && !flags.length && (
            <section>
              <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Treat as higher risk?</p>
              <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">You can ask for a fuller review than the system suggests, never a lighter one.</p>
              <Segmented<Risk | "NONE">
                size="sm"
                value={declared}
                onChange={setDeclared}
                options={[
                  { key: "NONE", label: computed ? `Keep ${RISK[computed].label.toLowerCase()}` : "Keep suggested" },
                  ...higherRisks(computed).map((r) => ({ key: r as Risk | "NONE", label: RISK[r].label })),
                ]}
              />
            </section>
          )}

          <div
            className={cn(
              "rounded-xl border p-4 transition-colors",
              effective === "HIGH"
                ? "border-rose-200 bg-rose-50/50 dark:border-rose-500/25 dark:bg-rose-500/[0.05]"
                : "border-slate-200 bg-slate-50/50 dark:border-ink-line dark:bg-white/[0.02]",
            )}
            aria-live="polite"
          >
            <RoutingSummary risk={effective} route={route} isNew={isNew} />
            {flags.length > 0 && computed !== "HIGH" && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-300">
                <ShieldAlert className="h-3.5 w-3.5" /> Raised to high risk because you flagged it.
              </p>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}

function StepDots({ step }: { step: Step }) {
  return (
    <div className="mb-5 flex items-center gap-2" aria-hidden>
      <span className="h-1.5 flex-1 rounded-full bg-brand-500" />
      <span className={cn("h-1.5 flex-1 rounded-full transition-colors", step === "details" ? "bg-brand-500" : "bg-slate-200 dark:bg-white/10")} />
    </div>
  );
}

function IssueList({ tone, title, items }: { tone: "danger" | "warning"; title: string; items: string[] }) {
  const [all, setAll] = useState(false);
  if (!items.length) return null;
  const shown = all ? items : items.slice(0, 4);
  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-3",
        tone === "danger" ? "border-rose-200 bg-rose-50/60 dark:border-rose-500/25 dark:bg-rose-500/[0.06]" : "border-amber-200 bg-amber-50/60 dark:border-amber-500/25 dark:bg-amber-500/[0.06]",
      )}
    >
      <p className={cn("text-sm font-semibold", tone === "danger" ? "text-rose-800 dark:text-rose-200" : "text-amber-900 dark:text-amber-200")}>{title}</p>
      <ul className="mt-1.5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
        {shown.map((m, i) => (
          <li key={i} className="flex gap-2">
            <span className={cn("mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full", tone === "danger" ? "bg-rose-500" : "bg-amber-500")} />
            <span className="min-w-0 break-words">{m}</span>
          </li>
        ))}
      </ul>
      {items.length > 4 && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-1.5 cursor-pointer text-xs font-semibold text-slate-600 hover:underline dark:text-slate-300">
          {all ? "Show fewer" : `Show all ${items.length}`}
        </button>
      )}
    </div>
  );
}

function RoutingSummary({ risk, route, isNew, className }: { risk?: Risk; route: Parameters<typeof RouteChips>[0]["stages"]; isNew: boolean; className?: string }) {
  if (!risk) return null;
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <RiskBadge risk={risk} />
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {isNew ? "Every new course gets the full review." : RISK[risk].description}
        </span>
      </div>
      {route.length > 0 && <RouteChips stages={route} className="mt-2.5" />}
    </div>
  );
}
