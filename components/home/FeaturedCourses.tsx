"use client";

import { Clock3, Trophy } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useCallback } from "react";
import { getCourseDurationLabel } from "@/lib/courseDuration";

type Level = "Beginner" | "Intermediate" | "Advanced";

interface Course {
  id: string;
  title: string;
  category: string;
  level: Level;
  rating: number;
  reviewCount: number;
  price: "Free" | string;
  image: string;
  href: string;
  is_enrolled?: boolean;
  is_completed?: boolean;
  has_access?: boolean;
  estimated_total_minutes?: number | null;
  estimated_duration?: string | null;
  certificate_enabled?: boolean | null;
}

const levelColors: Record<Level, string> = {
  Beginner: "bg-[#2D6A4F] text-white",
  Intermediate: "bg-amber-600 text-white",
  Advanced: "bg-rose-700 text-white",
};

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

function CourseCard({ course }: { course: Course }) {
  const durationLabel = getCourseDurationLabel(course);
  const canViewCourse =
    course.is_enrolled === true ||
    course.has_access === true ||
    course.is_completed === true;

  return (
    <article
      className="group flex flex-col bg-white dark:bg-[#141414] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 h-full"
      aria-labelledby={`course-${course.id}-title`}
    >
      <div className="relative overflow-hidden aspect-[16/9] bg-[#2D6A4F]/10 flex-shrink-0">
        <img
          src={course.image}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-300"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D6A4F]/30 via-[#52b788]/20 to-[#2D6A4F]/10 -z-10" />
        <span
          className={`absolute top-3 left-3 text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${levelColors[course.level] || levelColors.Beginner}`}
        >
          {course.level}
        </span>
      </div>
      <div className="flex flex-col flex-1 p-5 gap-3">
        {(course.reviewCount !== undefined && course.reviewCount > 0) && (
          <div className="flex items-center gap-1.5">
            <StarRating rating={course.rating} />
            <span className="text-[0.8rem] font-bold text-gray-900 dark:text-gray-100">
              {Number(course.rating).toFixed(1)}
            </span>
            <span className="text-[0.75rem] text-gray-500">
              ({course.reviewCount} reviews)
            </span>
          </div>
        )}
        <h3
          id={`course-${course.id}-title`}
          className="text-[0.95rem] font-bold leading-snug text-gray-900 dark:text-gray-100 tracking-tight"
        >
          {course.title}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[0.78rem] text-gray-400 dark:text-gray-500 line-clamp-1">
            In{" "}
            <span className="text-[#2D6A4F] dark:text-[#52b788] font-semibold">
              {course.category}
            </span>
          </p>
          {durationLabel && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#e7f6ee] px-2 py-1 text-[0.72rem] font-bold text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
              <Clock3 className="h-3.5 w-3.5" />
              {durationLabel}
            </span>
          )}
          {course.certificate_enabled === true && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#ecfff4] px-2 py-1 text-[0.72rem] font-bold text-[#0f8a46] dark:bg-[#15945a]/15 dark:text-[#8de5b5]">
              <Trophy className="h-3.5 w-3.5" />
              Certificate
            </span>
          )}
        </div>
        <div className="flex-1" />
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-[0.9rem] font-bold text-[#2D6A4F] dark:text-[#52b788]">
            {course.is_completed ? "Completed" : canViewCourse ? "Enrolled" : course.price}
          </span>
          <Link
            href={course.href}
            className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-gray-700 dark:text-gray-300 hover:text-[#2D6A4F] dark:hover:text-[#52b788] no-underline transition-colors duration-150"
          >
            {canViewCourse ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 8l3.5 3.5L13 4.5" />
              </svg>
            ) : (
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
            )}
            {canViewCourse ? "View Course" : "Get Enrolled"}
          </Link>
        </div>
      </div>
    </article>
  );
}

