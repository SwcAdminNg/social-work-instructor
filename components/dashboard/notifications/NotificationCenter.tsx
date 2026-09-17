"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Bell,
  CheckCheck,
  Loader2,
  RefreshCcw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { getWsBaseUrl } from "@/lib/wsUrl";

type NotificationItem = {
  id: string;
  created_at: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  metadata_json?: Record<string, unknown> | null;
  is_read: boolean;
  read_at?: string | null;
};

type NotificationListResponse = {
  data?: NotificationItem[];
  message?: string;
  meta?: {
    page?: number;
    page_size?: number;
    total_items?: number;
    total_pages?: number;
    has_next?: boolean;
  };
};

type AppSession = {
  accessToken?: string;
};

type ConnectionState = "connecting" | "open" | "closed";
type DashboardOverviewCountEvent = CustomEvent<{
  unread_notifications_count?: number;
}>;

const PAGE_SIZE = 10;
const RECONNECT_BASE_DELAY_MS = 2000;
const RECONNECT_MAX_DELAY_MS = 30000;

function unreadBadgeLabel(count: number) {
  return count > 99 ? "99+" : String(count);
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function normalizeNotification(input: unknown): NotificationItem | null {
  const item = input as Partial<NotificationItem> | null;
  if (!item?.id || !item.title || !item.created_at || !item.type) return null;

  return {
    id: item.id,
    created_at: item.created_at,
    type: item.type,
    title: item.title,
    body: item.body ?? null,
    link: item.link ?? null,
    metadata_json: item.metadata_json ?? null,
    is_read: Boolean(item.is_read),
    read_at: item.read_at ?? null,
  };
}

function mergeNewest(
  current: NotificationItem[],
  incoming: NotificationItem[],
) {
  const byId = new Map<string, NotificationItem>();
  for (const item of [...incoming, ...current]) {
    byId.set(item.id, item);
  }

  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function NotificationCenter() {
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = (session as AppSession | null)?.accessToken;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>("closed");
  const rootRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const openRef = useRef(false);
  const markReadAndOpenRef = useRef<(notification: NotificationItem) => void>(
    () => {},
  );

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/proxy/notifications/unread-count");
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setUnreadCount(Math.max(0, Number(json?.data?.unread_count) || 0));
      }
    } catch {
      // The bell should stay usable if a background refresh misses.
    }
  }, []);

  const loadNotifications = useCallback(async (nextPage = 1) => {
    if (nextPage === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await fetch(
        `/api/proxy/notifications?page=${nextPage}&page_size=${PAGE_SIZE}`,
      );
      const json = (await res
        .json()
        .catch(() => ({}))) as NotificationListResponse;

      if (!res.ok) {
        throw new Error(json.message || "Failed to load notifications.");
      }

      const incoming = Array.isArray(json.data)
        ? json.data
            .map((item) => normalizeNotification(item))
            .filter((item): item is NotificationItem => Boolean(item))
        : [];

      setItems((current) =>
        nextPage === 1 ? incoming : mergeNewest(current, incoming),
      );
      setPage(nextPage);
      setHasNext(Boolean(json.meta?.has_next));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load notifications.",
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const reconcile = useCallback(() => {
    fetchUnreadCount();
    if (openRef.current) {
      loadNotifications(1);
    }
  }, [fetchUnreadCount, loadNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchUnreadCount, 0);
    return () => clearTimeout(timeout);
  }, [fetchUnreadCount]);

  useEffect(() => {
    function handleOverviewCounts(event: Event) {
      const detail = (event as DashboardOverviewCountEvent).detail;
      if (typeof detail?.unread_notifications_count === "number") {
        setUnreadCount(Math.max(0, detail.unread_notifications_count));
      }
    }

    window.addEventListener("dashboard:overview-counts", handleOverviewCounts);
    return () =>
      window.removeEventListener(
        "dashboard:overview-counts",
        handleOverviewCounts,
      );
  }, []);

  useEffect(() => {
    if (!open || items.length > 0) return;
    const timeout = setTimeout(() => loadNotifications(1), 0);
    return () => clearTimeout(timeout);
  }, [items.length, loadNotifications, open]);

  useEffect(() => {
    if (!accessToken) {
      const timeout = setTimeout(() => setConnection("closed"), 0);
      return () => clearTimeout(timeout);
    }

    if (!getWsBaseUrl()) {
      const timeout = setTimeout(() => setConnection("closed"), 0);
      return () => clearTimeout(timeout);
    }

    if (typeof WebSocket === "undefined") {
      const timeout = setTimeout(() => setConnection("closed"), 0);
      return () => clearTimeout(timeout);
    }

    const wsBaseUrl = getWsBaseUrl();
    if (!wsBaseUrl) {
      return;
    }

    let closedByEffect = false;
    const socketToken = accessToken;

    function scheduleReconnect() {
      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(
        RECONNECT_MAX_DELAY_MS,
        RECONNECT_BASE_DELAY_MS * 2 ** attempt,
      );
      reconnectAttemptRef.current = attempt + 1;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    }

    function connect() {
      setConnection("connecting");
      const ws = new WebSocket(
        `${wsBaseUrl}/notifications/ws?token=${encodeURIComponent(
          socketToken,
        )}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        setConnection("open");
        reconcile();
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const notification = normalizeNotification(payload?.data);
          if (payload?.type !== "notification" || !notification) return;

          setItems((current) => mergeNewest(current, [notification]));
          setUnreadCount((count) => count + 1);
          toast(notification.title, {
            description: notification.body || undefined,
            action: notification.link
              ? {
                  label: "Open",
                  onClick: () => {
                    markReadAndOpenRef.current(notification);
                  },
                }
              : undefined,
          });
        } catch {
          // Ignore malformed frames from a transient socket issue.
        }
      };

      ws.onclose = (event) => {
        setConnection("closed");
        if (!closedByEffect && event.code !== 4401) {
          scheduleReconnect();
          reconcile();
        }
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      closedByEffect = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [accessToken, reconcile]);

  const markRead = useCallback(async (notification: NotificationItem) => {
    if (notification.is_read) return notification;

    const previousUnread = unreadCount;
    setItems((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, is_read: true, read_at: new Date().toISOString() }
          : item,
      ),
    );
    setUnreadCount((count) => Math.max(0, count - 1));

    try {
      const res = await fetch(
        `/api/proxy/notifications/${notification.id}/read`,
        { method: "PATCH" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || "Failed to mark notification as read.");
      }
      const updated = normalizeNotification(json.data);
      if (updated) {
        setItems((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        return updated;
      }
    } catch (error) {
      setItems((current) =>
        current.map((item) =>
          item.id === notification.id ? notification : item,
        ),
      );
      setUnreadCount(previousUnread);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to mark notification as read.",
      );
    }

    return notification;
  }, [unreadCount]);

  const markReadAndOpen = useCallback(async (notification: NotificationItem) => {
    const updated = await markRead(notification);
    setOpen(false);
    if (updated.link) {
      router.push(updated.link);
    }
  }, [markRead, router]);

  useEffect(() => {
    markReadAndOpenRef.current = markReadAndOpen;
  }, [markReadAndOpen]);

  const markAllRead = useCallback(async () => {
    setMarkingAll(true);
    const previousItems = items;
    const previousUnread = unreadCount;

    setItems((current) =>
      current.map((item) => ({
        ...item,
        is_read: true,
        read_at: item.read_at ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);

    try {
      const res = await fetch("/api/proxy/notifications/read-all", {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || "Failed to mark notifications as read.");
      }
    } catch (error) {
      setItems(previousItems);
      setUnreadCount(previousUnread);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to mark notifications as read.",
      );
    } finally {
      setMarkingAll(false);
    }
  }, [items, unreadCount]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-[#eef8f2] hover:text-[#2D6A4F] dark:text-slate-300 dark:hover:bg-[#52b788]/12 dark:hover:text-[#b7e4c7]"
      >
        <Bell className="h-5 w-5" strokeWidth={1.9} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f43f5e] px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-white dark:ring-[#111525]">
            {unreadBadgeLabel(unreadCount)}
          </span>
        )}
      </button>

      <div
        hidden={!open}
        className={`absolute right-0 z-50 mt-2 w-[23rem] max-w-[calc(100vw-2rem)] origin-top-right rounded-lg border border-[#e5e3ee] bg-white shadow-xl transition-all duration-150 dark:border-[#262a3d] dark:bg-[#111525] ${
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#eceaf4] px-4 py-3 dark:border-[#262a3d]">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Notifications
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              {connection === "open" ? (
                <Wifi className="h-3.5 w-3.5 text-[#2D6A4F] dark:text-[#74c69d]" />
              ) : connection === "connecting" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" />
              )}
              {unreadCount} unread
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => loadNotifications(1)}
              disabled={loading}
              className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-[#eef8f2] hover:text-[#2D6A4F] disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-[#52b788]/12 dark:hover:text-[#b7e4c7]"
              aria-label="Refresh notifications"
              title="Refresh"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={markAllRead}
              disabled={markingAll || unreadCount === 0}
              className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-[#eef8f2] hover:text-[#2D6A4F] disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-[#52b788]/12 dark:hover:text-[#b7e4c7]"
              aria-label="Mark all as read"
              title="Mark all as read"
            >
              {markingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm font-semibold text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading notifications
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Nothing new yet
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Updates from courses, payments, support, and your account will
                appear here.
              </p>
            </div>
          ) : (
            <ul className="m-0 list-none p-0">
              {items.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => markReadAndOpen(notification)}
                    className="flex w-full cursor-pointer gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-[#f7fcf9] dark:hover:bg-[#52b788]/12"
                  >
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        notification.is_read
                          ? "bg-slate-300 dark:bg-slate-700"
                          : "bg-[#2D6A4F] dark:bg-[#74c69d]"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-950 dark:text-gray-100">
                        {notification.title}
                      </span>
                      {notification.body && (
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                          {notification.body}
                        </span>
                      )}
                      <span className="mt-1 block text-[0.7rem] font-medium text-gray-400 dark:text-gray-600">
                        {formatNotificationTime(notification.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {hasNext && (
            <button
              type="button"
              onClick={() => loadNotifications(page + 1)}
              disabled={loadingMore}
              className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 text-xs font-bold text-slate-600 transition hover:border-[#2D6A4F]/50 hover:text-[#2D6A4F] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-[#74c69d] dark:hover:text-[#74c69d]"
            >
              {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Load more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
