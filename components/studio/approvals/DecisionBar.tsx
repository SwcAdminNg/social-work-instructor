"use client";

import { useState } from "react";
import {
  ArrowUpCircle,
  CheckCircle2,
  CornerUpLeft,
  Gavel,
  Hand,
  ListChecks,
  MoreHorizontal,
  Plus,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Undo2,
  UserPlus,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button, Callout, Checkbox, Field, Input, Segmented, Textarea, cn } from "@/components/ui/primitives";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, Menu, type MenuItem } from "@/components/ui/overlays";
import { RiskBadge } from "@/components/studio/StatusBadges";
import { studioApi } from "@/lib/studio/api";
import { RISK, RISK_FLAGS, STAGE, fromLocalInput, stageLabel } from "@/lib/studio/labels";
import type { Revision, RevisionAction, Risk, RiskFlag, Stage } from "@/lib/studio/types";
import { RISK_ORDER, errorMessage, higherRisks, personName } from "@/components/studio/review/utils";

/** Runs an action. Resolves when done (or handled); throws for inline (400/422) errors. */
export type Perform = (fn: () => Promise<Revision>, success: string | ((r: Revision) => string)) => Promise<void>;

type DialogAction = Exclude<RevisionAction, "EDIT" | "DISCARD" | "SUBMIT" | "CLAIM" | "COMMENT" | "ATTACH_EVIDENCE">;

const DECISION_ACTIONS: RevisionAction[] = [
  "CLAIM",
  "APPROVE",
  "APPROVE_WITH_MINOR_CHANGES",
  "RETURN_FOR_REVISION",
  "REJECT",
  "ESCALATE",
  "ASSIGN_REVIEWER",
  "FORCE_APPROVE",
  "OVERRIDE_RISK",
  "PUBLISH",
];

export function hasDecisionActions(actions?: RevisionAction[]) {
  return (actions ?? []).some((a) => DECISION_ACTIONS.includes(a));
}

const META: Record<DialogAction, { title: string; icon: LucideIcon; tone: "brand" | "danger" | "warning" | "violet"; cta: string }> = {
  APPROVE: { title: "Approve this stage", icon: CheckCircle2, tone: "brand", cta: "Approve" },
  APPROVE_WITH_MINOR_CHANGES: { title: "Approve with minor changes", icon: ListChecks, tone: "brand", cta: "Approve with changes" },
  RETURN_FOR_REVISION: { title: "Return to the author", icon: CornerUpLeft, tone: "warning", cta: "Return for revision" },
  REJECT: { title: "Reject this revision", icon: XCircle, tone: "danger", cta: "Reject" },
  ESCALATE: { title: "Escalate for a fuller review", icon: ArrowUpCircle, tone: "violet", cta: "Escalate" },
  ASSIGN_REVIEWER: { title: "Assign a reviewer", icon: UserPlus, tone: "brand", cta: "Assign" },
  FORCE_APPROVE: { title: "Force approve", icon: ShieldAlert, tone: "danger", cta: "Force approve" },
  OVERRIDE_RISK: { title: "Re-rate risk", icon: ShieldCheck, tone: "violet", cta: "Re-rate risk" },
  PUBLISH: { title: "Publish this version", icon: Rocket, tone: "brand", cta: "Publish now" },
  WITHDRAW: { title: "Withdraw from review", icon: Undo2, tone: "warning", cta: "Withdraw" },
};

