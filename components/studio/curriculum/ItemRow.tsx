"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, CalendarClock, ChevronRight, Clock3, Eye, Flag, GripVertical, Loader2 } from "lucide-react";
import { Badge, cn, ProgressBar, toneClasses } from "@/components/ui/primitives";
import { formatDateTime, formatMinutes } from "@/lib/studio/labels";
import { itemHealth } from "@/lib/studio/health";
import type { Item } from "@/lib/studio/types";
import { itemKind, itemMinutes, KIND_META, plural, questionCount } from "./itemMeta";
import { useUploads } from "./uploads";

function StatusBadges({ item }: { item: Item }) {
  const badges: React.ReactNode[] = [];
  if (item.item_type === "VIDEO") {
    const s = item.video?.status;
    if (s === "PROCESSING")
      badges.push(
        <Badge key="v" tone="info" size="xs" dot pulse>
          Processing
        </Badge>,
      );
    else if (s === "FAILED")
      badges.push(
        <Badge key="v" tone="danger" size="xs">
          Processing failed
        </Badge>,
      );
    else if (s !== "READY")
      badges.push(
        <Badge key="v" tone="warning" size="xs">
          {item.video?.bunny_video_guid ? "Awaiting video" : "No video yet"}
        </Badge>,
      );
  }
  if (item.item_type === "DOCUMENT" && !item.document?.is_uploaded)
    badges.push(
      <Badge key="d" tone="warning" size="xs">
        Upload incomplete
      </Badge>,
    );
  if (item.item_type === "LIVE_SESSION" && item.live_session?.status && item.live_session.status !== "SCHEDULED") {
    const st = item.live_session.status;
    badges.push(
      <Badge key="l" tone={st === "LIVE" ? "danger" : "neutral"} size="xs" dot={st === "LIVE"} pulse={st === "LIVE"}>
        {st === "LIVE" ? "Live now" : st === "ENDED" ? "Ended" : "Cancelled"}
      </Badge>,
    );
  }
  if (item.assessment?.is_final_assessment)
    badges.push(
      <Badge key="f" tone="violet" size="xs" icon={Flag}>
        Final assessment
      </Badge>,
    );
  if (item.is_preview)
    badges.push(
      <Badge key="p" tone="brand" size="xs" icon={Eye}>
        Free preview
      </Badge>,
    );
  return <>{badges}</>;
}

function metaLine(item: Item) {
  const parts: React.ReactNode[] = [];
  const kind = itemKind(item);
  if (item.item_type === "LIVE_SESSION" && item.live_session?.scheduled_start_at) {
    parts.push(
      <span key="when" className="inline-flex items-center gap-1">
        <CalendarClock className="h-3 w-3" />
        {formatDateTime(item.live_session.scheduled_start_at)}
      </span>,
    );
  }
  if (kind === "QUIZ" || kind === "QUIZ_GROUP") {
    const n = questionCount(item);
    parts.push(<span key="q">{n ? plural(n, "question") : "No questions yet"}</span>);
    if (kind === "QUIZ_GROUP") parts.push(<span key="g">{plural(item.assessment?.quiz_group?.sections?.length ?? 0, "pool")}</span>);
  }
  if (item.item_type === "DOCUMENT" && item.document?.file_name) {
    parts.push(
      <span key="file" className="max-w-[14rem] truncate">
        {item.document.file_name}
      </span>,
    );
  }
  if (item.item_type === "LINKS" && item.link?.url) {
    let host = item.link.url;
    try {
      host = new URL(item.link.url).hostname.replace(/^www\./, "");
    } catch {
      /* keep raw */
    }
    parts.push(
      <span key="url" className="max-w-[14rem] truncate">
        {host}
      </span>,
    );
  }
  const mins = itemMinutes(item);
  if (mins)
    parts.push(
      <span key="m" className="inline-flex items-center gap-1">
        <Clock3 className="h-3 w-3" />
        {formatMinutes(mins)}
      </span>,
    );
  return parts;
}

export function ItemRow({
  item,
  index,
  sectionTitle,
  sectionId,
  readOnly,
  onOpen,
}: {
  item: Item;
  index: number;
  sectionTitle: string;
  sectionId: string;
  readOnly: boolean;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: readOnly,
  });
  const upload = useUploads().get(item.id);
  const kind = itemKind(item);
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const issues = itemHealth(item, sectionTitle, sectionId);
  const hasError = issues.some((i) => i.severity === "error");
  const parts = metaLine(item);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group/item relative flex items-center gap-2 rounded-xl border border-transparent bg-white pr-2 transition-colors hover:border-slate-200 hover:bg-slate-50/80 dark:bg-transparent dark:hover:border-ink-line dark:hover:bg-white/[0.03]",
        isDragging && "z-10 border-brand-300 bg-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.45)] dark:border-brand-400/50 dark:bg-ink-raised",
        readOnly && "pl-2",
      )}
    >
      {!readOnly && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${item.title}`}
          className="flex h-10 w-6 flex-shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-slate-300 opacity-60 transition hover:text-slate-500 group-hover/item:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-300"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-2.5 text-left outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-brand-400/50"
      >
        <span className={cn("relative grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ring-1 ring-inset", toneClasses(meta.tone))}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
          {hasError && (
            <span
              title={issues[0]?.message}
              className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-white ring-2 ring-white dark:ring-ink-surface"
            >
              <AlertCircle className="h-3 w-3" strokeWidth={2.6} />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-xs font-semibold tabular-nums text-slate-400 dark:text-slate-500">{index + 1}.</span>
            <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</span>
          </span>
          <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-500 dark:text-slate-400">{meta.label}</span>
            {parts.map((p, i) => (
              <span key={i} className="inline-flex min-w-0 items-center gap-2">
                <span className="text-slate-300 dark:text-slate-600">·</span>
                {p}
              </span>
            ))}
          </span>
          {upload && (
            <span className="mt-2 flex items-center gap-2">
              {upload.phase === "error" ? (
                <span className="text-xs font-medium text-rose-600 dark:text-rose-300">Upload failed — open to retry</span>
              ) : (
                <>
                  <Loader2 className="h-3 w-3 flex-shrink-0 animate-spin text-brand-600 dark:text-brand-300" />
                  <ProgressBar value={upload.progress} className="max-w-56" />
                  <span className="text-[11px] font-semibold tabular-nums text-slate-500">
                    {upload.phase === "preparing" ? "Preparing…" : upload.phase === "finalizing" ? "Finishing…" : `${upload.progress}%`}
                  </span>
                </>
              )}
            </span>
          )}
        </span>
        <span className="hidden flex-shrink-0 flex-wrap items-center justify-end gap-1.5 sm:flex">
          <StatusBadges item={item} />
        </span>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition-transform group-hover/item:translate-x-0.5 group-hover/item:text-slate-500 dark:text-slate-600" />
      </button>
    </li>
  );
}
