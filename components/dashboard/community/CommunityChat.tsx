"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  FileText,
  Hash,
  ImageIcon,
  Loader2,
  MessageSquareReply,
  Paperclip,
  Radio,
  Search,
  Send,
  ShieldCheck,
  UsersRound,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/formatBytes";
import { getWsBaseUrl } from "@/lib/wsUrl";

export type Community = {
  id: string;
  type:
    | "GENERAL"
    | "INSTRUCTOR_GENERAL"
    | "ADMIN_GENERAL"
    | "HELP"
    | "COURSE"
    | "CUSTOM"
    | string;
  name: string;
  course_id?: string;
  is_active?: boolean;
  created_at?: string;
  member_count?: number;
};

type MemberProfile = {
  id?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  profile_picture_url?: string;
  image?: string;
  user_type?: "ADMIN" | "INSTRUCTOR" | "USER" | string;
};

type Member = MemberProfile & {
  user?: MemberProfile | null;
  student?: MemberProfile | null;
  member?: MemberProfile | null;
  is_online?: boolean;
};

type ResourceReference = {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  thumbnail_url?: string;
};

type Message = {
  id: string;
  community_id: string;
  sender_id: string;
  sender?: Member;
  body?: string;
  created_at: string;
  reply_to?: {
    id: string;
    sender_id: string;
    sender?: Member | null;
    body?: string;
    attachment_file_name?: string;
  } | null;
  attachment_url?: string;
  attachment_file_name?: string;
  attachment_mime_type?: string;
  attachment_file_size_bytes?: number;
  attachment_kind?: "IMAGE" | "DOCUMENT";
  resource_reference?: ResourceReference | null;
  status?: "sending" | "sent";
};

type AttachmentFields = {
  attachment_storage_key: string;
  attachment_file_name: string;
  attachment_mime_type: string;
  attachment_file_size_bytes: number;
};

type InitialResourceShare = Pick<ResourceReference, "id" | "name" | "slug">;
type ConnectionState = "connecting" | "open" | "closed";
type MemberMode = "online" | "all";
type AppSession = {
  accessToken?: string;
  user?: {
    id?: string;
  };
};
type MessageListResponse = {
  data?: Message[];
  message?: string;
  meta?: {
    has_next?: boolean;
  };
};
type DataResponse<T> = {
  data?: T;
  message?: string;
  meta?: {
    total_items?: number;
    total_pages?: number;
  };
};
type UnreadCountResponse = {
  data?: { total_unread?: number };
};

const PAGE_SIZE = 20;
const MEMBER_PAGE_SIZE = 10;
const ONLINE_PREVIEW_LIMIT = 5;
// The API caps page_size at 100 on every paginated endpoint (see PaginationParams
// in the backend) - this fetches as large a batch as the API allows in one request.
const ONLINE_ROSTER_FETCH_SIZE = 100;
const PING_INTERVAL_MS = 30000;
const RECONNECT_DELAY_MS = 2500;
const TYPING_EXPIRE_MS = 4500;
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function memberProfile(member?: Member | null): MemberProfile {
  return member?.user || member?.student || member?.member || member || {};
}

function memberId(member?: Member | null) {
  return memberProfile(member).id || member?.id;
}

function displayName(member?: Member | null) {
  if (!member) return "Community member";
  const profile = memberProfile(member);
  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ");
  return fullName || profile.username || "Community member";
}

function memberFirstName(member?: Member | null) {
  const profile = memberProfile(member);
  return profile.first_name || displayName(member);
}

function memberUsername(member?: Member | null) {
  const profile = memberProfile(member);
  return profile.username ? `@${profile.username}` : "";
}

function staffRoleLabel(member?: Member | null) {
  const userType = memberProfile(member).user_type;
  if (userType === "ADMIN") return "Admin";
  if (userType === "INSTRUCTOR") return "Instructor";
  return null;
}