export function DecisionBar({ revision, perform }: { revision: Revision; perform: Perform }) {
  const actions = revision.available_actions ?? [];
  const has = (a: RevisionAction) => actions.includes(a);
  const [dialog, setDialog] = useState<DialogAction | null>(null);
  const [claiming, setClaiming] = useState(false);

  const stage = revision.current_stage as Stage | undefined;
  const currentRow = (revision.stages ?? []).find((s) => s.stage === stage && s.round === revision.round && s.status !== "SUPERSEDED");

  async function claim() {
    setClaiming(true);
    try {
      await perform(() => studioApi.claim(revision.id), "It's yours — the author can see you're reviewing it");
    } catch (err) {
      // perform already toasts 403/409; anything else bubbles here
      toast.error(errorMessage(err));
    } finally {
      setClaiming(false);
    }
  }

  const more: MenuItem[] = [];
  if (has("ESCALATE")) more.push({ label: "Escalate", icon: ArrowUpCircle, onSelect: () => setDialog("ESCALATE") });
  if (has("ASSIGN_REVIEWER")) more.push({ label: "Assign reviewer", icon: UserPlus, onSelect: () => setDialog("ASSIGN_REVIEWER") });
  if (has("OVERRIDE_RISK")) more.push({ label: "Re-rate risk", icon: ShieldCheck, onSelect: () => setDialog("OVERRIDE_RISK") });
  if (has("FORCE_APPROVE")) {
    if (more.length) more.push("separator");
    more.push({ label: "Force approve", icon: ShieldAlert, onSelect: () => setDialog("FORCE_APPROVE"), danger: true });
  }

  const primaryApprove = has("APPROVE");
  const anything =
    has("PUBLISH") || has("CLAIM") || has("APPROVE") || has("APPROVE_WITH_MINOR_CHANGES") || has("RETURN_FOR_REVISION") || has("REJECT") || has("WITHDRAW") || more.length > 0;
  if (!anything) return null;

  return (
    <>
      <div className="sticky bottom-3 z-30 mt-2">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)] backdrop-blur-md sm:p-4 lg:flex-row lg:items-center lg:justify-between dark:border-ink-line dark:bg-ink-surface/90">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/12 dark:text-brand-300">
              <Gavel className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {has("PUBLISH") ? "Ready to publish" : stage ? `Your decision · ${STAGE[stage]?.label ?? stageLabel(stage)}` : "Your actions"}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {has("PUBLISH")
                  ? `Goes live as version ${revision.proposed_version_label ?? "—"}`
                  : currentRow?.assigned_reviewer?.name
                    ? `Assigned to ${personName(currentRow.assigned_reviewer)}`
                    : has("CLAIM")
                      ? "Claim it so others know you're on it"
                      : "Decide once you've checked the changes and preview"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {has("WITHDRAW") && (
              <Button variant="outline" icon={Undo2} onClick={() => setDialog("WITHDRAW")}>
                Withdraw
              </Button>
            )}
            {has("REJECT") && (
              <Button variant="soft-danger" icon={XCircle} onClick={() => setDialog("REJECT")}>
                Reject
              </Button>
            )}
            {has("RETURN_FOR_REVISION") && (
              <Button variant="outline" icon={CornerUpLeft} onClick={() => setDialog("RETURN_FOR_REVISION")}>
                Return
              </Button>
            )}
            {has("APPROVE_WITH_MINOR_CHANGES") && (
              <Button variant="outline" icon={ListChecks} onClick={() => setDialog("APPROVE_WITH_MINOR_CHANGES")}>
                <span className="hidden sm:inline">Approve with changes</span>
                <span className="sm:hidden">With changes</span>
              </Button>
            )}
            {has("CLAIM") && (
              <Button variant={primaryApprove || has("PUBLISH") ? "secondary" : "primary"} icon={Hand} loading={claiming} onClick={claim}>
                Claim
              </Button>
            )}
            {more.length > 0 && (
              <Menu
                items={more}
                trigger={
                  <Button variant="outline" iconOnly icon={MoreHorizontal} aria-label="More actions" />
                }
              />
            )}
            {has("APPROVE") && (
              <Button variant={has("PUBLISH") ? "secondary" : "primary"} icon={CheckCircle2} onClick={() => setDialog("APPROVE")}>
                Approve
              </Button>
            )}
            {has("PUBLISH") && (
              <Button icon={Rocket} onClick={() => setDialog("PUBLISH")}>
                Publish
              </Button>
            )}
          </div>
        </div>
      </div>

      {dialog && <ActionDialog key={dialog} action={dialog} revision={revision} perform={perform} onClose={() => setDialog(null)} />}
    </>
  );
}

