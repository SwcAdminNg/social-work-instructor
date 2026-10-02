"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Inbox,
  RotateCcw,
} from "lucide-react";
import type { ApiEnvelope, ApprovalCounts, ApprovalRow } from "./types";

type ViewKey =
  | "awaiting_me"
  | "returned_to_me"
  | "overdue"
  | "ready_to_publish"
  | "recently_approved"
  | "recently_rejected"
  | "my_drafts";

const views: { key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "awaiting_me", label: "Awaiting me", icon: Inbox },
  { key: "returned_to_me", label: "Returned", icon: RotateCcw },
  { key: "overdue", label: "Overdue", icon: AlertTriangle },
  { key: "ready_to_publish", label: "Ready", icon: CheckCircle2 },
  { key: "my_drafts", label: "Drafts", icon: FileCheck2 },
  { key: "recently_approved", label: "Approved", icon: CheckCircle2 },
  { key: "recently_rejected", label: "Rejected", icon: RotateCcw },
];

function dateLabel(value?: string) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok) {
    throw new Error(json.message || "Unable to load approval data.");
  }
  return (json.data ?? json) as T;
}

export function ApprovalCentre({
  initialCounts,
  initialRows,
}: {
  initialCounts?: ApprovalCounts | null;
  initialRows?: ApprovalRow[];
}) {
  const [view, setView] = useState<ViewKey>("awaiting_me");
  const [kind, setKind] = useState<"ALL" | "COURSE_REVISION" | "ESSAY_MARK">("ALL");

  const countsQuery = useQuery({
    queryKey: ["approval-counts"],
    queryFn: () => fetchJson<ApprovalCounts>("/api/proxy/governance/approval-centre/counts"),
    initialData: initialCounts ?? undefined,
    staleTime: 30_000,
  });

  const rowsQuery = useQuery({
    queryKey: ["approval-centre", view, kind],
    queryFn: async () => {
      const params = new URLSearchParams({
        view,
        page: "1",
        page_size: "30",
      });
      if (kind !== "ALL") params.set("kind", kind);
      const res = await fetch(`/api/proxy/governance/approval-centre?${params}`);
      const json = (await res.json().catch(() => ({}))) as ApiEnvelope<ApprovalRow[]>;
      if (!res.ok) throw new Error(json.message || "Unable to load the approval queue.");
      return Array.isArray(json.data) ? json.data : [];
    },
    initialData:
      view === "awaiting_me" && kind === "ALL" ? initialRows ?? [] : undefined,
    staleTime: 20_000,
  });

  const counts = countsQuery.data;
  const rows = rowsQuery.data ?? [];

  const statusText = useMemo(() => {
    if (rowsQuery.isPending) return "Loading queue";
    if (rowsQuery.isFetching) return "Refreshing queue";
    return `${rows.length} item${rows.length === 1 ? "" : "s"}`;
  }, [rows.length, rowsQuery.isFetching, rowsQuery.isPending]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase text-[#2D6A4F] dark:text-[#74c69d]">
            Staff inbox
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Approval Centre
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Review course revisions and essay marks from the same clean queue, with overdue work and publish-ready items pulled forward.
          </p>
        </div>
        <span className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 shadow-sm dark:border-[#262a3d] dark:bg-[#111525] dark:text-slate-300">
          <Clock3 className="h-4 w-4" />
          {statusText}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-[#262a3d] dark:bg-[#111525]">
        <div className="flex min-w-max gap-1">
          {views.map((item) => {
            const Icon = item.icon;
            const active = item.key === view;
            const count =
              item.key === "awaiting_me"
                ? counts?.awaiting_me
                : item.key === "returned_to_me"
                  ? counts?.returned_to_me
                  : item.key === "overdue"
                    ? counts?.overdue
                    : item.key === "ready_to_publish"
                      ? counts?.ready_to_publish
                      : undefined;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-bold transition ${
                  active
                    ? "bg-[#2D6A4F] text-white dark:bg-[#52b788] dark:text-[#06130d]"
                    : "text-slate-600 hover:bg-[#eef8f2] hover:text-[#2D6A4F] dark:text-slate-300 dark:hover:bg-[#52b788]/12 dark:hover:text-[#74c69d]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {typeof count === "number" && (
                  <span className={`rounded px-1.5 py-0.5 text-[0.68rem] ${active ? "bg-white/20" : "bg-slate-100 dark:bg-white/10"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["ALL", "All work"],
          ["COURSE_REVISION", "Course revisions"],
          ["ESSAY_MARK", "Essay marks"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setKind(value as "ALL" | "COURSE_REVISION" | "ESSAY_MARK")}
            className={`h-9 rounded-md px-3 text-sm font-bold transition ${
              kind === value
                ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                : "border border-slate-200 bg-white text-slate-600 hover:border-[#b7e4c7] hover:text-[#2D6A4F] dark:border-[#262a3d] dark:bg-[#111525] dark:text-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-[#262a3d] dark:bg-[#111525]">
        {rowsQuery.isError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-extrabold text-rose-600 dark:text-rose-300">
              {(rowsQuery.error as Error).message}
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-md bg-[#eef8f2] text-[#2D6A4F] dark:bg-[#52b788]/12 dark:text-[#74c69d]">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-extrabold text-slate-950 dark:text-white">
              No items in this view
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try another tab or filter. New reviews and marks will appear here.
            </p>
          </div>
        ) : (
          <ul className="m-0 list-none divide-y divide-slate-100 p-0 dark:divide-[#262a3d]">
            {rows.map((row) => (
              <li key={`${row.kind}-${row.id}`} className="p-4 transition hover:bg-[#f7fcf9] dark:hover:bg-[#52b788]/8 sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[0.68rem] font-extrabold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {row.kind === "ESSAY_MARK" ? "Essay mark" : "Course revision"}
                      </span>
                      {row.item_type && (
                        <span className="rounded-md bg-[#eef8f2] px-2 py-1 text-[0.68rem] font-extrabold text-[#2D6A4F] dark:bg-[#52b788]/12 dark:text-[#74c69d]">
                          {row.item_type}
                        </span>
                      )}
                      {row.risk && (
                        <span className="rounded-md bg-amber-50 px-2 py-1 text-[0.68rem] font-extrabold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                          {row.risk}
                        </span>
                      )}
                      {row.is_overdue && (
                        <span className="rounded-md bg-rose-50 px-2 py-1 text-[0.68rem] font-extrabold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                          Overdue
                        </span>
                      )}
                    </div>
                    <p className="mt-3 truncate text-base font-extrabold text-slate-950 dark:text-white">
                      {row.item_title || "Untitled approval item"}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                      {row.course_title || row.current_stage || row.status || "Staff approval workflow"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>Stage: {row.current_stage?.replaceAll("_", " ") || "Ready"}</span>
                      <span>Due: {dateLabel(row.due_at)}</span>
                      {row.submitted_by?.name && <span>By: {row.submitted_by.name}</span>}
                    </div>
                  </div>
                  <Link
                    href={
                      row.kind === "ESSAY_MARK"
                        ? `/dashboard/approval-centre/marks/${row.id}`
                        : `/dashboard/approval-centre/revisions/${row.id}`
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-4 text-sm font-bold text-white no-underline transition hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d]"
                  >
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
