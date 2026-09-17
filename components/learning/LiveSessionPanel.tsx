"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Headphones,
  RefreshCw,
  UserRound,
  Video,
} from "lucide-react";
import { IconSpinner } from "@/components/auth/shared/icons";
import { MarkCompleteButton } from "./MarkCompleteButton";
import { VideoPlayer } from "./VideoPlayer";

export type LiveSessionItem = {
  id: string;
  title?: string | null;
  is_completed?: boolean | null;
  live_session_scheduled_start_at?: string | null;
  live_session_duration_minutes?: number | null;
  live_session_guest_name?: string | null;
  live_session_guest_title?: string | null;
  live_session_status?: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED" | string | null;
  live_session_can_join?: boolean | null;
  live_session_recording_status?: "PENDING" | "PROCESSING" | "READY" | "FAILED" | string | null;
  live_session_recording_url?: string | null;
};

type LiveSessionPanelProps = {
  courseId: string;
  item: LiveSessionItem;
};

export function LiveSessionPanel({ courseId, item }: LiveSessionPanelProps) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const scheduledAt = formatDateTime(item.live_session_scheduled_start_at);
  const scheduledDate = formatDatePart(item.live_session_scheduled_start_at);
  const scheduledTime = formatTimePart(item.live_session_scheduled_start_at);
  const duration = item.live_session_duration_minutes;
  const isEnded = item.live_session_status === "ENDED";
  const isCancelled = item.live_session_status === "CANCELLED";
  const countdown = formatCountdown(item.live_session_scheduled_start_at, now);
  const recordingReady =
    isEnded &&
    item.live_session_recording_status === "READY" &&
    Boolean(item.live_session_recording_url);

  useEffect(() => {
    if (isEnded || isCancelled || item.live_session_can_join) return;

    const timer = window.setInterval(() => {
      setNow(Date.now());
      router.refresh();
    }, 60000);

    return () => window.clearInterval(timer);
  }, [isCancelled, isEnded, item.live_session_can_join, router]);

  if (recordingReady && item.live_session_recording_url) {
    return (
      <div className="overflow-hidden rounded-lg border border-[#dceee4] bg-white shadow-sm dark:border-[#27433a] dark:bg-[#111525]">
        <VideoPlayer
          url={item.live_session_recording_url}
          courseId={courseId}
          itemId={item.id}
          isCompleted={item.is_completed === true}
        />
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#dceee4] bg-white shadow-sm dark:border-[#27433a] dark:bg-[#111525]">
      <div className="bg-slate-950 px-4 py-5 text-white sm:px-5 lg:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge item={item} />
              {item.is_completed && (
                <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#52b788] px-2.5 text-xs font-extrabold text-[#06130d]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Complete
                </span>
              )}
            </div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#b7e4c7]">
              Live classroom
            </p>
            <h2 className="mt-2 max-w-3xl text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              {item.title || "Live session"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              {getHeroDescription(item)}
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/8 p-4 lg:w-[260px]">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-300">
              {item.live_session_can_join ? "Join window" : "Session starts"}
            </p>
            <p className="text-2xl font-extrabold text-white">
              {item.live_session_can_join ? "Open now" : countdown || "Pending"}
            </p>
            {scheduledAt && (
              <p className="text-sm font-semibold text-slate-300">
                {scheduledAt}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <InfoTile
            icon={<CalendarDays className="h-5 w-5" />}
            label="Date"
            value={scheduledDate || "To be announced"}
          />
          <InfoTile
            icon={<Clock3 className="h-5 w-5" />}
            label="Time and duration"
            value={[scheduledTime, duration ? `${duration} min` : null].filter(Boolean).join(" - ") || "Planned session"}
          />
          <InfoTile
            icon={<UserRound className="h-5 w-5" />}
            label="Presenter"
            value={formatGuest(item) || "Course instructor"}
          />
        </div>

        <div className="rounded-lg border border-[#dceee4] bg-[#f7fcf9] p-4 dark:border-[#27433a] dark:bg-[#13231d] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-950 dark:text-white">
                {getStatusHeadline(item)}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {getStatusDescription(item)}
              </p>
            </div>
            {item.live_session_can_join ? (
              <button
                type="button"
                onClick={async () => {
                  setJoining(true);
                  setJoinError(null);
                  const meetingWindow = window.open("", "_blank");

                  if (meetingWindow) {
                    meetingWindow.document.title = "Opening live session";
                    meetingWindow.document.body.innerHTML =
                      '<div style="font-family: system-ui, sans-serif; min-height: 100vh; display: grid; place-items: center; color: #0f172a;"><div><strong>Opening live session...</strong><p style="color: #475569;">Please wait while we create your secure Daily link.</p></div></div>';
                  }

                  try {
                    const res = await fetch(`/api/proxy/courses/items/${item.id}/live-session/join`, {
                      method: "POST",
                    });
                    const json = await res.json().catch(() => ({}));

                    if (!res.ok) {
                      meetingWindow?.close();
                      setJoinError(json?.message || "This live session is not available right now.");
                      return;
                    }

                    if (json?.data?.join_url) {
                      if (meetingWindow) {
                        meetingWindow.opener = null;
                        meetingWindow.location.assign(json.data.join_url);
                      } else {
                        setJoinError("Your browser blocked the new tab. Please allow pop-ups and try again.");
                      }
                      return;
                    }

                    meetingWindow?.close();
                    setJoinError("The live session join link was not returned.");
                  } catch {
                    meetingWindow?.close();
                    setJoinError("We could not reach the live session service.");
                  } finally {
                    setJoining(false);
                  }
                }}
                disabled={joining}
                className="inline-flex h-12 flex-shrink-0 items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-5 text-sm font-extrabold text-white shadow-sm shadow-[#2D6A4F]/20 transition hover:bg-[#1B4332] disabled:cursor-wait disabled:opacity-80 dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
              >
                {joining ? (
                  <IconSpinner className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {joining ? "Opening Daily..." : "Join in new tab"}
              </button>
            ) : !isEnded && !isCancelled ? (
              <button
                type="button"
                disabled
                className="inline-flex h-12 flex-shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-md bg-slate-100 px-5 text-sm font-extrabold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              >
                <Clock3 className="h-4 w-4" />
                {countdown || "Not open yet"}
              </button>
            ) : null}
          </div>
          {joinError && (
            <p className="mt-3 flex items-start gap-2 text-sm font-semibold text-red-700 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{joinError}</span>
            </p>
          )}
        </div>

        {!isEnded && !isCancelled && (
          <div className="grid gap-3 md:grid-cols-3">
            <PreparationItem
              icon={<Video className="h-4 w-4" />}
              title="Daily opens separately"
              text="Your secure link opens Daily in a new browser tab."
            />
            <PreparationItem
              icon={<Headphones className="h-4 w-4" />}
              title="Check your setup"
              text="Use a working microphone, camera, and a stable connection."
            />
            <PreparationItem
              icon={<RefreshCw className="h-4 w-4" />}
              title="Page refreshes itself"
              text="Keep this page open and the join state will update."
            />
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-[#dceee4] pt-4 dark:border-[#27433a] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {getCompletionHint(item)}
          </p>
          <MarkCompleteButton
            courseId={courseId}
            itemId={item.id}
            isCompleted={item.is_completed === true}
            className="h-10"
          />
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ item }: { item: LiveSessionItem }) {
  const label = item.live_session_can_join
    ? "Open now"
    : item.live_session_status === "ENDED"
      ? "Ended"
      : item.live_session_status === "CANCELLED"
        ? "Cancelled"
        : "Scheduled";

  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-white/10 px-2.5 text-xs font-extrabold uppercase tracking-wide text-white">
      {item.live_session_can_join ? (
        <Video className="h-3.5 w-3.5 text-[#52b788]" />
      ) : (
        <CalendarCheck className="h-3.5 w-3.5 text-[#b7e4c7]" />
      )}
      {label}
    </span>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#dceee4] bg-white p-4 dark:border-[#27433a] dark:bg-[#111525]">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f6ee] text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
        {icon}
      </div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-extrabold leading-5 text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function PreparationItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-[#dceee4] bg-white p-4 dark:border-[#27433a] dark:bg-[#111525]">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-[#e7f6ee] text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
        {icon}
      </div>
      <p className="text-sm font-extrabold text-slate-950 dark:text-white">
        {title}
      </p>
      <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
        {text}
      </p>
    </div>
  );
}

function getHeroDescription(item: LiveSessionItem) {
  if (item.live_session_status === "ENDED") {
    if (item.live_session_recording_status === "READY") {
      return "The session has ended and the recording is ready to watch.";
    }
    return "The session has ended. The recording will appear here when processing is complete.";
  }
  if (item.live_session_status === "CANCELLED") {
    return "This scheduled classroom session is no longer available.";
  }
  if (item.live_session_can_join) {
    return "The live room is open. Join now and Daily will handle the video classroom experience.";
  }
  return "Review the schedule, keep this page open if you are waiting, and join when the backend opens the room.";
}

function getStatusHeadline(item: LiveSessionItem) {
  if (item.live_session_status === "ENDED") {
    return item.live_session_recording_status === "READY"
      ? "Recording available"
      : "Session ended";
  }
  if (item.live_session_status === "CANCELLED") return "Session cancelled";
  if (item.live_session_can_join) return "The join window is open";
  return "Upcoming live session";
}

function getStatusDescription(item: LiveSessionItem) {
  if (item.live_session_status === "ENDED") {
    if (item.live_session_recording_status === "FAILED") return "";
    return "Recording processing, check back soon.";
  }
  if (item.live_session_status === "CANCELLED") {
    return "This live session is no longer accepting joins.";
  }
  if (item.live_session_can_join) {
    return "We will create a fresh secure Daily link when you click Join.";
  }
  return "The join button becomes available when the backend opens the session window.";
}

function getCompletionHint(item: LiveSessionItem) {
  if (item.is_completed) return "This live session is marked complete.";
  if (item.live_session_status === "ENDED") {
    return "Mark this complete after attending or watching the recording.";
  }
  return "After attending the live session, come back here to mark it complete.";
}

function formatGuest(item: LiveSessionItem) {
  const name = item.live_session_guest_name?.trim();
  const title = item.live_session_guest_title?.trim();
  if (!name) return null;
  return title ? `${name}, ${title}` : name;
}

function formatDateTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDatePart(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTimePart(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function formatCountdown(value?: string | null, now = Date.now()) {
  if (!value) return null;
  const start = new Date(value).getTime();
  if (!Number.isFinite(start)) return null;

  const diff = start - now;
  if (diff <= 0) return "Opening soon";

  const minutes = Math.ceil(diff / 60000);
  if (minutes < 60) return `Starts in ${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `Starts in ${hours}h ${remainder}m` : `Starts in ${hours}h`;
}