function ActionDialog({
  action,
  revision,
  perform,
  onClose,
}: {
  action: DialogAction;
  revision: Revision;
  perform: Perform;
  onClose: () => void;
}) {
  const meta = META[action];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [conditions, setConditions] = useState<string[]>([""]);
  const [confirmed, setConfirmed] = useState(false);
  const [escalateTo, setEscalateTo] = useState<Risk | "">("");
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [reviewerId, setReviewerId] = useState("");
  const [due, setDue] = useState("");
  const [level, setLevel] = useState<Risk | "">("");

  const effective = (revision.effective_risk ?? revision.computed_risk) as Risk | undefined;
  const openConditions = revision.open_conditions ?? [];
  const needsConfirm = (action === "APPROVE" || action === "APPROVE_WITH_MINOR_CHANGES") && openConditions.length > 0;
  const cleanConditions = conditions.map((c) => c.trim()).filter(Boolean);
  const flagged = (revision.risk_flags ?? []).length > 0;

  let valid = true;
  if (needsConfirm && !confirmed) valid = false;
  if (action === "APPROVE_WITH_MINOR_CHANGES" && !cleanConditions.length) valid = false;
  if ((action === "RETURN_FOR_REVISION" || action === "REJECT" || action === "ESCALATE") && !comment.trim()) valid = false;
  if (action === "ESCALATE" && !escalateTo && !flags.length) valid = false;
  if (action === "ASSIGN_REVIEWER" && !reviewerId.trim()) valid = false;
  if (action === "FORCE_APPROVE" && comment.trim().length < 20) valid = false;
  if (action === "OVERRIDE_RISK" && (!level || comment.trim().length < 10)) valid = false;

  async function confirm() {
    setBusy(true);
    setError(null);
    const id = revision.id;
    const c = comment.trim() || undefined;
    try {
      switch (action) {
        case "APPROVE":
          await perform(() => studioApi.decide(id, { decision: "APPROVED", comment: c }), "Approved — it's moved to the next stage");
          break;
        case "APPROVE_WITH_MINOR_CHANGES":
          await perform(
            () => studioApi.decide(id, { decision: "APPROVED_WITH_MINOR_CHANGES", comment: c, conditions: cleanConditions }),
            "Approved with minor changes",
          );
          break;
        case "RETURN_FOR_REVISION":
          await perform(() => studioApi.decide(id, { decision: "RETURNED_FOR_REVISION", comment: c }), "Returned to the author");
          break;
        case "REJECT":
          await perform(() => studioApi.decide(id, { decision: "REJECTED", comment: c }), "Revision rejected");
          break;
        case "ESCALATE":
          await perform(
            () => studioApi.decide(id, { decision: "ESCALATED", comment: c, escalate_to: escalateTo || null, flags: flags.length ? flags : undefined }),
            "Escalated — extra review stages were added",
          );
          break;
        case "ASSIGN_REVIEWER":
          await perform(
            () => studioApi.assign(id, { reviewer_id: reviewerId.trim(), due_at: fromLocalInput(due) ?? undefined }),
            "Reviewer assigned",
          );
          break;
        case "FORCE_APPROVE":
          await perform(() => studioApi.forceApprove(id, comment.trim()), "Force approved — it's ready to publish");
          break;
        case "OVERRIDE_RISK":
          await perform(() => studioApi.rerateRisk(id, { level: level as Risk, reason: comment.trim() }), "Risk re-rated");
          break;
        case "PUBLISH":
          await perform(
            () => studioApi.publish(id),
            (r) => `Published version ${r.proposed_version_label ?? revision.proposed_version_label ?? ""}`.trim(),
          );
          break;
        case "WITHDRAW":
          await perform(() => studioApi.withdraw(id), "Withdrawn — it's back in draft");
          break;
      }
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const commentField = (label: string, required: boolean, placeholder: string, hint?: string, min?: number) => (
    <Field
      label={label}
      required={required}
      optional={!required}
      htmlFor="decision-comment"
      hint={hint}
      aside={min ? <span className={cn("text-xs tabular-nums", comment.trim().length < min ? "text-slate-400" : "text-emerald-600")}>{comment.trim().length}/{min}+</span> : undefined}
    >
      <Textarea id="decision-comment" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={placeholder} autoFocus />
    </Field>
  );

  return (
    <Dialog
      open
      onOpenChange={(v) => !v && !busy && onClose()}
      dismissible={!busy}
      icon={meta.icon}
      iconTone={meta.tone}
      title={meta.title}
      description={description(action, revision)}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={meta.tone === "danger" ? "danger" : "primary"} loading={busy} disabled={!valid} onClick={confirm}>
            {meta.cta}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && (
          <Callout tone="danger" title="That didn't go through">
            {error}
          </Callout>
        )}

        {needsConfirm && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-500/25 dark:bg-amber-500/[0.06]">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Minor changes from an earlier stage</p>
            <ul className="mt-1.5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
              {openConditions.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <ListChecks className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                  {c.text}
                </li>
              ))}
            </ul>
            <Checkbox className="mt-3" checked={confirmed} onChange={setConfirmed} label="I've checked these were made" />
          </div>
        )}

        {action === "APPROVE" && commentField("Comment", false, "Anything the author or next reviewer should know?")}

        {action === "APPROVE_WITH_MINOR_CHANGES" && (
          <>
            <Field label="Minor changes the next stage must confirm" required hint="One change per line. The next reviewer checks them off.">
              <div className="flex flex-col gap-2">
                {conditions.map((v, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      aria-label={`Change ${i + 1}`}
                      value={v}
                      onChange={(e) => setConditions((cur) => cur.map((x, xi) => (xi === i ? e.target.value : x)))}
                      placeholder={i === 0 ? "e.g. Add feedback to question 3" : "Another change"}
                      autoFocus={i === conditions.length - 1}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          setConditions((cur) => [...cur, ""]);
                        }
                      }}
                    />
                    {conditions.length > 1 && (
                      <Button variant="ghost" iconOnly icon={Trash2} aria-label="Remove" onClick={() => setConditions((cur) => cur.filter((_, xi) => xi !== i))} />
                    )}
                  </div>
                ))}
                <Button size="sm" variant="ghost" icon={Plus} className="self-start" onClick={() => setConditions((cur) => [...cur, ""])}>
                  Add another
                </Button>
              </div>
            </Field>
            {commentField("Comment", false, "Overall feedback")}
          </>
        )}

        {action === "RETURN_FOR_REVISION" &&
          commentField("What needs to change?", true, "Be specific — the author sees this first. Pin detailed notes in the discussion.")}

        {action === "REJECT" && commentField("Why is it being rejected?", true, "The author sees this reason.", "Rejection closes this revision. A new course keeps its content; a live course keeps its live version.")}

        {action === "ESCALATE" && (
          <>
            {commentField("Why escalate?", true, "e.g. Module 3 now covers safeguarding thresholds")}
            {higherRisks(effective).length > 0 && (
              <Field label="Raise risk to" hint={effective ? `Currently ${RISK[effective].label.toLowerCase()}.` : undefined}>
                <Segmented<Risk | "">
                  size="sm"
                  value={escalateTo}
                  onChange={setEscalateTo}
                  options={[{ key: "", label: "Keep level" }, ...higherRisks(effective).map((r) => ({ key: r as Risk | "", label: RISK[r].label }))]}
                />
              </Field>
            )}
            <Field label="Add flags" hint="Any flag makes it high risk and adds Head of Learning approval.">
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(RISK_FLAGS) as RiskFlag[])
                  .filter((f) => !(revision.risk_flags ?? []).includes(f))
                  .map((f) => (
                    <Checkbox
                      key={f}
                      checked={flags.includes(f)}
                      onChange={(v) => setFlags((cur) => (v ? [...cur, f] : cur.filter((x) => x !== f)))}
                      label={RISK_FLAGS[f].label}
                      description={RISK_FLAGS[f].description}
                      className="rounded-lg border border-slate-200 p-2.5 dark:border-ink-line"
                    />
                  ))}
              </div>
            </Field>
            {!escalateTo && !flags.length && <p className="text-xs text-slate-500">Raise the level or add at least one flag.</p>}
          </>
        )}

        {action === "ASSIGN_REVIEWER" && (
          <>
            <Field
              label="Reviewer's user ID"
              required
              htmlFor="assign-reviewer"
              hint="Paste the reviewer's user ID (from the staff roles list). They must hold the permission for this stage and can't have worked on the course."
            >
              <Input id="assign-reviewer" value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} placeholder="e.g. 5bf9c2e0-…" autoFocus className="font-mono text-[13px]" />
            </Field>
            <Field label="Due" optional htmlFor="assign-due" hint="Leave empty to keep the standard review deadline.">
              <DatePicker id="assign-due" value={due} onChange={setDue} min={new Date()} clearable title="Review due by" defaultTime={{ hour: 17, minute: 0 }} placeholder="Standard review deadline" />
            </Field>
          </>
        )}

        {action === "FORCE_APPROVE" && (
          <>
            <Callout tone="danger" icon={ShieldAlert}>
              Every remaining stage is skipped and the revision goes straight to ready-to-publish. This is audited and the authors are notified.
            </Callout>
            {commentField("Justification", true, "Explain why this can't wait for the normal review…", undefined, 20)}
          </>
        )}

        {action === "OVERRIDE_RISK" && (
          <>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              Currently <RiskBadge risk={effective} size="xs" />
            </div>
            <Field label="New level" required hint={flagged ? "This revision is flagged, so it must stay high risk." : "Stages no longer needed are skipped; new ones are added."}>
              <Segmented<Risk | "">
                size="sm"
                value={level}
                onChange={setLevel}
                options={RISK_ORDER.filter((r) => r !== effective).map((r) => ({ key: r as Risk | "", label: RISK[r].label }))}
              />
            </Field>
            {commentField("Reason", true, "Why is the computed risk wrong?", undefined, 10)}
          </>
        )}
      </div>
    </Dialog>
  );
}

