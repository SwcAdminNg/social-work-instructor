"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CornerDownRight, MapPin, MessageSquare, MessagesSquare, RefreshCw, Reply, Send } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Badge, Button, Callout, Card, CardHeader, EmptyState, Select, Skeleton, Textarea, cn } from "@/components/ui/primitives";
import { studioApi } from "@/lib/studio/api";
import { formatDateTime, relativeTime } from "@/lib/studio/labels";
import { qk } from "@/lib/studio/queryKeys";
import type { AnchorType, RevisionComment } from "@/lib/studio/types";
import { type AnchorOption, anchorLabel, errorMessage, personName } from "./utils";

export type CommentsPanelProps = {
  revisionId: string;
  /** Show the composer, reply and resolve controls (`COMMENT` in available_actions). */
  canComment: boolean;
  /** What a comment can be pinned to (see `buildAnchorOptions`). */
  anchors?: AnchorOption[];
  className?: string;
};

type Thread = { root: RevisionComment; replies: RevisionComment[] };

/** Threaded, optionally anchored discussion on a revision (§7.7). */
export function CommentsPanel({ revisionId, canComment, anchors = [], className }: CommentsPanelProps) {
  const query = useQuery({
    queryKey: qk.comments(revisionId),
    queryFn: () => studioApi.listComments(revisionId),
    staleTime: 10_000,
  });
  const [showResolved, setShowResolved] = useState(false);

  const threads = useMemo(() => {
    const list = [...(query.data ?? [])].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    const ids = new Set(list.map((c) => c.id));
    const roots: Thread[] = [];
    const byRoot = new Map<string, Thread>();
    for (const c of list) {
      if (!c.parent_id || !ids.has(c.parent_id)) {
        const t = { root: c, replies: [] };
        roots.push(t);
        byRoot.set(c.id, t);
      }
    }
    // Replies to replies attach to the top-level thread.
    const parentOf = new Map(list.map((c) => [c.id, c.parent_id ?? null]));
    const rootId = (id: string): string => {
      let cur = id;
      for (let i = 0; i < 20; i++) {
        const p = parentOf.get(cur);
        if (!p || !ids.has(p)) return cur;
        cur = p;
      }
      return cur;
    };
    for (const c of list) {
      if (c.parent_id && ids.has(c.parent_id)) byRoot.get(rootId(c.id))?.replies.push(c);
    }
    return roots;
  }, [query.data]);

  const open = threads.filter((t) => !t.root.resolved_at);
  const resolved = threads.filter((t) => t.root.resolved_at);

  return (
    <Card className={className}>
      <CardHeader
        icon={MessagesSquare}
        title="Discussion"
        description={
          open.length
            ? `${open.length} open ${open.length === 1 ? "thread" : "threads"}${resolved.length ? ` · ${resolved.length} resolved` : ""}`
            : "Reviewers and authors talk it through here. Pin a comment to a module, lesson or question."
        }
        actions={
          <Button size="sm" variant="ghost" iconOnly icon={RefreshCw} aria-label="Refresh comments" onClick={() => query.refetch()} loading={query.isFetching && !query.isPending} />
        }
      />

      {canComment && <Composer revisionId={revisionId} anchors={anchors} />}

      <div className={cn(canComment && "mt-5")}>
        {query.isPending ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <Callout
            tone="danger"
            title="Comments didn't load"
            actions={
              <Button size="sm" variant="outline" onClick={() => query.refetch()}>
                Retry
              </Button>
            }
          >
            {errorMessage(query.error)}
          </Callout>
        ) : threads.length === 0 ? (
          <EmptyState
            compact
            icon={MessageSquare}
            title="No comments yet"
            description={canComment ? "Start the conversation — ask a question or flag something specific." : "Nobody has commented on this revision."}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {open.map((t) => (
              <ThreadView key={t.root.id} thread={t} revisionId={revisionId} anchors={anchors} canComment={canComment} />
            ))}
            {resolved.length > 0 && (
              <button
                type="button"
                onClick={() => setShowResolved((v) => !v)}
                className="flex cursor-pointer items-center gap-2 self-start rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {showResolved ? "Hide" : "Show"} {resolved.length} resolved {resolved.length === 1 ? "thread" : "threads"}
              </button>
            )}
            {showResolved &&
              resolved.map((t) => <ThreadView key={t.root.id} thread={t} revisionId={revisionId} anchors={anchors} canComment={canComment} />)}
          </div>
        )}
      </div>
    </Card>
  );
}

