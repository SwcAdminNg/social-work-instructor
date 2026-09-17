"use client";

import { useState } from "react";

interface AccordionItem {
  id: string;
  title: string;
  body: string;
}

interface ChevronIconProps {
  open: boolean;
}

interface ToolbarButton {
  label: string;
  path: string;
}

const accordionItems: AccordionItem[] = [
  {
    id: "evidence-based",
    title: "Focused Collaboration",
    body: "Stay connected with other instructors and platform administrators through a dedicated community workspace.",
  },
  {
    id: "practical-application",
    title: "Professional Presence",
    body: "Keep your profile details accurate so colleagues can recognize you and engage with you across the platform.",
  },
  {
    id: "community",
    title: "Supportive Community",
    body: "Share updates, ask questions, and keep conversations moving in moderated platform rooms.",
  },
  {
    id: "flexible-pace",
    title: "Simple Dashboard",
    body: "Use a clean dashboard with only the essentials: your profile settings and the community feature.",
  },
];

function ChevronIcon({ open }: ChevronIconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`flex-shrink-0 transition-transform duration-300 ${
        open ? "rotate-180" : "rotate-0"
      }`}
    >
      <path
        d="M5 7.5l5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LearningTransform() {
  const [openId, setOpenId] = useState<string | null>("evidence-based");

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <section
      className="relative overflow-hidden bg-white dark:bg-[#0a0a0a] py-20 px-6"
      aria-labelledby="transform-heading"
    >
      {/* Subtle top-left decorative circle */}
      <div
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full border border-gray-100 dark:border-gray-900 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* ── Left column ── */}
        <div>
          {/* Eyebrow */}
          <p className="text-sm font-semibold uppercase tracking-widest text-[#2D6A4F] mb-4">
            Instructor Workspace
          </p>

          {/* Heading */}
          <h2
            id="transform-heading"
            className="text-[2rem] sm:text-[2.4rem] lg:text-[2.6rem] font-extrabold leading-[1.15] text-gray-900 dark:text-gray-50 tracking-tight mb-5"
          >
            Coordinate Your Instructor Presence
          </h2>

          {/* Subtext */}
          <p className="text-[0.95rem] text-gray-500 dark:text-gray-400 leading-relaxed mb-10 max-w-[460px]">
            Join the instructor-side workspace for profile management and
            community conversations.
          </p>

          {/* Accordion */}
          <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-800">
            {accordionItems.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id}>
                  <button
                    id={`${item.id}-btn`}
                    onClick={() => toggle(item.id)}
                    aria-expanded={isOpen}
                    aria-controls={`${item.id}-body`}
                    className="w-full flex items-center justify-between gap-4 py-5 text-left bg-transparent border-none cursor-pointer group"
                  >
                    <span
                      className={`text-[0.95rem] font-bold tracking-tight transition-colors duration-150 ${
                        isOpen
                          ? "text-[#2D6A4F]"
                          : "text-gray-900 dark:text-gray-100 group-hover:text-[#2D6A4F] dark:group-hover:text-[#52b788]"
                      }`}
                    >
                      {item.title}
                    </span>
                    <span
                      className={`transition-colors duration-150 ${
                        isOpen
                          ? "text-[#2D6A4F]"
                          : "text-gray-400 dark:text-gray-500 group-hover:text-[#2D6A4F]"
                      }`}
                    >
                      <ChevronIcon open={isOpen} />
                    </span>
                  </button>

                  {/* Animated panel */}
                  <div
                    id={`${item.id}-body`}
                    role="region"
                    aria-labelledby={`${item.id}-btn`}
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-[0.875rem] text-gray-500 dark:text-gray-400 leading-relaxed pb-5">
                      {item.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right column — image with decorative blobs ── */}
        <div className="relative flex items-center justify-center lg:justify-end">
          {/* Outer blob frame — dark card */}
          <div className="relative w-full max-w-[500px]">
            {/* Dark rounded background card */}
            <div className="relative bg-gray-900 dark:bg-[#111] rounded-[2rem] p-4 shadow-2xl shadow-gray-900/30 dark:shadow-black/50">
              {/* Green blob decorations — corners */}
              {/* Top-left blob */}
              <div
                className="absolute -top-4 -left-4 w-16 h-16 bg-[#52b788] dark:bg-[#2D6A4F] rounded-[40%_60%_55%_45%/45%_55%_60%_40%] opacity-90"
                aria-hidden="true"
              />
              {/* Top-right blob */}
              <div
                className="absolute -top-5 right-10 w-12 h-12 bg-[#52b788] dark:bg-[#2D6A4F] rounded-[60%_40%_45%_55%/55%_45%_40%_60%] opacity-90"
                aria-hidden="true"
              />
              {/* Bottom-left blob */}
              <div
                className="absolute -bottom-4 left-10 w-14 h-14 bg-[#52b788] dark:bg-[#2D6A4F] rounded-[45%_55%_60%_40%/60%_40%_55%_45%] opacity-90"
                aria-hidden="true"
              />
              {/* Bottom-right blob */}
              <div
                className="absolute -bottom-5 -right-4 w-16 h-16 bg-[#52b788] dark:bg-[#2D6A4F] rounded-[55%_45%_40%_60%/40%_60%_45%_55%] opacity-90"
                aria-hidden="true"
              />

              {/* Image */}
              <div className="relative rounded-[1.25rem] overflow-hidden aspect-[4/3] w-full">
                <img
                  src="/images/home/swc-student-learning.webp"
                  alt="A social work professional studying on a laptop at home"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Mock video-call toolbar */}
              <div className="flex items-center justify-center gap-3 mt-4 mb-1">
                {[
                  {
                    label: "Camera",
                    path: "M2 7a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7zm12 1.5 3-2v5l-3-2V8.5z",
                  },
                  {
                    label: "Microphone",
                    path: "M8 1a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-5 7a5 5 0 0 0 10 0M8 13v2m-2 0h4",
                  },
                  {
                    label: "Screen share",
                    path: "M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3zm4 9h4m-2 0v2",
                  },
                  {
                    label: "Participants",
                    path: "M5 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm5-1a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM1 14c0-2.761 1.79-5 4-5s4 2.239 4 5m2-4c1.657 0 3 1.567 3 3.5",
                  },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    aria-label={btn.label}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2D6A4F]/20 hover:bg-[#2D6A4F]/40 transition-colors duration-150 cursor-default"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="#52b788"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d={btn.path} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Floating stat badge */}
            <div className="absolute -bottom-5 -left-6 hidden sm:flex items-center gap-3 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 shadow-lg shadow-gray-200/60 dark:shadow-black/40">
              <div className="w-9 h-9 flex items-center justify-center bg-[#2D6A4F]/10 rounded-xl flex-shrink-0">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="#2D6A4F"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10 2l2.09 4.26L17 7.27l-3.5 3.41.83 4.82L10 13.27l-4.33 2.23.83-4.82L3 7.27l4.91-.71z" />
                </svg>
              </div>
              <div>
                <p className="text-[0.78rem] font-extrabold text-gray-900 dark:text-gray-100 leading-none">
                  4.9 / 5
                </p>
                <p className="text-[0.7rem] text-gray-500 dark:text-gray-400 mt-0.5">
                  Community rating
                </p>
              </div>
            </div>

            {/* Floating learner count badge */}
            <div className="absolute -top-5 -right-6 hidden sm:flex items-center gap-3 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 shadow-lg shadow-gray-200/60 dark:shadow-black/40">
              <div className="w-9 h-9 flex items-center justify-center bg-[#2D6A4F]/10 rounded-xl flex-shrink-0">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="#2D6A4F"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M13 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM5 17c0-2.761 2.239-5 5-5s5 2.239 5 5" />
                  <path d="M17 11a2 2 0 1 0 0-4M19 17c0-1.864-1.343-3.411-3-3.732" />
                </svg>
              </div>
              <div>
                <p className="text-[0.78rem] font-extrabold text-gray-900 dark:text-gray-100 leading-none">
                  2,400+
                </p>
                <p className="text-[0.7rem] text-gray-500 dark:text-gray-400 mt-0.5">
                  Active members
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
