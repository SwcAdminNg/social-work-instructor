"use client";

import { AlertTriangle, CheckCircle2, CircleDashed, Clock3, GitBranch, Shield, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { DIFF_OP, LIFECYCLE, RISK, isInReview, revisionStatus } from "@/lib/studio/labels";
import type { DiffOp, Lifecycle, Risk } from "@/lib/studio/types";

export function LifecycleBadge({ lifecycle, size }: { lifecycle?: string | null; size?: "xs" | "sm" }) {
  const l = LIFECYCLE[(lifecycle ?? "DRAFT") as Lifecycle] ?? LIFECYCLE.DRAFT;
  return (
    <Badge tone={l.tone} dot pulse={lifecycle === "PUBLISHED"} size={size}>
      {l.label}
    </Badge>
  );
}

export function RevisionStatusBadge({ status, short, size }: { status?: string | null; short?: boolean; size?: "xs" | "sm" }) {
  if (!status) return null;
  const s = revisionStatus(status);
  const icon =
    status === "READY_TO_PUBLISH" || status === "PUBLISHED"
      ? CheckCircle2
      : status === "RETURNED_FOR_REVISION"
        ? AlertTriangle
        : status === "REJECTED"
          ? XCircle
          : isInReview(status)
            ? Clock3
            : CircleDashed;
  return (
    <Badge tone={s.tone} icon={icon} size={size}>
      {short && "short" in s && s.short ? s.short : s.label}
    </Badge>
  );
}

export function RiskBadge({ risk, size }: { risk?: string | null; size?: "xs" | "sm" }) {
  if (!risk) return null;
  const r = RISK[risk as Risk];
  if (!r) return null;
  const icon = risk === "HIGH" ? ShieldAlert : risk === "MEDIUM" ? Shield : ShieldCheck;
  return (
    <Badge tone={r.tone} icon={icon} size={size} title={r.description}>
      {r.label}
    </Badge>
  );
}

export function VersionBadge({ label, size }: { label?: string | null; size?: "xs" | "sm" }) {
  if (!label) return null;
  return (
    <Badge tone="brand" icon={GitBranch} size={size}>
      v{label}
    </Badge>
  );
}

export function DiffOpBadge({ op, size = "xs" }: { op: string; size?: "xs" | "sm" }) {
  const o = DIFF_OP[op as DiffOp] ?? { label: op, tone: "neutral" as const };
  return (
    <Badge tone={o.tone} size={size}>
      {o.label}
    </Badge>
  );
}