function memberRoleLabel(member?: Member | null) {
  const userType = memberProfile(member).user_type;
  if (userType === "ADMIN") return "Admin";
  if (userType === "INSTRUCTOR") return "Instructor";
  if (userType === "USER") return "Member";
  if (userType) {
    return userType
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return "Member";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "C") + (parts[1]?.[0] || "");
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function sortMessages(list: Message[]) {
  return [...list].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function messageFingerprint(input: {
  body?: string | null;
  reply_to_message_id?: string | null;
  attachment_file_name?: string | null;
}) {
  return `${input.body || ""}|${input.reply_to_message_id || ""}|${
    input.attachment_file_name || ""
  }`;
}

function unreadBadgeLabel(count: number) {
  return count > 99 ? "99+" : String(count);
}

function parseTotalUnread(json: unknown): number {
  const total = (json as UnreadCountResponse)?.data?.total_unread;
  return Math.max(0, Number(total) || 0);
}

function CommunityTypeIcon({ type }: { type: Community["type"] }) {
  if (
    type === "GENERAL" ||
    type === "INSTRUCTOR_GENERAL" ||
    type === "ADMIN_GENERAL"
  ) {
    return <Hash className="h-4 w-4" />;
  }
  if (type === "HELP") return <CircleHelp className="h-4 w-4" />;
  if (type === "COURSE") return <BookOpen className="h-4 w-4" />;
  return <UsersRound className="h-4 w-4" />;
}

function communityTypeLabel(type: Community["type"]) {
  if (type === "COURSE") return "Course room";
  if (type === "HELP") return "Help room";
  if (type === "GENERAL") return "General room";
  if (type === "INSTRUCTOR_GENERAL") return "Instructor room";
  if (type === "ADMIN_GENERAL") return "Admin room";
  if (type === "CUSTOM") return "Custom room";
  return `${type.toLowerCase().replaceAll("_", " ")} room`;
}

export default function CommunityChat({
  initialCommunities,
  selectedCommunityId,
  initialResourceShare,
}: {
  initialCommunities: Community[];
  selectedCommunityId?: string;
  initialResourceShare: InitialResourceShare | null;
}) {
  const { data: session } = useSession();
  const sessionWithToken = session as AppSession | null;
  const accessToken = sessionWithToken?.accessToken;
  const currentUserId = sessionWithToken?.user?.id;

  const communities = initialCommunities;
  const [activeId, setActiveId] = useState(
    selectedCommunityId || initialCommunities[0]?.id || "",
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [resourceShare, setResourceShare] =
    useState<InitialResourceShare | null>(initialResourceShare);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreviewUrl, setAttachedPreviewUrl] = useState<string | null>(
    null,
  );
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [page, setPage] = useState(1);
  const [sending, setSending] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>("closed");
  const [memberMode, setMemberMode] = useState<MemberMode>("online");
  const [memberPage, setMemberPage] = useState(1);
  const [memberTotalPages, setMemberTotalPages] = useState(1);
  const [memberTotalItems, setMemberTotalItems] = useState(0);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [rosterExpanded, setRosterExpanded] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, number>>(
    new Map(),
  );
  const [mobileScreen, setMobileScreen] = useState<"list" | "chat">("list");
  const [mobileMembersOpen, setMobileMembersOpen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pendingSendsRef = useRef<Map<string, string>>(new Map());
  const pendingBlobUrlsRef = useRef<Map<string, string>>(new Map());
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingFalseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const scrollCommunityRef = useRef<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeIdRef = useRef(activeId);
  const memberModeRef = useRef(memberMode);
  const memberPageRef = useRef(memberPage);
  const lastMemberLoadRef = useRef({ key: "", at: 0 });

  const activeCommunity = useMemo(
    () => communities.find((community) => community.id === activeId),
    [activeId, communities],
  );

  const selfMember: Member = useMemo(
    () => ({
      id: currentUserId,
      first_name: session?.user?.name || undefined,
      profile_picture_url: session?.user?.image || undefined,
    }),
    [currentUserId, session?.user?.name, session?.user?.image],
  );

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    memberModeRef.current = memberMode;
    memberPageRef.current = memberPage;
  }, [memberMode, memberPage]);

  const filteredCommunities = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return communities;
    return communities.filter((community) =>
      `${community.name} ${community.type}`.toLowerCase().includes(normalized),
    );
  }, [communities, search]);

  const onlineMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          (memberId(member) ? onlineIds.has(memberId(member) as string) : false) ||
          member.is_online,
      ),
    [members, onlineIds],
  );
  const compactOnlineMembers = onlineMembers.slice(0, ONLINE_PREVIEW_LIMIT);
  const onlineTotalPages = Math.max(
    1,
    Math.ceil(onlineMembers.length / MEMBER_PAGE_SIZE),
  );
  const rosterTotalPages =
    memberMode === "online" ? onlineTotalPages : memberTotalPages;
  const displayedMembers =
    memberMode === "online"
      ? onlineMembers.slice(
          (memberPage - 1) * MEMBER_PAGE_SIZE,
          memberPage * MEMBER_PAGE_SIZE,
        )
      : members;

  const typingLine = useMemo(() => {
    const names = Array.from(typingUsers.entries()).map(([userId]) =>
      displayName(members.find((member) => memberId(member) === userId)),
    );

    if (names.length === 0) return "";
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names.join(" and ")} are typing...`;
    const [first, second, ...rest] = names;
    return `${first}, ${second} and ${rest.length} other${
      rest.length === 1 ? "" : "s"
    } are typing...`;
  }, [members, typingUsers]);

  const visibleMessages = useMemo(
    () =>
      messages.filter(
        (message) =>
          !message.community_id || message.community_id === activeId,
      ),
    [activeId, messages],
  );

  const mergeMessage = useCallback(
    (message: Message) => {
      if (message.community_id && message.community_id !== activeIdRef.current) {
        return;
      }

      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;

        if (message.sender_id === currentUserId) {
          const fingerprint = messageFingerprint({
            body: message.body,
            reply_to_message_id: message.reply_to?.id ?? null,
            attachment_file_name: message.attachment_file_name,
          });
          const tempId = pendingSendsRef.current.get(fingerprint);
          if (tempId) {
            pendingSendsRef.current.delete(fingerprint);
            const blobUrl = pendingBlobUrlsRef.current.get(tempId);
            if (blobUrl) {
              URL.revokeObjectURL(blobUrl);
              pendingBlobUrlsRef.current.delete(tempId);
            }
            const index = prev.findIndex((item) => item.id === tempId);
            if (index === -1) return [...prev, message];
            const next = [...prev];
            next[index] = message;
            return next;
          }
        }

        return [...prev, message];
      });
    },
    [currentUserId],
  );

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/proxy/community/unread-count");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setTotalUnread(parseTotalUnread(json));
    } catch {
      // Badges are additive; the room list should stay usable if this fails.
    }
  }, []);

  useEffect(() => {
    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 30000);
    window.addEventListener("community:unread-refresh", fetchUnreadCounts);
    return () => {
      clearInterval(interval);
      window.removeEventListener("community:unread-refresh", fetchUnreadCounts);
    };
  }, [fetchUnreadCounts]);

  const markRead = useCallback((communityId: string) => {
    if (!communityId) return;
    fetch(`/api/proxy/community/${communityId}/read`, { method: "POST" })
      .catch(() => {})
      .finally(() => {
        window.dispatchEvent(new Event("community:unread-refresh"));
      });
  }, []);

  const clearAttachment = useCallback(() => {
    setAttachedFile(null);
    setAttachedPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const loadMessages = useCallback(
    async (communityId: string, nextPage = 1) => {
      if (!communityId) return;
      if (nextPage === 1) {
        setLoadingMessages(true);
      } else {
        setLoadingOlder(true);
      }

      try {
        const res = await fetch(
          `/api/proxy/community/${communityId}/messages?page=${nextPage}&page_size=${PAGE_SIZE}`,
        );
        const json = (await res
          .json()
          .catch(() => ({}))) as MessageListResponse;
        if (!res.ok) {
          throw new Error(json.message || "Failed to load messages.");
        }

        const incoming = Array.isArray(json?.data) ? json.data : [];
        if (activeIdRef.current !== communityId) return;

        const scopedIncoming = incoming.filter(
          (message) =>
            !message.community_id || message.community_id === communityId,
        );
        setHasOlder(Boolean(json?.meta?.has_next));
        setPage(nextPage);
        setMessages((prev) => {
          if (nextPage === 1) return sortMessages(scopedIncoming);
          const ids = new Set(prev.map((message) => message.id));
          return sortMessages([
            ...scopedIncoming.filter((message: Message) => !ids.has(message.id)),
            ...prev,
          ]);
        });
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to load messages."));
      } finally {
        setLoadingMessages(false);
        setLoadingOlder(false);
      }
    },
    [],
  );

  const loadMembers = useCallback(
    async (
      communityId: string,
      nextPage = 1,
      mode: MemberMode = "online",
    ) => {
      if (!communityId) return;
      const loadKey = `${communityId}:${nextPage}:${mode}`;
      const now = Date.now();
      if (
        lastMemberLoadRef.current.key === loadKey &&
        now - lastMemberLoadRef.current.at < 1000
      ) {
        return;
      }
      lastMemberLoadRef.current = { key: loadKey, at: now };

      const pageSize =
        mode === "online" ? ONLINE_ROSTER_FETCH_SIZE : MEMBER_PAGE_SIZE;

      setLoadingMembers(true);
      try {
        const [membersRes, onlineRes] = await Promise.all([
          fetch(
            `/api/proxy/community/${communityId}/members?page=${nextPage}&page_size=${pageSize}`,
          ),
          fetch(`/api/proxy/community/${communityId}/online`),
        ]);
        const membersJson = (await membersRes
          .json()
          .catch(() => ({}))) as DataResponse<Member[]>;
        const onlineJson = (await onlineRes
          .json()
          .catch(() => ({}))) as DataResponse<{
          online_user_ids?: string[];
        }>;

        if (activeIdRef.current !== communityId) return;

        if (membersRes.ok) {
          setMembers(Array.isArray(membersJson?.data) ? membersJson.data : []);
          setMemberTotalPages(Math.max(1, membersJson.meta?.total_pages || 1));
          setMemberTotalItems(membersJson.meta?.total_items || 0);
        }
        if (onlineRes.ok && Array.isArray(onlineJson?.data?.online_user_ids)) {
          setOnlineIds(new Set(onlineJson.data.online_user_ids));
        }
      } catch {
        // Presence is additive; chat should stay usable even if roster refresh fails.
      } finally {
        setLoadingMembers(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedCommunityId) return;
    setActiveId(selectedCommunityId);
    setMobileScreen("chat");
  }, [selectedCommunityId]);

  const memberStateCommunityRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeId) return;
    const communityChanged = memberStateCommunityRef.current !== activeId;

    if (communityChanged) {
      memberStateCommunityRef.current = activeId;
      setMessages([]);
      setMembers([]);
      setTypingUsers(new Map());
      setReplyTo(null);
      setMemberMode("online");
      setMemberPage(1);
      setMemberTotalPages(1);
      setMemberTotalItems(0);
      setRosterExpanded(false);
      setMobileMembersOpen(false);
      clearAttachment();
      loadMessages(activeId, 1);
      loadMembers(activeId, 1, "online");
      markRead(activeId);
      return;
    }

    loadMembers(activeId, memberPage, memberMode);
  }, [
    activeId,
    clearAttachment,
    loadMembers,
    loadMessages,
    markRead,
    memberMode,
    memberPage,
  ]);

  useEffect(() => {
    if (memberPage > rosterTotalPages) {
      setMemberPage(rosterTotalPages);
    }
  }, [memberPage, rosterTotalPages]);

  useEffect(() => {
    if (!activeId) return;
    const interval = setInterval(
      () => loadMembers(activeId, memberPage, memberMode),
      30000,
    );
    return () => clearInterval(interval);
  }, [activeId, loadMembers, memberMode, memberPage]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    isAtBottomRef.current = true;
    setIsAtBottom(true);
    setNewMessageCount(0);
  }, []);

  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom < 120;
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
    if (atBottom) setNewMessageCount(0);
  }, []);

  useEffect(() => {
    const communityChanged = scrollCommunityRef.current !== activeId;
    scrollCommunityRef.current = activeId;

    const last = visibleMessages[visibleMessages.length - 1];

    if (communityChanged) {
      lastMessageIdRef.current = last?.id ?? null;
      requestAnimationFrame(() => scrollToBottom("auto"));
      return;
    }

    if (!last || last.id === lastMessageIdRef.current) return;
    lastMessageIdRef.current = last.id;

    if (last.sender_id === currentUserId || isAtBottomRef.current) {
      scrollToBottom("smooth");
    } else {
      setNewMessageCount((count) => count + 1);
    }
  }, [visibleMessages, activeId, currentUserId, scrollToBottom]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        const next = new Map(prev);
        for (const [userId, expiresAt] of next) {
          if (expiresAt <= now) next.delete(userId);
        }
        return next.size === prev.size ? prev : next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!accessToken || !activeId) {
      setConnection("closed");
      return;
    }

    const socketToken = accessToken;
    let hasOpenedOnce = false;
    let closedByThisEffect = false;

    function connect() {
      setConnection("connecting");
      const ws = new WebSocket(
        `${getWsBaseUrl()}/community/${activeId}/ws?token=${encodeURIComponent(
          socketToken,
        )}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        setConnection("open");
        if (hasOpenedOnce) {
          loadMessages(activeId, 1);
          loadMembers(activeId, memberPageRef.current, memberModeRef.current);
        }
        hasOpenedOnce = true;
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "message" && payload.data) {
            mergeMessage(payload.data as Message);
            if (payload.data.sender_id !== currentUserId) {
              markRead(activeId);
            }
          } else if (payload.type === "typing" && payload.user_id !== currentUserId) {
            setTypingUsers((prev) => {
              const next = new Map(prev);
              if (payload.is_typing) {
                next.set(payload.user_id, Date.now() + TYPING_EXPIRE_MS);
              } else {
                next.delete(payload.user_id);
              }
              return next;
            });
          } else if (payload.type === "error") {
            toast.error(payload.detail || "Community could not process that frame.");
          }
        } catch {
          // Ignore malformed frames from a transient socket issue.
        }
      };

      ws.onclose = (event) => {
        setConnection("closed");
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        if (!closedByThisEffect && event.code !== 4401 && event.code !== 4403 && event.code !== 4404) {
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      closedByThisEffect = true;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [
    accessToken,
    activeId,
    currentUserId,
    loadMembers,
    loadMessages,
    markRead,
    mergeMessage,
  ]);

  function sendTyping(isTyping: boolean) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "typing", is_typing: isTyping }));
    }
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    sendTyping(Boolean(value.trim()));
    if (typingFalseTimeoutRef.current) clearTimeout(typingFalseTimeoutRef.current);
    typingFalseTimeoutRef.current = setTimeout(() => sendTyping(false), 1500);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("Choose a file under 15MB.");
      e.target.value = "";
      return;
    }

    clearAttachment();
    setAttachedFile(file);
    if (file.type.startsWith("image/")) {
      setAttachedPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function uploadAttachment(file: File): Promise<AttachmentFields> {
    const res = await fetch(
      `/api/proxy/community/${activeId}/attachments/upload-url`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          content_type: file.type || "application/octet-stream",
        }),
      },
    );
      const json = (await res.json().catch(() => ({}))) as DataResponse<{
        upload_url?: string;
        storage_key?: string;
      }>;
    if (!res.ok) {
      throw new Error(json.message || "Failed to prepare attachment upload.");
    }

    const uploadUrl = json?.data?.upload_url;
    const storageKey = json?.data?.storage_key;
    if (!uploadUrl || !storageKey) {
      throw new Error("The upload response was incomplete.");
    }

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: file.type ? { "Content-Type": file.type } : undefined,
      body: file,
    });
    if (!uploadRes.ok) throw new Error("Attachment upload failed.");

    return {
      attachment_storage_key: storageKey,
      attachment_file_name: file.name,
      attachment_mime_type: file.type || "application/octet-stream",
      attachment_file_size_bytes: file.size,
    };
  }

  async function sendViaHttp(payload: Record<string, unknown>) {
    const res = await fetch(`/api/proxy/community/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as DataResponse<Message>;
    if (!res.ok) throw new Error(json.message || "Failed to send message.");
    if (json?.data) mergeMessage(json.data as Message);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || sending) return;

    const body = draft.trim();
    const fileToUpload = attachedFile;
    const shareToSend = resourceShare;
    const replyToSend = replyTo;
    if (!body && !fileToUpload && !shareToSend) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const isImageAttachment = Boolean(
      fileToUpload && fileToUpload.type.startsWith("image/"),
    );
    const optimisticBlobUrl = isImageAttachment
      ? URL.createObjectURL(fileToUpload as File)
      : null;
    if (optimisticBlobUrl) {
      pendingBlobUrlsRef.current.set(tempId, optimisticBlobUrl);
    }

    const fingerprint = messageFingerprint({
      body,
      reply_to_message_id: replyToSend?.id ?? null,
      attachment_file_name: fileToUpload?.name ?? null,
    });
    pendingSendsRef.current.set(fingerprint, tempId);

    const optimisticMessage: Message = {
      id: tempId,
      community_id: activeId,
      sender_id: currentUserId || "",
      sender: selfMember,
      body: body || undefined,
      created_at: new Date().toISOString(),
      reply_to: replyToSend
        ? {
            id: replyToSend.id,
            sender_id: replyToSend.sender_id,
            sender: replyToSend.sender,
            body: replyToSend.body,
            attachment_file_name: replyToSend.attachment_file_name,
          }
        : null,
      attachment_url: optimisticBlobUrl ?? undefined,
      attachment_file_name: fileToUpload?.name,
      attachment_mime_type: fileToUpload?.type,
      attachment_file_size_bytes: fileToUpload?.size,
      attachment_kind: fileToUpload
        ? isImageAttachment
          ? "IMAGE"
          : "DOCUMENT"
        : undefined,
      resource_reference: shareToSend
        ? { id: shareToSend.id, name: shareToSend.name, slug: shareToSend.slug }
        : null,
      status: "sending",
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    setSending(true);
    setDraft("");
    setReplyTo(null);
    setResourceShare(null);
    clearAttachment();
    sendTyping(false);

    function discardOptimisticMessage() {
      pendingSendsRef.current.delete(fingerprint);
      const blobUrl = pendingBlobUrlsRef.current.get(tempId);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        pendingBlobUrlsRef.current.delete(tempId);
      }
      setMessages((prev) => prev.filter((item) => item.id !== tempId));
    }

    try {
      const attachmentFields = fileToUpload
        ? await uploadAttachment(fileToUpload)
        : {};
      const messagePayload = {
        body,
        reply_to_message_id: replyToSend?.id ?? null,
        resource_reference_id: shareToSend?.id ?? null,
        ...attachmentFields,
      };

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "message", ...messagePayload }));
        setMessages((prev) =>
          prev.map((item) =>
            item.id === tempId ? { ...item, status: "sent" } : item,
          ),
        );
      } else {
        await sendViaHttp(messagePayload);
      }
    } catch (err: unknown) {
      discardOptimisticMessage();
      toast.error(getErrorMessage(err, "Failed to send message."));
      setDraft(body);
      setReplyTo(replyToSend);
      setResourceShare(shareToSend);
      if (fileToUpload) {
        setAttachedFile(fileToUpload);
        if (fileToUpload.type.startsWith("image/")) {
          setAttachedPreviewUrl(URL.createObjectURL(fileToUpload));
        }
      }
    } finally {
      setSending(false);
    }
  }

  if (communities.length === 0) {
    return (
      <div className="grid min-h-[460px] place-items-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-950">
        <div>
          <UsersRound className="mx-auto h-10 w-10 text-[#2D6A4F] dark:text-[#74c69d]" />
          <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">
            No communities yet
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Your General and Help rooms will appear here once your account has
            Community access.
          </p>
        </div>
      </div>
    );
  }

  const membersPanelProps = {
    rosterExpanded,
    setRosterExpanded,
    memberMode,
    setMemberMode,
    memberPage,
    setMemberPage,
    rosterTotalPages,
    onlineMembers,
    compactOnlineMembers,
    displayedMembers,
    loadingMembers,
    memberTotalItems,
    onlineIds,
    onMemberClick: setSelectedMember,
  };

  const messagesArea = (
    <div className="relative min-h-0 flex-1">
      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="swcl-sidebar-scroll h-full overflow-y-auto px-3 py-4 sm:px-5"
      >
      {hasOlder && (
        <button
          type="button"
          onClick={() => loadMessages(activeId, page + 1)}
          disabled={loadingOlder}
          className="mx-auto mb-4 flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-[#2D6A4F]/40 hover:text-[#2D6A4F] disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          {loadingOlder ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )}
          Older messages
        </button>
      )}

      {loadingMessages ? (
        <div className="grid h-full place-items-center text-sm font-medium text-slate-400">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading conversation
          </span>
        </div>
      ) : visibleMessages.length === 0 ? (
        <div className="grid h-full place-items-center text-center">
          <div>
            <Radio className="mx-auto h-10 w-10 text-[#2D6A4F] dark:text-[#74c69d]" />
            <h3 className="mt-4 text-base font-bold text-slate-950 dark:text-white">
              Start the conversation
            </h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Share a note, ask a question, or attach a useful document for
              the room.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleMessages.map((message) => {
            const own = message.sender_id === currentUserId;
            return (
              <MessageBubble
                key={message.id}
                message={message}
                own={own}
                onReply={() => setReplyTo(message)}
                onMemberClick={setSelectedMember}
              />
            );
          })}
        </div>
      )}

      {typingLine && (
        <div className="mt-3 px-2 text-xs font-semibold text-[#2D6A4F] dark:text-[#74c69d]">
          {typingLine}
        </div>
      )}
      <div ref={bottomRef} />
      </div>

      {!isAtBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          aria-label="Scroll to latest messages"
          className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#2D6A4F] shadow-lg ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95 dark:bg-slate-900 dark:text-[#74c69d] dark:ring-slate-700 sm:bottom-6 sm:right-6"
        >
          <ChevronDown className="h-5 w-5" />
          {newMessageCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2D6A4F] px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-white dark:bg-[#74c69d] dark:text-slate-950 dark:ring-slate-950">
              {newMessageCount > 99 ? "99+" : newMessageCount}
            </span>
          )}
        </button>
      )}
    </div>
  );

  const composerArea = (
    <form
      onSubmit={handleSend}
      className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
    >
      {(replyTo || attachedFile || resourceShare) && (
        <div className="mb-2 flex flex-col gap-2">
          {replyTo && (
            <ComposerChip
              icon={<MessageSquareReply className="h-4 w-4" />}
              title={`Replying to ${displayName(replyTo.sender)}`}
              detail={replyTo.body || replyTo.attachment_file_name || "Attachment"}
              onClear={() => setReplyTo(null)}
            />
          )}
          {resourceShare && (
            <ComposerChip
              icon={<BookOpen className="h-4 w-4" />}
              title="Sharing resource"
              detail={resourceShare.name}
              onClear={() => setResourceShare(null)}
            />
          )}
          {attachedFile && (
            <ComposerChip
              icon={
                attachedPreviewUrl ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )
              }
              title={attachedFile.name}
              detail={formatBytes(attachedFile.size)}
              imageUrl={attachedPreviewUrl}
              onClear={clearAttachment}
            />
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || Boolean(attachedFile)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-500 transition hover:border-[#2D6A4F] hover:text-[#2D6A4F] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:border-slate-700 dark:text-slate-400 dark:hover:border-[#74c69d] dark:hover:text-[#74c69d]"
          aria-label="Attach file"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <textarea
          value={draft}
          onChange={(event) => handleDraftChange(event.target.value)}
          onBlur={() => sendTyping(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend(event as unknown as React.FormEvent);
            }
          }}
          rows={1}
          placeholder="Message this community"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#2D6A4F] focus:bg-white focus:ring-2 focus:ring-[#2D6A4F]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
        />
        <button
          type="submit"
          disabled={sending || (!draft.trim() && !attachedFile && !resourceShare)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-[#2D6A4F] text-white shadow-sm transition hover:bg-[#1B4332] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 dark:bg-[#74c69d] dark:text-slate-950 dark:hover:bg-[#95d5b2]"
          aria-label="Send message"
          title="Send message"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </form>
  );

  return (
    <>
      {/* Mobile: WhatsApp-style room list -> full-screen chat -> members sheet */}
      <div className="xl:hidden">
        <div
          className={cx(
            "flex min-h-[70vh] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950",
            mobileScreen === "chat" && "hidden",
          )}
        >
          <div className="border-b border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/45">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search rooms"
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            {totalUnread > 0 && (
              <p className="mt-2 px-1 text-xs font-semibold text-[#2D6A4F] dark:text-[#74c69d]">
                {unreadBadgeLabel(totalUnread)} unread{" "}
                {totalUnread === 1 ? "message" : "messages"} across your rooms
              </p>
            )}
          </div>
          <div className="swcl-sidebar-scroll flex-1 overflow-y-auto">
            {filteredCommunities.map((community) => (
              <MobileRoomRow
                key={community.id}
                community={community}
                active={community.id === activeId}
                onClick={() => {
                  setActiveId(community.id);
                  setMobileScreen("chat");
                }}
              />
            ))}
          </div>
        </div>

        {mobileScreen === "chat" && (
          <div className="fixed inset-0 z-40 flex flex-col bg-[#f8faf9] dark:bg-slate-950">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 dark:border-slate-800 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setMobileScreen("list")}
                aria-label="Back to communities"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setMobileMembersOpen(true)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-base font-bold text-slate-950 dark:text-white">
                      {activeCommunity?.name}
                    </span>
                  </span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                    {onlineMembers.length} online
                  </span>
                </span>
              </button>
              <ConnectionIndicator state={connection} />
            </header>

            {messagesArea}
            {composerArea}
          </div>
        )}

        {mobileScreen === "chat" && mobileMembersOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 dark:border-slate-800 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setMobileMembersOpen(false)}
                aria-label="Back to chat"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="truncate text-base font-bold text-slate-950 dark:text-white">
                {activeCommunity?.name}
              </h2>
            </header>
            <div className="swcl-sidebar-scroll flex-1 overflow-y-auto p-4">
              <MembersPanel {...membersPanelProps} />
            </div>
          </div>
        )}
      </div>

      {/* Desktop: three-column layout, pinned to the viewport so only the
          panels scroll internally instead of the whole page */}
      <div className="hidden grid-cols-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 xl:grid xl:h-[calc(100vh-280px)] xl:min-h-[520px] xl:grid-cols-[290px_minmax(0,1fr)_270px]">
        <aside className="flex flex-col border-b border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/45 xl:min-h-0 xl:border-b-0 xl:border-r">
          <div className="relative shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search rooms"
              className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
          {totalUnread > 0 && (
            <p className="mt-2 px-1 text-xs font-semibold text-[#2D6A4F] dark:text-[#74c69d]">
              {unreadBadgeLabel(totalUnread)} unread{" "}
              {totalUnread === 1 ? "message" : "messages"} across your rooms
            </p>
          )}

          <div className="swcl-sidebar-scroll mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
            {filteredCommunities.map((community) => (
              <RoomButton
                key={community.id}
                community={community}
                active={community.id === activeId}
                onClick={() => setActiveId(community.id)}
              />
            ))}
          </div>
        </aside>

        <main className="flex min-w-0 flex-col bg-[#f8faf9] dark:bg-slate-950 xl:min-h-0">
          <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-bold text-slate-950 dark:text-white">
                  {activeCommunity?.name}
                </h2>
                {activeCommunity?.type && (
                  <span className="rounded-md bg-amber-100 px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.05em] text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">
                    {communityTypeLabel(activeCommunity.type)}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {onlineMembers.length} online
                {members.length > 0 ? ` of ${members.length} visible members` : ""}
              </p>
            </div>
            <ConnectionIndicator state={connection} />
          </header>

          {messagesArea}
          {composerArea}
        </main>

        <aside className="swcl-sidebar-scroll hidden overflow-y-auto border-l border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 xl:block xl:min-h-0">
          <MembersPanel {...membersPanelProps} />
        </aside>
      </div>

      <UserProfileModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </>
  );
}

function MembersPanel({
  rosterExpanded,
  setRosterExpanded,
  memberMode,
  setMemberMode,
  memberPage,
  setMemberPage,
  rosterTotalPages,
  onlineMembers,
  compactOnlineMembers,
  displayedMembers,
  loadingMembers,
  memberTotalItems,
  onlineIds,
  onMemberClick,
}: {
  rosterExpanded: boolean;
  setRosterExpanded: (value: boolean) => void;
  memberMode: MemberMode;
  setMemberMode: (value: MemberMode) => void;
  memberPage: number;
  setMemberPage: (value: number | ((current: number) => number)) => void;
  rosterTotalPages: number;
  onlineMembers: Member[];
  compactOnlineMembers: Member[];
  displayedMembers: Member[];
  loadingMembers: boolean;
  memberTotalItems: number;
  onlineIds: Set<string>;
  onMemberClick: (member: Member) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-950 dark:text-white">
            Members
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {rosterExpanded
              ? memberMode === "online"
                ? "Online members"
                : "Full room roster"
              : "Online now"}
          </p>
        </div>
        <span className="rounded-md bg-[#d8f3dc] px-2 py-1 text-xs font-bold text-[#1B4332] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
          {onlineMembers.length} online
        </span>
      </div>

      {rosterExpanded && (
        <div className="mt-4 grid grid-cols-2 rounded-md bg-slate-100 p-1 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => {
              setMemberMode("online");
              setMemberPage(1);
            }}
            className={cx(
              "h-8 rounded px-3 text-xs font-bold transition",
              memberMode === "online"
                ? "bg-white text-[#2D6A4F] shadow-sm dark:bg-slate-950 dark:text-[#74c69d]"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
            )}
          >
            Online
          </button>
          <button
            type="button"
            onClick={() => {
              setMemberMode("all");
              setMemberPage(1);
            }}
            className={cx(
              "h-8 rounded px-3 text-xs font-bold transition",
              memberMode === "all"
                ? "bg-white text-[#2D6A4F] shadow-sm dark:bg-slate-950 dark:text-[#74c69d]"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
            )}
          >
            All
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {loadingMembers && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Updating members
          </div>
        )}

        {(rosterExpanded ? displayedMembers : compactOnlineMembers).map(
          (member, index) => (
            <MemberRow
              key={
                memberId(member)
                  ? `${memberId(member)}-${index}`
                  : `member-${index}`
              }
              member={member}
              online={
                (memberId(member)
                  ? onlineIds.has(memberId(member) as string)
                  : false) ||
                Boolean(member.is_online)
              }
              onClick={() => onMemberClick(member)}
            />
          ),
        )}

        {!loadingMembers &&
          !rosterExpanded &&
          compactOnlineMembers.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Nobody is online right now.
            </p>
          )}

        {!loadingMembers && rosterExpanded && displayedMembers.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {memberMode === "online"
              ? "Nobody is online right now."
              : "No members found for this room."}
          </p>
        )}
      </div>

      {!rosterExpanded ? (
        <button
          type="button"
          onClick={() => {
            setRosterExpanded(true);
            setMemberMode("online");
            setMemberPage(1);
          }}
          className="mt-4 flex h-10 w-full items-center justify-center rounded-md border border-slate-200 text-xs font-bold text-slate-600 transition hover:border-[#2D6A4F]/50 hover:text-[#2D6A4F] dark:border-slate-700 dark:text-slate-300 dark:hover:border-[#74c69d] dark:hover:text-[#74c69d]"
        >
          View all online
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMemberPage((current) => Math.max(1, current - 1))}
              disabled={memberPage <= 1}
              className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-slate-500 transition hover:border-[#2D6A4F]/50 hover:text-[#2D6A4F] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:border-[#74c69d] dark:hover:text-[#74c69d]"
              aria-label="Previous members page"
              title="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Page {memberPage} of {rosterTotalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setMemberPage((current) =>
                  Math.min(rosterTotalPages, current + 1),
                )
              }
              disabled={memberPage >= rosterTotalPages}
              className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 text-slate-500 transition hover:border-[#2D6A4F]/50 hover:text-[#2D6A4F] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:border-[#74c69d] dark:hover:text-[#74c69d]"
              aria-label="Next members page"
              title="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setRosterExpanded(false);
              setMemberMode("online");
              setMemberPage(1);
            }}
            className="flex h-9 w-full items-center justify-center rounded-md text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
          >
            Show online preview
          </button>
          {memberMode === "all" && memberTotalItems > 0 && (
            <p className="text-center text-[0.7rem] font-medium text-slate-400">
              {memberTotalItems} total members
            </p>
          )}
        </div>
      )}
    </>
  );
}

function MobileRoomRow({
  community,
  active,
  onClick,
}: {
  community: Community;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition dark:border-slate-800",
        active
          ? "bg-[#d8f3dc]/40 dark:bg-[#52b788]/10"
          : "hover:bg-slate-50 dark:hover:bg-slate-900",
      )}
    >
      <span
        className={cx(
          "grid h-12 w-12 shrink-0 place-items-center rounded-full",
          active
            ? "bg-[#2D6A4F] text-white dark:bg-[#74c69d] dark:text-slate-950"
            : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        )}
      >
        <CommunityTypeIcon type={community.type} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-slate-950 dark:text-white">
          {community.name}
        </span>
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
          {communityTypeLabel(community.type)}
          {typeof community.member_count === "number"
            ? ` • ${community.member_count} members`
            : ""}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
    </button>
  );
}

function RoomButton({
  community,
  active,
  onClick,
}: {
  community: Community;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex min-w-[220px] items-center gap-3 rounded-lg border px-3 py-3 text-left transition xl:min-w-0 xl:w-full",
        active
          ? "border-[#2D6A4F] bg-white shadow-sm dark:border-[#74c69d] dark:bg-slate-950"
          : "border-transparent hover:border-slate-200 hover:bg-white dark:hover:border-slate-700 dark:hover:bg-slate-950",
      )}
    >
      <span
        className={cx(
          "grid h-9 w-9 shrink-0 place-items-center rounded-md",
          active
            ? "bg-[#2D6A4F] text-white dark:bg-[#74c69d] dark:text-slate-950"
            : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        )}
      >
        <CommunityTypeIcon type={community.type} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-slate-950 dark:text-white">
          {community.name}
        </span>
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
          {communityTypeLabel(community.type)}
        </span>
      </span>
      {active ? (
        <Check className="h-4 w-4 shrink-0 text-[#2D6A4F] dark:text-[#74c69d]" />
      ) : null}
    </button>
  );
}

function MessageBubble({
  message,
  own,
  onReply,
  onMemberClick,
}: {
  message: Message;
  own: boolean;
  onReply: () => void;
  onMemberClick: (member: Member) => void;
}) {
  const name = displayName(message.sender);
  const staffLabel = staffRoleLabel(message.sender);

  return (
    <div className={cx("group flex", own ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "flex max-w-[88%] flex-col gap-1 sm:max-w-[72%]",
          own ? "items-end" : "items-start",
        )}
      >
        {!own && (
          <button
            type="button"
            onClick={() => message.sender && onMemberClick(message.sender)}
            className="flex items-center gap-1.5 rounded px-1 text-left text-xs font-bold text-slate-500 transition hover:text-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:text-slate-400 dark:hover:text-[#74c69d]"
          >
            {name}
            {staffLabel && <StaffBadge label={staffLabel} />}
          </button>
        )}
        <div className="flex items-end gap-2">
          {!own && (
            <button
              type="button"
              onClick={() => message.sender && onMemberClick(message.sender)}
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
              aria-label={`View ${name}'s profile`}
              title={`View ${name}'s profile`}
            >
              <Avatar member={message.sender} size="sm" />
            </button>
          )}
          <div
            className={cx(
              "rounded-lg px-3 py-2 text-sm leading-relaxed shadow-sm",
              own
                ? "bg-[#2D6A4F] text-white dark:bg-[#74c69d] dark:text-slate-950"
                : "border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
            )}
          >
            {message.reply_to && (
              <div
                className={cx(
                  "mb-2 rounded-md border-l-2 px-2 py-1 text-xs",
                  own
                    ? "border-white/70 bg-white/10 text-white/85 dark:text-slate-900"
                    : "border-[#2D6A4F] bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300",
                )}
              >
                <span className="block font-bold">
                  {displayName(message.reply_to.sender ?? undefined)}
                </span>
                <span className="block truncate">
                  {message.reply_to.body ||
                    message.reply_to.attachment_file_name ||
                    "Previous message"}
                </span>
              </div>
            )}
            {message.body && (
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
            )}
            {message.attachment_url && (
              <MessageAttachment message={message} own={own} />
            )}
            {message.resource_reference && (
              <ResourceCard resource={message.resource_reference} own={own} />
            )}
          </div>
          {own && (
            <button
              type="button"
              onClick={onReply}
              className="hidden h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-[#2D6A4F] group-hover:grid group-focus-within:grid focus:grid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:hover:bg-slate-800 dark:hover:text-[#74c69d]"
              aria-label="Reply to message"
              title="Reply"
            >
              <MessageSquareReply className="h-4 w-4" />
            </button>
          )}
          {!own && (
            <button
              type="button"
              onClick={onReply}
              className="hidden h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-[#2D6A4F] group-hover:grid group-focus-within:grid focus:grid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:hover:bg-slate-800 dark:hover:text-[#74c69d]"
              aria-label="Reply to message"
              title="Reply"
            >
              <MessageSquareReply className="h-4 w-4" />
            </button>
          )}
        </div>
        <span className="flex items-center gap-1 px-1 text-[0.68rem] font-medium text-slate-400">
          {formatMessageTime(message.created_at)}
          {own &&
            (message.status === "sending" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            ))}
        </span>
      </div>
    </div>
  );
}

