"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  FileText,
  GitCompareArrows,
  Layers,
  Link2,
  ListChecks,
  PlayCircle,
  RefreshCw,
  Search,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, Callout, Card, EmptyState, Input, Segmented, Select, Skeleton, cn } from "@/components/ui/primitives";
import { DiffOpBadge, RiskBadge } from "@/components/studio/StatusBadges";
import { DIFF_OP, RISK } from "@/lib/studio/labels";
import type { DiffChange, DiffOp, ItemType, Risk, RevisionDiff } from "@/lib/studio/types";
import { useRevisionDiff } from "./hooks";
import { diffCounts, entityLabel, errorMessage, fieldLabel, formatValue } from "./utils";

const ITEM_ICONS: Record<ItemType, LucideIcon> = {
  VIDEO: PlayCircle,
  DOCUMENT: FileText,
  LINKS: Link2,
  LIVE_SESSION: CalendarDays,
  ASSESSMENT: ClipboardCheck,
};

const ENTITY_ICONS: Record<string, LucideIcon> = {
  course: BookOpen,
  section: Layers,
  video: PlayCircle,
  document: FileText,
  link: Link2,
  assessment: ClipboardCheck,
  assessment_settings: Settings2,
  group_section: ListChecks,
  question: CircleHelp,
  option: ListChecks,
};

const RISK_RANK: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

type OpFilter = "ALL" | DiffOp;
type RiskFilter = "ALL" | Risk;

export type DiffViewProps = {
  revisionId: string;
  /** Pass a diff you already loaded to skip the fetch. */
  diff?: RevisionDiff | null;
  /** Hide the summary header (risk + reasons). */
  hideSummary?: boolean;
  className?: string;
};

/**
 * "What changed" — every change vs the live course, grouped by readable path,
 * with op badges, risk chips and a before → after view (§7.3).
 */
