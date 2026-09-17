"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, UsersRound } from "lucide-react";

export type CourseInstructor = {
  id?: string | null;
  name: string;
  title?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  is_guest?: boolean | null;
};

type InstructorSummaryProps = {
  instructors: CourseInstructor[];
  variant?: "card" | "hero";
};

export function InstructorSummary({
  instructors,
  variant = "card",
}: InstructorSummaryProps) {
  if (instructors.length === 0) return null;

  const [firstInstructor, ...otherInstructors] = instructors;
  const extraCount = otherInstructors.length;
  const isHero = variant === "hero";

  return (
    <div
      className={`flex min-w-0 items-center gap-2 text-sm font-bold ${
        isHero ? "text-white/90" : "text-slate-600 dark:text-slate-400"
      }`}
    >
      <span
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-md text-xs font-extrabold ${
          isHero
            ? "border border-white/25 bg-white/15 text-white"
            : "bg-[#e7f6ee] text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]"
        }`}
      >
        {firstInstructor.avatar_url ? (
          <img
            src={firstInstructor.avatar_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          initials(firstInstructor.name) || <UsersRound className="h-4 w-4" />
        )}
      </span>
      <span className="min-w-0 truncate">{firstInstructor.name}</span>
      {firstInstructor.is_guest && (
        <span
          className={`inline-flex h-6 flex-shrink-0 items-center rounded-md px-2 text-xs font-extrabold ${
            isHero
              ? "bg-white/15 text-white"
              : "bg-[#fef3c7] text-[#92400e] dark:bg-amber-400/15 dark:text-amber-200"
          }`}
        >
          Guest
        </span>
      )}
      {extraCount > 0 && (
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className={`inline-flex h-6 flex-shrink-0 items-center justify-center rounded-md px-2 text-xs font-extrabold transition ${
                isHero
                  ? "bg-white/15 text-white hover:bg-white/25"
                  : "bg-[#e7f6ee] text-[#2D6A4F] hover:bg-[#d8f3dc] dark:bg-[#52b788]/15 dark:text-[#b7e4c7] dark:hover:bg-[#52b788]/25"
              }`}
              aria-label={`View ${instructors.length} instructors`}
            >
              +{extraCount}
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid max-h-[85vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 overflow-hidden rounded-lg border border-[#dceee4] bg-white p-5 shadow-2xl dark:border-[#27433a] dark:bg-[#111525] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Dialog.Title className="text-xl font-extrabold text-slate-950 dark:text-white">
                    Course instructors
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Meet everyone teaching this course.
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    aria-label="Close instructors modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="swcl-sidebar-scroll grid grid-cols-1 sm:grid-cols-2 max-h-[58vh] gap-4 overflow-y-auto pr-1">
                {instructors.map((instructor) => (
                  <div
                    key={instructor.id || instructor.name}
                    className="flex flex-col items-center text-center gap-3 rounded-xl border border-[#edf5f0] bg-[#fbfefd] p-5 shadow-sm dark:border-[#27433a] dark:bg-[#0f1726]"
                  >
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7f6ee] text-xl font-extrabold text-[#2D6A4F] ring-4 ring-white dark:ring-[#111525] shadow-sm dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
                      {instructor.avatar_url ? (
                        <img
                          src={instructor.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials(instructor.name)
                      )}
                    </div>
                    <div className="min-w-0 w-full">
                      <p className="font-extrabold text-slate-950 dark:text-white">
                        {instructor.name}
                      </p>
                      {instructor.title && (
                        <p className="mt-0.5 text-sm font-semibold text-[#2D6A4F] dark:text-[#b7e4c7]">
                          {instructor.title}
                        </p>
                      )}
                      {instructor.is_guest && (
                        <p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                          Guest lecturer
                        </p>
                      )}
                      {instructor.bio && (
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                          {instructor.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