function description(action: DialogAction, r: Revision) {
  switch (action) {
    case "APPROVE":
      return "It moves on to the next stage — or becomes ready to publish if this is the last one.";
    case "APPROVE_WITH_MINOR_CHANGES":
      return "It moves on, and the next reviewer confirms your listed changes were made.";
    case "RETURN_FOR_REVISION":
      return "The author can edit again. When they resubmit, review restarts from the first stage.";
    case "REJECT":
      return "This closes the revision for good.";
    case "ESCALATE":
      return "Raises the risk and adds the extra review stages. The version number may change.";
    case "ASSIGN_REVIEWER":
      return `Only the assignee can decide ${r.current_stage ? STAGE[r.current_stage as Stage]?.label.toLowerCase() ?? "this stage" : "this stage"} once assigned.`;
    case "FORCE_APPROVE":
      return "Head of Learning override for emergencies.";
    case "OVERRIDE_RISK":
      return "Change the risk level the system computed.";
    case "PUBLISH":
      return `Version ${r.proposed_version_label ?? "—"} of ${r.course_title ?? "this course"} goes live for learners immediately. Learner progress and attempts are kept.`;
    case "WITHDRAW":
      return "It goes back to draft so the course can be edited. Reviewers start again when it's resubmitted.";
  }
}