function NavArrow({
  direction,
  onClick,
  disabled,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous courses" : "Next courses"}
      className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-150 flex-shrink-0
        ${
          disabled
            ? "border-gray-300 dark:border-gray-700 text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-40"
            : "border-gray-400 dark:border-gray-500 text-gray-600 dark:text-gray-300 hover:border-[#2D6A4F] dark:hover:border-[#52b788] hover:text-[#2D6A4F] dark:hover:text-[#52b788] hover:bg-[#2D6A4F]/10 cursor-pointer"
        }`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {direction === "prev" ? (
          <path d="M10 3L5 8l5 5" />
        ) : (
          <path d="M6 3l5 5-5 5" />
        )}
      </svg>
    </button>
  );
}

export default function FeaturedCourses({
  initialCourses = [],
}: {
  initialCourses?: Course[];
}) {
  const [index, setIndex] = useState<number>(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const displayCourses = initialCourses;
  const maxIndex = Math.max(0, displayCourses.length - 1);

  const handleScroll = useCallback(() => {
    if (!trackRef.current) return;
    const container = trackRef.current;
    const scrollLeft = container.scrollLeft;
    const firstChild = container.firstElementChild as HTMLElement;
    if (!firstChild) return;
    
    const itemWidth = firstChild.offsetWidth + 20; // 20px is gap-5
    const newIndex = Math.round(scrollLeft / itemWidth);
    setIndex(Math.min(maxIndex, Math.max(0, newIndex)));
  }, [maxIndex]);

  const scrollTo = useCallback((newIndex: number) => {
    if (!trackRef.current) return;
    const container = trackRef.current;
    const firstChild = container.firstElementChild as HTMLElement;
    if (!firstChild) return;
    
    const itemWidth = firstChild.offsetWidth + 20;
    container.scrollTo({
      left: newIndex * itemWidth,
      behavior: "smooth",
    });
  }, []);

  const prev = useCallback(() => scrollTo(Math.max(0, index - 1)), [index, scrollTo]);
  const next = useCallback(() => scrollTo(Math.min(maxIndex, index + 1)), [index, maxIndex, scrollTo]);

  if (initialCourses.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-gray-50 dark:bg-[#0a0a0a] py-20 px-6"
      aria-labelledby="featured-courses-heading"
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[320px] rounded-full bg-[#2D6A4F]/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#2D6A4F] dark:text-[#52b788] mb-3">
            Featured Courses
          </p>
          <h2
            id="featured-courses-heading"
            className="text-[2rem] sm:text-[2.5rem] lg:text-[2.8rem] font-extrabold leading-[1.15] text-gray-900 dark:text-white tracking-tight mb-5"
          >
            Start Your Learning Journey Today
          </h2>
          <p className="text-[0.95rem] text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Social Work Nigeria offers structured, practice-led courses designed
            to strengthen ethical, skilled, and accountable social work practice
            across Nigeria.
          </p>
          <p className="text-[0.95rem] text-gray-400 dark:text-gray-500 leading-relaxed">
            Our courses support individuals and organisations working with
            children, families, and vulnerable adults — particularly in contexts
            where access to formal training, supervision, and CPD is limited.
          </p>
        </div>
        <div className="relative">
          <div 
            className="overflow-x-auto snap-x snap-mandatory flex gap-5 pb-8 -mx-6 px-6 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            ref={trackRef}
            onScroll={handleScroll}
          >
            {displayCourses.map((course) => (
              <div
                key={course.id}
                className="flex-shrink-0 w-[85%] sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.834rem)] snap-center sm:snap-start"
              >
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex items-center justify-between gap-4">
          <div
            className="flex items-center gap-2"
            role="tablist"
            aria-label="Course slides"
          >
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => scrollTo(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === index
                    ? "w-6 h-2 bg-[#2D6A4F] dark:bg-[#52b788]"
                    : "w-2 h-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-500"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <NavArrow direction="prev" onClick={prev} disabled={index === 0} />
            <NavArrow
              direction="next"
              onClick={next}
              disabled={index >= maxIndex}
            />
          </div>
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-7 py-3 bg-[#2D6A4F] hover:bg-[#1e4d38] text-white text-[0.95rem] font-semibold rounded-full no-underline shadow-lg shadow-green-900/20 hover:-translate-y-0.5 transition-all duration-150"
          >
            View All Courses
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
