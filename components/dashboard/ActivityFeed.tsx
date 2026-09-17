"use client";

import React, { useState } from "react";
import { IconSpinner } from "@/components/auth/shared/icons";
import {
  IconBookOpen,
  IconClipboardCheck,
  IconStar,
  IconReceipt
} from "@/components/dashboard/icons";
import { CheckCircle2, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

export type ActivityItem = {
  id: string;
  user_id: string;
  activity_type: string;
  metadata_json?: Record<string, unknown> | null;
  created_at: string;
};

type ActivityResponse = {
  data?: ActivityItem[];
  items?: ActivityItem[];
  message?: string;
  meta?: {
    page?: number;
    page_size?: number;
    total_pages?: number;
    has_next?: boolean;
  };
  total_pages?: number;
};

type ActivityFeedProps = {
  initialActivities?: ActivityItem[];
  initialMeta?: ActivityResponse["meta"];
};

function metaString(meta: Record<string, unknown>, key: string) {
  const value = meta[key];
  return typeof value === "string" ? value : "";
}

function metaNumber(meta: Record<string, unknown>, key: string) {
  const value = meta[key];
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function metaBoolean(meta: Record<string, unknown>, key: string) {
  return meta[key] === true;
}

export function ActivityFeed({
  initialActivities = [],
  initialMeta,
}: ActivityFeedProps) {
  const [page, setPage] = useState(1);

  const fetchActivities = async (pageNumber: number): Promise<ActivityResponse> => {
    const res = await fetch(`/api/proxy/users/me/dashboard/activity?page=${pageNumber}&page_size=5`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch activities");
    }
    return data;
  };

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: ['dashboard-activities', page],
    queryFn: () => fetchActivities(page),
    placeholderData: keepPreviousData,
    initialData:
      page === 1 && initialActivities.length > 0
        ? {
            data: initialActivities,
            meta: initialMeta,
          }
        : undefined,
    staleTime: 5 * 60 * 1000,
  });

  const activities: ActivityItem[] = data?.data || data?.items || [];
  const totalPages = data?.meta?.total_pages || data?.total_pages || 1;
  const loading = isPending;
  const error = isError;

  const handleNext = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrev = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getActivityDetails = (item: ActivityItem) => {
    const meta = item.metadata_json || {};

    switch (item.activity_type) {
      case "COURSE_ENROLLED":
        return {
          icon: <IconBookOpen />,
          color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
          text: (
            <span>
              Enrolled in <span className="font-bold">{metaString(meta, "course_title") || "a new course"}</span>
            </span>
          ),
        };
      case "QUIZ_COMPLETED":
        return {
          icon: <IconClipboardCheck />,
          color: meta.passed
            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            : "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
          text: (
            <span>
              Completed {metaString(meta, "item_title") ? <span className="font-bold">{metaString(meta, "item_title")}</span> : "a quiz"}
              {metaString(meta, "course_title") ? ` in ${metaString(meta, "course_title")}` : ""} with a score of <span className="font-bold">{metaNumber(meta, "score")}%</span>
            </span>
          ),
        };
      case "QUIZ_GROUP_COMPLETED":
        return {
          icon: <IconClipboardCheck />,
          color: metaBoolean(meta, "passed")
            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            : "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
          text: (
            <span>
              Completed <span className="font-bold">{metaString(meta, "quiz_group_title") || metaString(meta, "item_title") || "a quiz group"}</span>
              {metaString(meta, "course_title") ? ` in ${metaString(meta, "course_title")}` : ""}
            </span>
          ),
        };
      case "ESSAY_SUBMITTED":
        return {
          icon: <IconClipboardCheck />,
          color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
          text: (
            <span>
              Submitted <span className="font-bold">{metaString(meta, "item_title") || "an essay"}</span>
              {metaString(meta, "course_title") ? ` in ${metaString(meta, "course_title")}` : ""}
            </span>
          ),
        };
      case "ESSAY_GRADED":
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
          text: (
            <span>
              Essay graded
              {metaString(meta, "course_title") ? ` in ${metaString(meta, "course_title")}` : ""}
              {metaNumber(meta, "score") ? <> with <span className="font-bold">{metaNumber(meta, "score")}%</span></> : null}
            </span>
          ),
        };
      case "REVIEW_CREATED":
        return {
          icon: <IconStar />,
          color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
          text: (
            <span>
              Left a <span className="font-bold">{metaNumber(meta, "rating")} star</span> review for <span className="font-bold">{metaString(meta, "course_title") || "a course"}</span>
            </span>
          ),
        };
      case "REVIEW_EDITED":
        return {
          icon: <IconStar />,
          color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
          text: (
            <span>
              Updated your <span className="font-bold">{metaNumber(meta, "rating")} star</span> review for <span className="font-bold">{metaString(meta, "course_title") || "a course"}</span>
            </span>
          ),
        };
      case "REVIEW_DELETED":
        return {
          icon: <IconStar />,
          color: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
          text: (
            <span>
              Deleted your review for <span className="font-bold">{metaString(meta, "course_title") || "a course"}</span>
            </span>
          ),
        };
      case "PAYMENT_SUCCESSFUL":
        const purchaseName = metaString(meta, "course_title") || metaString(meta, "plan_name") || "a purchase";
        return {
          icon: <IconReceipt />,
          color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
          text: (
            <span>
              Payment successful for <span className="font-bold">{purchaseName}</span>
              {metaNumber(meta, "amount") > 0 && (
                <span className="font-bold"> (NGN {metaNumber(meta, "amount").toLocaleString()})</span>
              )}
            </span>
          ),
        };
      default:
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          color: "bg-gray-100 dark:bg-gray-800 text-gray-500",
          text: <span>Performed an action</span>,
        };
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 min-h-[300px] flex items-center justify-center shadow-sm">
        <IconSpinner className="w-8 h-8 animate-spin text-[#2D6A4F]" />
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Recent Activity</h3>
        <p className="text-sm text-red-500">Failed to load activity feed. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden relative">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3>
        <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Timeline
        </span>
      </div>

      {isFetching && !isPending && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-[2px] z-10 flex items-center justify-center min-h-[200px]">
          <IconSpinner className="w-8 h-8 animate-spin text-[#2D6A4F]" />
        </div>
      )}

      {activities.length === 0 ? (
        <div className="p-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No recent activity found.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">When you take courses or quizzes, they will appear here.</p>
        </div>
      ) : (
        <div className="p-0">
          <ul className="flex flex-col list-none m-0 p-0">
            {activities.map((item, i) => {
              const details = getActivityDetails(item);
              const isLast = i === activities.length - 1;

              return (
                <li
                  key={item.id}
                  className={`relative p-5 sm:px-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                    !isLast ? "border-b border-gray-100 dark:border-gray-800/80" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${details.color}`}>
                      <div className="[&>svg]:w-5 [&>svg]:h-5">
                        {details.icon}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                        {details.text}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatRelativeTime(item.created_at)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {(page > 1 || page < totalPages) && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 flex items-center justify-between">
              <span
                aria-live="polite"
                role="status"
                className="text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {isFetching ? "Loading activity..." : `Page ${page} of ${totalPages}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={page === 1 || loading}
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-white dark:bg-gray-800 px-3 text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition-all hover:bg-gray-50 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <button
                  onClick={handleNext}
                  disabled={page >= totalPages || loading}
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-white dark:bg-gray-800 px-3 text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition-all hover:bg-gray-50 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
