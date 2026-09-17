"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);

  return value;
}

function Stat({
  value,
  suffix,
  label,
  animate,
}: {
  value: number;
  suffix: string;
  label: string;
  animate: boolean;
}) {
  const count = useCountUp(value, 1600, animate);
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-2xl font-extrabold text-white tracking-tight leading-none">
        {count.toLocaleString()}
        {suffix}
      </span>
      <span className="text-[0.72rem] text-white/50 uppercase tracking-widest font-medium">
        {label}
      </span>
    </div>
  );
}

export default function CTABanner({ statsData }: { statsData?: any }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const stats = [
    {
      value: statsData?.total_number_of_students || 120,
      suffix: "+",
      label: "Instructors connected",
    },
    {
      value: statsData?.number_of_published_courses || 12,
      suffix: "",
      label: "States represented",
    },
    {
      value: statsData?.completion_rate_of_course_by_enrolled_users
        ? Math.round(statsData.completion_rate_of_course_by_enrolled_users)
        : 96,
      suffix: "%",
      label: "Community uptime",
    },
  ];

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-16 px-4 sm:px-6 bg-gray-50 dark:bg-[#0a0a0a]"
      aria-labelledby="cta-heading"
    >
      {/* ── Card ── */}
      <div className="relative max-w-6xl mx-auto rounded-3xl overflow-hidden isolate">
        {/* Animated gradient border via pseudo-layer */}
        <div
          className="absolute inset-0 rounded-3xl p-px z-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "linear-gradient(135deg, #2D6A4F 0%, #52b788 40%, #1e4d38 70%, #2D6A4F 100%)",
            backgroundSize: "300% 300%",
            animation: "gradientShift 6s ease infinite",
          }}
        />

        {/* Inner container clips to card shape and sits above the border */}
        <div className="relative z-10 rounded-[calc(1.5rem-1px)] overflow-hidden flex flex-col lg:flex-row min-h-[360px]">
          {/* ── Left: content pane ── */}
          <div className="relative flex flex-col justify-between gap-8 px-8 py-10 sm:px-12 sm:py-12 bg-[#0d1f18] lg:w-[55%] flex-shrink-0">
            {/* Soft radial glow */}
            <div
              className="absolute top-0 left-0 w-[420px] h-[320px] rounded-full bg-[#2D6A4F]/20 blur-[80px] pointer-events-none -translate-x-1/3 -translate-y-1/3"
              aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col gap-6">
              {/* Eyebrow */}
              <div className="flex items-center gap-2.5 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#52b788] animate-pulse" />
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#52b788]">
                  Social Work Nigeria
                </span>
              </div>

              {/* Headline */}
              <h2
                id="cta-heading"
                className="text-[1.9rem] sm:text-[2.4rem] font-extrabold leading-[1.12] text-white tracking-tight max-w-md"
              >
                Ready to Join Your{" "}
                <span
                  className="relative inline-block"
                  style={{
                    background:
                      "linear-gradient(90deg, #52b788 0%, #95d5b2 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Instructor
                </span>{" "}
                Community?
              </h2>

              {/* Body */}
              <p className="text-[0.93rem] text-white/60 leading-relaxed max-w-sm">
                Keep your profile current and collaborate with other instructors
                inside the Social Work Nigeria community.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 px-6 py-3 bg-[#2D6A4F] hover:bg-[#52b788] text-white text-[0.88rem] font-bold rounded-full no-underline transition-all duration-200 shadow-lg shadow-green-900/30 hover:shadow-green-700/40 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b788]"
                >
                  Create Account
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="group-hover:translate-x-0.5 transition-transform duration-150"
                  >
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </Link>

                <Link
                  href="/dashboard/community"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/8 hover:bg-white/14 border border-white/15 hover:border-white/30 text-white text-[0.88rem] font-semibold rounded-full no-underline backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  Open Community
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
                    <rect x="1" y="1" width="6" height="6" rx="1" />
                    <rect x="9" y="1" width="6" height="6" rx="1" />
                    <rect x="1" y="9" width="6" height="6" rx="1" />
                    <rect x="9" y="9" width="6" height="6" rx="1" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Stats row */}
            <div className="relative z-10 flex flex-wrap items-center gap-x-8 gap-y-4 pt-6 border-t border-white/10">
              {stats.map((s) => (
                <Stat key={s.label} {...s} animate={visible} />
              ))}
            </div>
          </div>

          {/* ── Right: image pane ── */}
          <div className="relative flex-1 min-h-[260px] lg:min-h-0 overflow-hidden">
            {/* Actual image */}
            <img
              src="/images/home/cta-social-worker.webp"
              alt="Social worker smiling with colleagues"
              className="absolute inset-0 w-full h-full object-cover object-center"
              onError={(e) => {
                // Hide broken img; fallback gradient shows underneath
                (e.currentTarget as HTMLImageElement).style.opacity = "0";
              }}
            />

            {/* Overlay: left fade to blend with content pane */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#0d1f18] via-[#0d1f18]/30 to-transparent"
              aria-hidden="true"
            />

            {/* Overlay: dark veil for contrast */}
            <div
              className="absolute inset-0 bg-[#0d1f18]/40"
              aria-hidden="true"
            />

            {/* Fallback pattern if image fails */}
            <div
              className="absolute inset-0 -z-10 bg-gradient-to-br from-[#1e4d38] via-[#2D6A4F]/60 to-[#0d1f18]"
              aria-hidden="true"
            >
              {/* Geometric accent lines */}
              <svg
                className="absolute inset-0 w-full h-full opacity-10"
                viewBox="0 0 400 300"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid slice"
                aria-hidden="true"
              >
                <circle
                  cx="300"
                  cy="80"
                  r="120"
                  stroke="#52b788"
                  strokeWidth="0.5"
                />
                <circle
                  cx="300"
                  cy="80"
                  r="80"
                  stroke="#52b788"
                  strokeWidth="0.5"
                />
                <circle
                  cx="300"
                  cy="80"
                  r="40"
                  stroke="#52b788"
                  strokeWidth="0.5"
                />
                <line
                  x1="180"
                  y1="0"
                  x2="400"
                  y2="300"
                  stroke="#52b788"
                  strokeWidth="0.5"
                />
                <line
                  x1="220"
                  y1="0"
                  x2="400"
                  y2="220"
                  stroke="#52b788"
                  strokeWidth="0.5"
                />
              </svg>
            </div>

            {/* Trust badge floating in the image pane */}
            <div className="absolute bottom-6 right-6 flex items-center gap-3 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-xl">
              <div className="flex -space-x-2 flex-shrink-0">
                {["#52b788", "#2D6A4F", "#95d5b2"].map((color, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-black/60 flex items-center justify-center text-[0.6rem] font-bold text-white"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  >
                    {["SW", "NG", "SA"][i]}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white text-[0.78rem] font-semibold leading-tight">
                  {(
                    statsData?.total_number_of_students || 4200
                  ).toLocaleString()}
                  + practitioners
                </p>
                <p className="text-white/50 text-[0.68rem] leading-tight">
                  across 12 states
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe injection */}
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="gradientShift"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
