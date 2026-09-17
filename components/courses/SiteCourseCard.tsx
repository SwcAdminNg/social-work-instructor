"use client";

import { Clock3, Trophy } from "lucide-react";
import Link from "next/link";
import { getCourseDurationLabel } from "@/lib/courseDuration";

interface SiteCourseCardProps {
  id: string;
  title: string;
  thumbnail_url?: string;
  is_free?: boolean;
  price?: number;
  href: string;
  is_enrolled?: boolean;
  is_completed?: boolean;
  has_access?: boolean;
  // Optional fields that might not be in the API but are needed for the UI
  level?: string;
  category?: string;
  average_rating?: number;
  total_reviews?: number;
  estimated_total_minutes?: number | null;
  estimated_duration?: string | null;
  certificate_enabled?: boolean | null;
}

const levelColors: Record<string, string> = {
  Beginner: "bg-[#2D6A4F] text-white",
  Intermediate: "bg-amber-600 text-white",
  Advanced: "bg-rose-700 text-white",
};

function formatEnumString(str: string): string {
  if (!str) return str;
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of ${max} stars`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill={i < rating ? "#f59e0b" : "none"}
          stroke="#f59e0b"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 1.5l1.545 3.13 3.455.502-2.5 2.437.59 3.441L8 9.25l-3.09 1.76.59-3.44L3 5.132l3.455-.502z" />
        </svg>
      ))}
    </div>
  );
}

export function SiteCourseCard({
  id,
  title,
  thumbnail_url,
  is_free,
  price,
  href,
  is_enrolled,
  is_completed,
  has_access,
  level = "Beginner",
  category = "Professional Development",
  average_rating,
  total_reviews,
  estimated_total_minutes,
  estimated_duration,
  certificate_enabled,
}: SiteCourseCardProps) {
  const displayPrice = is_free ? "Free" : (price ? `₦${price.toLocaleString()}` : "Paid");
  const fallbackImage = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop";
  const displayCategory = formatEnumString(category);
  const displayLevel = formatEnumString(level);
  const durationLabel = getCourseDurationLabel({
    estimated_duration,
    estimated_total_minutes,
  });
  const canViewCourse = is_enrolled === true || has_access === true || is_completed === true;

  return (
    <article
      className="group flex flex-col bg-white dark:bg-[#141414] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 h-full"
      aria-labelledby={`course-${id}-title`}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[16/9] bg-[#2D6A4F]/10 flex-shrink-0">
        <img
          src={thumbnail_url || fallbackImage}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = fallbackImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D6A4F]/30 via-[#52b788]/20 to-[#2D6A4F]/10 -z-10" />

        {/* Level badge */}
        <span
          className={`absolute top-3 left-3 text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${levelColors[displayLevel] || levelColors["Beginner"]}`}
        >
          {displayLevel}
        </span>
        {/* Access badge */}
        {canViewCourse && (
          <span className="absolute top-3 right-3 text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#1e4d38] text-white shadow-lg shadow-[#1e4d38]/30">
            {is_completed ? "Completed" : is_enrolled ? "Enrolled" : "Access"}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Stars */}
        {(total_reviews !== undefined && total_reviews > 0) && (
          <div className="flex items-center gap-1.5">
            <StarRating rating={average_rating || 0} />
            <span className="text-[0.8rem] font-bold text-gray-900 dark:text-gray-100">
              {Number(average_rating).toFixed(1)}
            </span>
            <span className="text-[0.75rem] text-gray-500">
              ({total_reviews} reviews)
            </span>
          </div>
        )}

        {/* Title */}
        <h3
          id={`course-${id}-title`}
          className="text-[0.95rem] font-bold leading-snug text-gray-900 dark:text-gray-100 tracking-tight line-clamp-2"
        >
          {title}
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[0.78rem] text-gray-400 dark:text-gray-500">
            In{" "}
            <span className="text-[#2D6A4F] dark:text-[#52b788] font-semibold">
              {displayCategory}
            </span>
          </p>
          {durationLabel && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#e7f6ee] px-2 py-1 text-[0.72rem] font-bold text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
              <Clock3 className="h-3.5 w-3.5" />
              {durationLabel}
            </span>
          )}
          {certificate_enabled === true && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#ecfff4] px-2 py-1 text-[0.72rem] font-bold text-[#0f8a46] dark:bg-[#15945a]/15 dark:text-[#8de5b5]">
              <Trophy className="h-3.5 w-3.5" />
              Certificate
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-[0.9rem] font-bold text-[#2D6A4F] dark:text-[#52b788]">
            {is_completed ? "Completed" : canViewCourse ? "Enrolled" : displayPrice}
          </span>
          <Link
            href={href}
            className={`inline-flex items-center gap-1.5 text-[0.8rem] font-semibold no-underline transition-colors duration-150 ${
              canViewCourse
                ? "text-[#F4A261] dark:text-[#F4A261] hover:text-[#d98b4f]"
                : "text-gray-700 dark:text-gray-300 hover:text-[#2D6A4F] dark:hover:text-[#52b788]"
            }`}
          >
            {/* Grid icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="1" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
            {canViewCourse ? "View Course" : "Get Enrolled"}
          </Link>
        </div>
      </div>
    </article>
  );
}
