import Link from "next/link";
import { IconBookOpen, IconStar } from "@/components/dashboard/icons";
import { Clock3, Star, Trophy } from "lucide-react";
import { getCourseDurationLabel } from "@/lib/courseDuration";

interface CourseCardProps {
  id: string;
  title: string;
  slug?: string;
  thumbnail_url?: string;
  is_free?: boolean;
  is_exclusive?: boolean;
  price?: number;
  is_enrolled?: boolean;
  has_access?: boolean;
  progress_percent?: number;
  is_completed?: boolean;
  average_rating?: number;
  total_reviews?: number;
  estimated_total_minutes?: number | null;
  estimated_duration?: string | null;
  certificate_enabled?: boolean | null;
  href: string; // The destination when clicked
}

export function CourseCard({
  title,
  thumbnail_url,
  is_free,
  is_exclusive,
  price,
  is_enrolled,
  has_access,
  progress_percent,
  is_completed,
  average_rating,
  total_reviews,
  estimated_total_minutes,
  estimated_duration,
  certificate_enabled,
  href,
}: CourseCardProps) {
  const durationLabel = getCourseDurationLabel({
    estimated_duration,
    estimated_total_minutes,
  });

  return (
    <Link
      href={href}
      className="group block rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] transform hover:-translate-y-1"
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {thumbnail_url ? (
          <img
            src={thumbnail_url}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <IconBookOpen />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {is_free && (
            <span className="px-3 py-1 text-xs font-bold bg-[#F4A261] text-white rounded-lg shadow-sm">
              FREE
            </span>
          )}
          {is_exclusive && (
            <span className="px-3 py-1 text-xs font-bold bg-[#E76F51] text-white rounded-lg shadow-sm flex items-center gap-1">
              <IconStar /> EXCLUSIVE
            </span>
          )}
          {!is_free && price !== undefined && (
            <span className="px-3 py-1 text-xs font-bold bg-[#2D6A4F] text-white rounded-lg shadow-sm backdrop-blur-md">
              ₦{price.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-[#2D6A4F] dark:group-hover:text-[#52b788] transition-colors">
          {title}
        </h3>

        {durationLabel && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex w-max max-w-full items-center gap-1 rounded-md bg-[#e7f6ee] px-2.5 py-1 text-xs font-bold text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
              <Clock3 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{durationLabel}</span>
            </span>
            {certificate_enabled === true && (
              <span className="inline-flex w-max max-w-full items-center gap-1 rounded-md bg-[#ecfff4] px-2.5 py-1 text-xs font-bold text-[#0f8a46] dark:bg-[#15945a]/15 dark:text-[#8de5b5]">
                <Trophy className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">Certificate</span>
              </span>
            )}
          </div>
        )}

        {!durationLabel && certificate_enabled === true && (
          <span className="mt-3 inline-flex w-max max-w-full items-center gap-1 rounded-md bg-[#ecfff4] px-2.5 py-1 text-xs font-bold text-[#0f8a46] dark:bg-[#15945a]/15 dark:text-[#8de5b5]">
            <Trophy className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">Certificate</span>
          </span>
        )}

        {/* Rating */}
        {(total_reviews !== undefined && total_reviews > 0) && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i < (average_rating || 0) ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-gray-300 dark:text-gray-600"}`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {Number(average_rating).toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">
              ({total_reviews})
            </span>
          </div>
        )}

        {/* Progress Bar (if enrolled) */}
        {progress_percent !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              <span>Progress</span>
              <span>{progress_percent}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={progress_percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Course progress"
              className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-[#2D6A4F] dark:bg-[#52b788] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress_percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="mt-5 flex items-center justify-between text-sm">
          {is_enrolled ? (
            <span className="text-[#2D6A4F] dark:text-[#52b788] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2D6A4F] dark:bg-[#52b788]" />
              Enrolled
            </span>
          ) : has_access ? (
            <span className="text-[#2D6A4F] dark:text-[#52b788] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2D6A4F] dark:bg-[#52b788]" />
              Free Access
            </span>
          ) : (
            <span className="text-gray-500 font-medium">Available to enroll</span>
          )}

          {is_completed && (
            <span className="text-[#2D6A4F] dark:text-[#52b788] font-bold">
              ✓ Completed
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