function MessageAttachment({
  message,
  own,
}: {
  message: Message;
  own: boolean;
}) {
  if (message.attachment_kind === "IMAGE") {
    return (
      <a
        href={message.attachment_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block overflow-hidden rounded-md"
      >
        <img
          src={message.attachment_url}
          alt={message.attachment_file_name || "Attachment"}
          className="max-h-64 max-w-full object-cover transition hover:opacity-90"
        />
      </a>
    );
  }

  return (
    <a
      href={message.attachment_url}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        "mt-2 flex min-w-[220px] items-center gap-3 rounded-md border px-3 py-2 transition",
        own
          ? "border-white/20 bg-white/10 hover:bg-white/15"
          : "border-slate-200 bg-slate-50 hover:border-[#2D6A4F]/40 dark:border-slate-700 dark:bg-slate-950",
      )}
    >
      <FileText className="h-5 w-5 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold">
          {message.attachment_file_name || "Attachment"}
        </span>
        {typeof message.attachment_file_size_bytes === "number" && (
          <span className="block text-[0.68rem] opacity-75">
            {formatBytes(message.attachment_file_size_bytes)}
          </span>
        )}
      </span>
    </a>
  );
}

function ResourceCard({
  resource,
  own,
}: {
  resource: ResourceReference;
  own: boolean;
}) {
  const content = (
    <span
      className={cx(
        "mt-2 flex min-w-[240px] items-center gap-3 rounded-md border p-2 transition",
        own
          ? "border-white/20 bg-white/10 hover:bg-white/15"
          : "border-slate-200 bg-slate-50 hover:border-[#2D6A4F]/40 dark:border-slate-700 dark:bg-slate-950",
      )}
    >
      {resource.thumbnail_url ? (
        <img
          src={resource.thumbnail_url}
          alt=""
          className="h-12 w-12 rounded-md object-cover"
        />
      ) : (
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-200">
          <BookOpen className="h-5 w-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold">{resource.name}</span>
        <span className="block truncate text-[0.68rem] opacity-75">
          {resource.category || "Resource"}
        </span>
      </span>
    </span>
  );

  return content;
}

function ComposerChip({
  icon,
  title,
  detail,
  imageUrl,
  onClear,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  imageUrl?: string | null;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-9 w-9 rounded-md object-cover" />
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-[#2D6A4F] dark:bg-slate-950 dark:text-[#74c69d]">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-slate-900 dark:text-white">
          {title}
        </span>
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
          {detail}
        </span>
      </span>
      <button
        type="button"
        onClick={onClear}
        className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-white hover:text-red-500 dark:hover:bg-slate-950"
        aria-label="Remove"
        title="Remove"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function MemberRow({
  member,
  online,
  onClick,
}: {
  member: Member;
  online: boolean;
  onClick: () => void;
}) {
  const firstName = memberFirstName(member);
  const username = memberUsername(member);
  const staffLabel = staffRoleLabel(member);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:hover:bg-slate-900"
    >
      <div className="relative">
        <Avatar member={member} />
        <span
          className={cx(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950",
            online ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700",
          )}
        />
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 truncate text-sm font-bold text-slate-900 dark:text-white">
          {firstName}
          {staffLabel && <StaffBadge label={staffLabel} />}
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {[username, online ? "Online now" : "Offline"]
            .filter(Boolean)
            .join(" • ")}
        </p>
      </div>
    </button>
  );
}

function UserProfileModal({
  member,
  onClose,
}: {
  member: Member | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!member) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [member, onClose]);

  if (!member) return null;

  const name = displayName(member);
  const username = memberUsername(member);
  const role = memberRoleLabel(member);
  const profile = memberProfile(member);
  const image = profile.profile_picture_url || profile.image;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/55 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close profile"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-user-profile-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:rounded-3xl"
      >
        <div className="h-24 bg-[#2D6A4F] dark:bg-[#1B4332]" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white dark:bg-slate-950/85 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
          aria-label="Close profile"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="-mt-12 px-5 pb-6 text-center sm:px-8 sm:pb-8">
          <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-lg dark:border-slate-950 dark:bg-slate-900">
            {image ? (
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-[#2D6A4F] dark:text-[#74c69d]">
                {initials(name).toUpperCase()}
              </span>
            )}
          </div>
          <div className="mt-4 min-w-0">
            <h2
              id="community-user-profile-title"
              className="break-words text-2xl font-black text-slate-950 dark:text-white"
            >
              {name}
            </h2>
            {username && (
              <p className="mt-1 break-words text-sm font-semibold text-slate-500 dark:text-slate-400">
                {username}
              </p>
            )}
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-[0.68rem] font-extrabold uppercase tracking-wide text-slate-400">
              Role
            </p>
            <div className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="h-4 w-4 text-[#2D6A4F] dark:text-[#74c69d]" />
              <span>{role}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StaffBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-wide text-blue-700 dark:bg-blue-400/15 dark:text-blue-300"
      title={label}
    >
      <ShieldCheck className="h-3 w-3" />
      {label}
    </span>
  );
}

function Avatar({
  member,
  size = "md",
}: {
  member?: Member;
  size?: "sm" | "md";
}) {
  const name = displayName(member);
  const profile = memberProfile(member);
  const image = profile.profile_picture_url || profile.image;
  const sizeClass = size === "sm" ? "h-7 w-7 text-[0.65rem]" : "h-9 w-9 text-xs";

  if (image) {
    return (
      <img
        src={image}
        alt=""
        className={cx("shrink-0 rounded-md object-cover", sizeClass)}
      />
    );
  }

  return (
    <span
      className={cx(
        "grid shrink-0 place-items-center rounded-md bg-slate-200 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200",
        sizeClass,
      )}
    >
      {initials(name).toUpperCase()}
    </span>
  );
}

function ConnectionIndicator({ state }: { state: ConnectionState }) {
  if (state === "open") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
        <Wifi className="h-3.5 w-3.5" />
        Live
      </span>
    );
  }

  if (state === "connecting") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Connecting
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
      <WifiOff className="h-3.5 w-3.5" />
      Offline
    </span>
  );
}
