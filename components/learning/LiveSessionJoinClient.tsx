"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertCircle, ArrowLeft, Video } from "lucide-react";
import { IconSpinner } from "@/components/auth/shared/icons";

type JoinData = {
  join_url: string;
  is_owner?: boolean | null;
  expires_at?: string | null;
};

type LiveSessionJoinClientProps = {
  itemId: string;
  courseSlug: string;
  backHref?: string;
  scheduledStartAt?: string | null;
};

export function LiveSessionJoinClient({
  itemId,
  courseSlug,
  backHref = `/courses/${courseSlug}`,
  scheduledStartAt,
}: LiveSessionJoinClientProps) {
  const pathname = usePathname();
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const join = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/proxy/courses/items/${itemId}/live-session/join`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        window.location.assign(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        return;
      }

      if (!res.ok) {
        setError({
          status: res.status,
          message: json?.message || "This live session is not available right now.",
        });
        return;
      }

      const data = json?.data as JoinData | undefined;
      if (data?.join_url) {
        window.location.assign(data.join_url);
        return;
      }

      setError({ message: "The live session join link was not returned." });
    } catch {
      setError({ message: "We could not reach the live session service." });
    } finally {
      setLoading(false);
    }
  }, [itemId, pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      join();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [join]);

  return (
    <div className="flex min-h-[70dvh] items-center justify-center bg-[#f7fcf9] px-4 py-12 dark:bg-[#0b1220]">
      <div className="w-full max-w-md rounded-lg border border-[#dceee4] bg-white p-6 text-center shadow-sm dark:border-[#27433a] dark:bg-[#111525]">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-[#e7f6ee] text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
          {loading ? (
            <IconSpinner className="h-6 w-6 animate-spin" />
          ) : error?.status === 403 ? (
            <AlertCircle className="h-6 w-6" />
          ) : (
            <Video className="h-6 w-6" />
          )}
        </span>
        <h1 className="text-lg font-extrabold text-slate-950 dark:text-white">
          {loading
            ? "Redirecting to Daily"
            : error?.status === 403
              ? "You do not have access"
              : "Live session unavailable"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {loading
            ? "We are creating a fresh secure join link for this live session."
            : error?.message || "Please try again in a moment."}
        </p>
        {!loading && error?.status === 400 && scheduledStartAt && (
          <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
            Scheduled for {formatDateTime(scheduledStartAt)}. Come back closer
            to the start time.
          </div>
        )}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {!loading && error?.status !== 403 && (
            <button
              type="button"
              onClick={join}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#2D6A4F] px-4 text-sm font-extrabold text-white transition hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
            >
              Try again
            </button>
          )}
          <Link
            href={backHref}
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#b7e4c7] px-4 text-sm font-extrabold text-[#2D6A4F] transition hover:bg-[#f0fbf5] dark:border-[#27433a] dark:text-[#b7e4c7] dark:hover:bg-[#183026]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            View course
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