function ThreadView({
  thread,
  revisionId,
  anchors,
  canComment,
}: {
  thread: Thread;
  revisionId: string;
  anchors: AnchorOption[];
  canComment: boolean;
}) {
  const queryClient = useQueryClient();
  const [replying, setReplying] = useState(false);
  const [resolving, setResolving] = useState(false);
  const isResolved = !!thread.root.resolved_at;

  async function resolve() {
    setResolving(true);
    try {
      await studioApi.resolveComment(thread.root.id);
      await queryClient.invalidateQueries({ queryKey: qk.comments(revisionId) });
      toast.success("Thread resolved");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setResolving(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-3.5 transition-colors sm:p-4",
        isResolved
          ? "border-slate-100 bg-slate-50/60 opacity-80 dark:border-ink-line dark:bg-white/[0.02]"
          : "border-slate-200 bg-white dark:border-ink-line dark:bg-ink-raised/40",
      )}
    >
      <CommentBody comment={thread.root} anchors={anchors} />
      {thread.replies.length > 0 && (
        <div className="mt-3 flex flex-col gap-3 border-l-2 border-slate-100 pl-4 dark:border-ink-line">
          {thread.replies.map((r) => (
            <CommentBody key={r.id} comment={r} anchors={anchors} reply />
          ))}
        </div>
      )}
      {canComment && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {!isResolved && (
            <Button size="xs" variant="ghost" icon={Reply} onClick={() => setReplying((v) => !v)}>
              Reply
            </Button>
          )}
          {!isResolved && (
            <Button size="xs" variant="ghost" icon={CheckCircle2} onClick={resolve} loading={resolving}>
              Resolve
            </Button>
          )}
        </div>
      )}
      {replying && (
        <div className="mt-3">
          <Composer revisionId={revisionId} anchors={anchors} parentId={thread.root.id} onDone={() => setReplying(false)} />
        </div>
      )}
    </div>
  );
}

function CommentBody({ comment, anchors, reply }: { comment: RevisionComment; anchors: AnchorOption[]; reply?: boolean }) {
  const anchor = anchorLabel(anchors, comment.anchor_type, comment.anchor_id);
  return (
    <div className="flex gap-3">
      {reply ? (
        <CornerDownRight className="mt-1.5 h-4 w-4 flex-shrink-0 text-slate-300 dark:text-slate-600" />
      ) : (
        <Avatar name={personName(comment.author)} size="sm" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{personName(comment.author)}</span>
          <span className="text-xs text-slate-400" title={formatDateTime(comment.created_at)}>
            {relativeTime(comment.created_at)}
          </span>
          {comment.resolved_at && (
            <Badge size="xs" tone="success" icon={CheckCircle2}>
              Resolved
            </Badge>
          )}
        </div>
        {anchor && !reply && (
          <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-400/10 dark:text-brand-300">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{anchor}</span>
          </span>
        )}
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-200">{comment.body}</p>
      </div>
    </div>
  );
}

function Composer({
  revisionId,
  anchors,
  parentId,
  onDone,
}: {
  revisionId: string;
  anchors: AnchorOption[];
  parentId?: string;
  onDone?: () => void;
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [anchor, setAnchor] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, AnchorOption[]>();
    for (const a of anchors) map.set(a.group, [...(map.get(a.group) ?? []), a]);
    return Array.from(map.entries());
  }, [anchors]);

  async function post() {
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    const picked = anchors.find((a) => `${a.type}:${a.id}` === anchor);
    try {
      await studioApi.addComment(revisionId, {
        body: body.trim(),
        parent_id: parentId,
        anchor_type: picked?.type as AnchorType | undefined,
        anchor_id: picked?.id,
      });
      setBody("");
      setAnchor("");
      await queryClient.invalidateQueries({ queryKey: qk.comments(revisionId) });
      onDone?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 focus-within:border-brand-300 dark:border-ink-line dark:bg-white/[0.02]">
      <Textarea
        aria-label={parentId ? "Write a reply" : "Write a comment"}
        rows={parentId ? 2 : 3}
        placeholder={parentId ? "Write a reply…" : "Leave a comment for the reviewers and author…"}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void post();
          }
        }}
        className="border-0 bg-transparent shadow-none focus:ring-0 dark:bg-transparent"
        autoFocus={!!parentId}
      />
      {error && <p className="px-1 pb-1 text-xs font-medium text-rose-600 dark:text-rose-300">{error}</p>}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {!parentId && anchors.length > 0 ? (
          <Select aria-label="Pin this comment to" value={anchor} onChange={(e) => setAnchor(e.target.value)} className="h-8 text-xs sm:max-w-xs">
            <option value="">Not pinned — general comment</option>
            {groups.map(([group, list]) => (
              <optgroup key={group} label={group}>
                {list.map((a) => (
                  <option key={`${a.type}:${a.id}`} value={`${a.type}:${a.id}`}>
                    {a.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        ) : (
          <span className="hidden text-xs text-slate-400 sm:block">Ctrl + Enter to send</span>
        )}
        <div className="flex justify-end gap-2">
          {onDone && (
            <Button size="sm" variant="ghost" onClick={onDone} disabled={busy}>
              Cancel
            </Button>
          )}
          <Button size="sm" icon={Send} onClick={post} loading={busy} disabled={!body.trim()}>
            {parentId ? "Reply" : "Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