export function DiffView({ revisionId, diff: given, hideSummary, className }: DiffViewProps) {
  const query = useRevisionDiff(revisionId, given === undefined);
  const diff = given ?? query.data;
  const [op, setOp] = useState<OpFilter>("ALL");
  const [risk, setRisk] = useState<RiskFilter>("ALL");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(30);

  const changes = useMemo(() => diff?.changes ?? [], [diff]);
  const counts = useMemo(() => diffCounts(changes), [changes]);

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = changes.filter(
      (c) => (op === "ALL" || c.op === op) && (risk === "ALL" || c.risk === risk) && (!q || c.label.toLowerCase().includes(q)),
    );
    const map = new Map<string, DiffChange[]>();
    for (const c of filtered) {
      const list = map.get(c.label) ?? [];
      list.push(c);
      map.set(c.label, list);
    }
    return Array.from(map.entries());
  }, [changes, op, risk, search]);

  if (!given && query.isPending) {
    return (
      <div className={cn("space-y-3", className)}>
        <Skeleton className="h-28 w-full rounded-2xl" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!given && query.isError) {
    return (
      <Callout
        tone="danger"
        title="We couldn't load the changes"
        className={className}
        actions={
          <Button size="sm" variant="outline" icon={RefreshCw} onClick={() => query.refetch()}>
            Retry
          </Button>
        }
      >
        {errorMessage(query.error)}
      </Callout>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {!hideSummary && diff && <DiffSummary diff={diff} />}

      {changes.length === 0 ? (
        <EmptyState
          icon={GitCompareArrows}
          title="No changes yet"
          description="This revision matches the live course. Edit the course and your changes will appear here, each with its risk rating."
        />
      ) : (
        <>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-1 overflow-x-auto px-1">
              <Segmented<OpFilter>
                size="sm"
                value={op}
                onChange={(v) => {
                  setOp(v);
                  setLimit(30);
                }}
                options={[
                  { key: "ALL", label: `All ${changes.length}` },
                  ...(["ADDED", "MODIFIED", "REMOVED", "MOVED"] as DiffOp[])
                    .filter((k) => counts[k])
                    .map((k) => ({ key: k as OpFilter, label: `${DIFF_OP[k].label} ${counts[k]}` })),
                ]}
              />
            </div>
            <div className="flex gap-2">
              <Input
                aria-label="Search changes"
                placeholder="Search changes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leading={<Search className="h-4 w-4" />}
                className="h-9 sm:w-56"
              />
              <Select aria-label="Filter by risk" value={risk} onChange={(e) => setRisk(e.target.value as RiskFilter)} className="h-9 w-36">
                <option value="ALL">Any risk</option>
                {(["HIGH", "MEDIUM", "LOW"] as Risk[]).map((r) => (
                  <option key={r} value={r}>
                    {RISK[r].label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {groups.length === 0 ? (
            <EmptyState compact icon={Search} title="Nothing matches these filters" description="Try another filter or clear the search." />
          ) : (
            <div className="flex flex-col gap-3">
              {groups.slice(0, limit).map(([label, list]) => (
                <ChangeGroup key={label} label={label} changes={list} />
              ))}
              {groups.length > limit && (
                <Button variant="outline" className="self-center" onClick={() => setLimit((l) => l + 30)}>
                  Show {Math.min(30, groups.length - limit)} more of {groups.length - limit}
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Computed risk, counts by op and the reasons — the top of the diff. */
export function DiffSummary({ diff, className }: { diff: RevisionDiff; className?: string }) {
  const counts = diffCounts(diff.changes);
  const [all, setAll] = useState(false);
  const reasons = diff.reasons ?? [];
  const shown = all ? reasons : reasons.slice(0, 4);
  return (
    <Card className={cn("!p-4 sm:!p-5", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {diff.computed_risk && <RiskBadge risk={diff.computed_risk} />}
          {diff.touches_assessment && (
            <Badge tone="violet" icon={ClipboardCheck}>
              Touches assessments
            </Badge>
          )}
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {diff.is_live_computation ? "Live comparison — updates as you edit" : "Recorded when it was submitted"}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["ADDED", "MODIFIED", "REMOVED", "MOVED"] as DiffOp[]).map((k) =>
            counts[k] ? (
              <Badge key={k} size="xs" tone={DIFF_OP[k].tone}>
                {counts[k]} {DIFF_OP[k].label.toLowerCase()}
              </Badge>
            ) : null,
          )}
        </div>
      </div>
      {diff.computed_risk && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-white">Review route:</span> {RISK[diff.computed_risk].description}
        </p>
      )}
      {reasons.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {shown.map((r, i) => (
            <ReasonLine key={i} reason={r} />
          ))}
          {reasons.length > 4 && (
            <li>
              <button
                type="button"
                onClick={() => setAll((v) => !v)}
                className="cursor-pointer text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
              >
                {all ? "Show fewer reasons" : `Show all ${reasons.length} reasons`}
              </button>
            </li>
          )}
        </ul>
      )}
    </Card>
  );
}

/** "HIGH · New course" → risk dot + text. */
export function ReasonLine({ reason }: { reason: string }) {
  const m = /^(LOW|MEDIUM|HIGH)\s*·\s*(.*)$/.exec(reason);
  const level = (m?.[1] as Risk | undefined) ?? undefined;
  const text = m?.[2] ?? reason;
  const dot = level === "HIGH" ? "bg-rose-500" : level === "MEDIUM" ? "bg-amber-500" : level === "LOW" ? "bg-emerald-500" : "bg-slate-400";
  return (
    <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
      <span className={cn("mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full", dot)} title={level ? RISK[level].label : undefined} />
      <span className="min-w-0 break-words">{text}</span>
    </li>
  );
}

function ChangeGroup({ label, changes }: { label: string; changes: DiffChange[] }) {
  const parts = label.split(" › ");
  const leaf = parts.pop();
  const sorted = [...changes].sort((a, b) => (RISK_RANK[a.risk ?? "LOW"] ?? 3) - (RISK_RANK[b.risk ?? "LOW"] ?? 3));
  const first = sorted[0];
  const Icon = (first.entity === "item" && first.item_type ? ITEM_ICONS[first.item_type] : ENTITY_ICONS[first.entity]) ?? FileText;
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
        <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          {parts.length > 0 && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{parts.join(" › ")}</p>}
          <p className="break-words font-semibold text-slate-900 dark:text-white">{leaf}</p>
          <div className="mt-2 flex flex-col gap-2.5">
            {sorted.map((c, i) => (
              <ChangeRow key={`${c.entity}-${c.key ?? i}-${i}`} change={c} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ChangeRow({ change: c }: { change: DiffChange }) {
  const fields =
    c.fields?.length ? c.fields : Array.from(new Set([...Object.keys(c.before ?? {}), ...Object.keys(c.after ?? {})]));
  const visible = fields.filter((f) => !["id", "section_id", "storage_key", "bunny_video_guid"].includes(f) || c.op === "MODIFIED");
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        <DiffOpBadge op={c.op} />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{entityLabel(c.entity)}</span>
        {c.risk && <RiskChip risk={c.risk} />}
      </div>
      {visible.length > 0 && c.op !== "MOVED" && (
        <dl className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 dark:divide-ink-line dark:border-ink-line">
          {visible.map((f) => (
            <FieldChange key={f} field={f} op={c.op} before={c.before?.[f]} after={c.after?.[f]} />
          ))}
        </dl>
      )}
      {c.op === "MOVED" && (c.before || c.after) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          {visible.map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5">
              {fieldLabel(f)}: <span className="line-through opacity-70">{formatValue(c.before?.[f], f)}</span>
              <ArrowRight className="h-3 w-3" />
              <span className="font-semibold">{formatValue(c.after?.[f], f)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function RiskChip({ risk }: { risk: Risk }) {
  const tone = RISK[risk]?.tone ?? "neutral";
  return (
    <Badge size="xs" tone={tone}>
      {risk === "HIGH" ? "High" : risk === "MEDIUM" ? "Medium" : "Low"}
    </Badge>
  );
}

function FieldChange({ field, op, before, after }: { field: string; op: DiffOp; before: unknown; after: unknown }) {
  return (
    <div className="grid gap-1 bg-white px-3 py-2 sm:grid-cols-[150px_1fr] sm:gap-3 dark:bg-transparent">
      <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{fieldLabel(field)}</dt>
      <dd className="min-w-0 text-sm">
        {op === "MODIFIED" ? (
          <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:gap-2">
            <ValueView value={before} field={field} tone="before" />
            <ArrowRight className="hidden h-4 w-4 flex-shrink-0 translate-y-1 text-slate-300 md:block" />
            <ValueView value={after} field={field} tone="after" />
          </div>
        ) : (
          <ValueView value={op === "REMOVED" ? before ?? after : after ?? before} field={field} tone={op === "REMOVED" ? "before" : "plain"} />
        )}
      </dd>
    </div>
  );
}

/** A value with long-text truncation and an expand toggle. */
export function ValueView({ value, field, tone = "plain" }: { value: unknown; field?: string; tone?: "before" | "after" | "plain" }) {
  const [open, setOpen] = useState(false);
  const text = formatValue(value, field);
  const long = text.length > 180 || text.split("\n").length > 4;
  return (
    <div
      className={cn(
        "min-w-0 flex-1 rounded-md px-2 py-1 text-[13px] leading-5",
        tone === "before" && "bg-rose-50 text-rose-900 dark:bg-rose-500/10 dark:text-rose-200",
        tone === "after" && "bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200",
        tone === "plain" && "px-0 text-slate-700 dark:text-slate-200",
      )}
    >
      <p
        className={cn(
          "whitespace-pre-wrap break-words",
          tone === "before" && "line-through decoration-rose-300 dark:decoration-rose-400/50",
          long && !open && "line-clamp-3",
        )}
      >
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-0.5 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
        >
          <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
          {open ? "Show less" : "Show all"}
        </button>
      )}
    </div>
  );
}
