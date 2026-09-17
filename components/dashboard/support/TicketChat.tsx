"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Send,
  Wifi,
  WifiOff,
  Loader2,
  Paperclip,
  X,
  FileText,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { IconSpinner } from "@/components/auth/shared/icons";
import { getTicketStatusBadge, isTicketTerminal } from "./statusBadge";
import { RatingWidget } from "./RatingWidget";
import { getWsBaseUrl } from "@/lib/wsUrl";
import { formatBytes } from "@/lib/formatBytes";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  created_at: string;
};

type Message = {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: "USER" | "ADMIN";
  body: string;
  created_at: string;
  sender?: { id: string; username?: string; image?: string };
  attachment_url?: string;
  attachment_file_name?: string;
  attachment_mime_type?: string;
  attachment_file_size_bytes?: number;
  attachment_kind?: "IMAGE" | "DOCUMENT";
};

type AttachmentFields = {
  attachment_storage_key: string;
  attachment_file_name: string;
  attachment_mime_type: string;
  attachment_file_size_bytes: number;
};

type ConnectionState = "connecting" | "open" | "closed";

const PING_INTERVAL_MS = 25000;
const RECONNECT_DELAY_MS = 3000;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10MB client-side cap

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function sortMessages(list: Message[]) {
  return [...list].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

export default function TicketChat({
  ticketId,
  initialTicket,
  initialMessages,
}: {
  ticketId: string;
  initialTicket: Ticket;
  initialMessages: Message[];
}) {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken as string | undefined;

  const [ticket, setTicket] = useState(initialTicket);
  const [messages, setMessages] = useState<Message[]>(sortMessages(initialMessages));
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreviewUrl, setAttachedPreviewUrl] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const closedByUserRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const terminal = isTicketTerminal(ticket.status);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return sortMessages([...prev, message]);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!accessToken || terminal) {
      setConnection("closed");
      return;
    }

    closedByUserRef.current = false;

    function connect() {
      setConnection("connecting");
      const base = getWsBaseUrl();
      const ws = new WebSocket(
        `${base}/support/tickets/${ticketId}/ws?token=${encodeURIComponent(accessToken!)}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        setConnection("open");
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
            addMessage(payload.data as Message);
          } else if (payload.type === "status_changed" && payload.status) {
            setTicket((prev) => ({ ...prev, status: payload.status }));
          } else if (payload.type === "error") {
            toast.error(payload.detail || "Your message could not be sent.");
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        setConnection("closed");
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        if (!closedByUserRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      closedByUserRef.current = true;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [accessToken, ticketId, terminal, addMessage]);

  const clearAttachment = useCallback(() => {
    setAttachedFile(null);
    setAttachedPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("That file is too large — please attach something under 10MB.");
      e.target.value = "";
      return;
    }

    clearAttachment();
    setAttachedFile(file);
    if (file.type.startsWith("image/")) {
      setAttachedPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadAttachment = async (file: File): Promise<AttachmentFields> => {
    const uploadUrlRes = await fetch(
      `/api/proxy/support/tickets/${ticketId}/attachments/upload-url`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          content_type: file.type || "application/octet-stream",
        }),
      },
    );
    const uploadUrlData = await uploadUrlRes.json().catch(() => ({}));
    if (!uploadUrlRes.ok) {
      throw new Error(uploadUrlData.message || "Failed to prepare the attachment upload.");
    }

    const uploadUrl = uploadUrlData.data?.upload_url;
    const storageKey = uploadUrlData.data?.storage_key;
    if (!uploadUrl || !storageKey) {
      throw new Error("The upload URL response was incomplete.");
    }

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: file.type ? { "Content-Type": file.type } : undefined,
      body: file,
    });
    if (!uploadRes.ok) {
      throw new Error("Failed to upload the attachment.");
    }

    return {
      attachment_storage_key: storageKey,
      attachment_file_name: file.name,
      attachment_mime_type: file.type || "application/octet-stream",
      attachment_file_size_bytes: file.size,
    };
  };

  const sendViaHttp = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/proxy/support/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Failed to send message.");
    }
    if (data?.data) addMessage(data.data as Message);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if ((!body && !attachedFile) || terminal || sending || uploading) return;

    const fileToUpload = attachedFile;
    setSending(true);
    setDraft("");
    clearAttachment();

    try {
      let attachmentFields: AttachmentFields | Record<string, never> = {};
      if (fileToUpload) {
        setUploading(true);
        attachmentFields = await uploadAttachment(fileToUpload);
        setUploading(false);
      }

      const payload = { type: "message", body, ...attachmentFields };
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(payload));
      } else {
        const { type, ...httpPayload } = payload;
        await sendViaHttp(httpPayload);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send message.");
      setDraft(body);
      if (fileToUpload) {
        setAttachedFile(fileToUpload);
        if (fileToUpload.type.startsWith("image/")) {
          setAttachedPreviewUrl(URL.createObjectURL(fileToUpload));
        }
      }
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden h-[calc(100vh-13rem)] min-h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="min-w-0">
          <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
            {ticket.subject}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Ticket #{ticket.id.slice(0, 8)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!terminal && <ConnectionIndicator state={connection} />}
          {getTicketStatusBadge(ticket.status)}
        </div>
      </div>

      {/* Messages */}
      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 bg-gray-50/50 dark:bg-gray-950/30"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            No messages yet — say hello!
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_type === "USER";
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex flex-col max-w-[80%] sm:max-w-[65%] ${isOwn ? "items-end" : "items-start"}`}>
                  {!isOwn && (
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 px-1">
                      Support Desk
                    </span>
                  )}
                  <div
                    className={`flex flex-col gap-2 px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isOwn
                        ? "bg-[#2D6A4F] text-white rounded-br-md"
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-md"
                    }`}
                  >
                    {message.body && <span>{message.body}</span>}
                    {message.attachment_url && (
                      <MessageAttachment message={message} isOwn={isOwn} />
                    )}
                  </div>
                  <span className="text-[0.65rem] text-gray-400 dark:text-gray-500 mt-1 px-1">
                    {formatTime(message.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer / terminal state */}
      {terminal ? (
        <div className="border-t border-gray-100 dark:border-gray-800 p-5">
          <RatingWidget ticketId={ticketId} ticketStatus={ticket.status} />
        </div>
      ) : (
        <form
          onSubmit={handleSend}
          className="flex flex-col gap-2 border-t border-gray-100 dark:border-gray-800 p-4"
        >
          {attachedFile && (
            <div className="flex items-center gap-3 self-start bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
              {attachedPreviewUrl ? (
                <img
                  src={attachedPreviewUrl}
                  alt={attachedFile.name}
                  className="w-9 h-9 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center shrink-0 text-gray-500 dark:text-gray-400">
                  <FileText className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[12rem]">
                  {attachedFile.name}
                </p>
                <p className="text-[0.65rem] text-gray-500 dark:text-gray-400">
                  {formatBytes(attachedFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={clearAttachment}
                disabled={sending || uploading}
                className="ml-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                aria-label="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-3">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploading || !!attachedFile}
              className="inline-flex items-center justify-center h-11 w-11 shrink-0 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] hover:border-[#2D6A4F] dark:hover:text-[#52b788] dark:hover:border-[#52b788] transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
              aria-label="Attach a file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e as unknown as React.FormEvent);
                }
              }}
              rows={1}
              placeholder={uploading ? "Uploading attachment..." : "Type your message..."}
              disabled={uploading}
              className="flex-1 resize-none max-h-32 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || uploading || (!draft.trim() && !attachedFile)}
              className="inline-flex items-center justify-center h-11 w-11 shrink-0 rounded-xl bg-[#2D6A4F] text-white hover:bg-[#1B4332] transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2"
              aria-label="Send message"
            >
              {sending || uploading ? (
                <IconSpinner className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function MessageAttachment({ message, isOwn }: { message: Message; isOwn: boolean }) {
  if (message.attachment_kind === "IMAGE") {
    return (
      <a
        href={message.attachment_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-xl"
      >
        <img
          src={message.attachment_url}
          alt={message.attachment_file_name || "Attachment"}
          className="max-w-full max-h-64 object-cover hover:opacity-90 transition-opacity"
        />
      </a>
    );
  }

  return (
    <a
      href={message.attachment_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        isOwn
          ? "bg-white/10 hover:bg-white/20"
          : "bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 hover:border-[#2D6A4F]/40"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          isOwn ? "bg-white/15 text-white" : "bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-[#52b788]"
        }`}
      >
        <FileText className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold truncate max-w-[10rem]">
          {message.attachment_file_name || "Attachment"}
        </p>
        {typeof message.attachment_file_size_bytes === "number" && (
          <p className={`text-[0.65rem] ${isOwn ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>
            {formatBytes(message.attachment_file_size_bytes)}
          </p>
        )}
      </div>
      <Download className={`w-3.5 h-3.5 ml-auto shrink-0 ${isOwn ? "text-white/80" : "text-gray-400"}`} />
    </a>
  );
}

function ConnectionIndicator({ state }: { state: ConnectionState }) {
  if (state === "open") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
        <Wifi className="w-3.5 h-3.5" />
        Live
      </span>
    );
  }
  if (state === "connecting") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Connecting
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500">
      <WifiOff className="w-3.5 h-3.5" />
      Offline
    </span>
  );
}
