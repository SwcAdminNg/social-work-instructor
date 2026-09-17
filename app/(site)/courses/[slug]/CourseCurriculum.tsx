"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp, PlayCircle, FileText, HelpCircle, X, Eye, ExternalLink, Link2 } from "lucide-react";
import { HlsVideoPlayer } from "@/components/learning/HlsVideoPlayer";
import { QuizEngine } from "@/components/learning/QuizEngine";

type CurriculumQuizQuestion = {
  id: string;
  text: string;
  allow_multiple_answers?: boolean | null;
  options: Array<{
    id: string;
    text: string;
  }>;
};

type CurriculumItem = {
  id: string;
  title: string;
  item_type?: string | null;
  assessment_type?: string | null;
  estimated_minutes?: number | null;
  is_preview?: boolean | null;
  video?: {
    playback_url?: string | null;
  } | null;
  document?: {
    file_name?: string | null;
    file_url?: string | null;
    content_url?: string | null;
    url?: string | null;
  } | null;
  document_url?: string | null;
  content_url?: string | null;
  quiz?: {
    questions?: CurriculumQuizQuestion[] | null;
  } | null;
  questions?: CurriculumQuizQuestion[] | null;
  link?: {
    url?: string | null;
    label?: string | null;
    description?: string | null;
  } | null;
  live_session?: {
    scheduled_start_at?: string | null;
    duration_minutes?: number | null;
    guest_name?: string | null;
    guest_title?: string | null;
    status?: string | null;
    recording_status?: string | null;
  } | null;
};

type CurriculumSection = {
  id: string;
  title: string;
  items?: CurriculumItem[] | null;
  guest_instructors?: GuestInstructor[] | null;
};

type GuestInstructor = {
  user_id?: string | null;
  name?: string | null;
  profile_picture_url?: string | null;
  is_guest?: boolean | null;
};

export function CourseCurriculum({ courseId, sections }: { courseId?: string; sections: CurriculumSection[] }) {
  // Store expanded state for each section ID. Initialize the first section as expanded.
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    if (sections && sections.length > 0) {
      initialState[sections[0].id] = true;
    }
    return initialState;
  });

  const [previewItem, setPreviewItem] = useState<CurriculumItem | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getItemIcon = (type?: string | null) => {
    switch (type?.toUpperCase()) {
      case "VIDEO":
        return <PlayCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
      case "DOCUMENT":
        return <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
      case "LINKS":
        return <Link2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
      case "LIVE_SESSION":
        return <CalendarDays className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
      case "QUIZ":
      case "ASSESSMENT":
        return <HelpCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  if (!sections || sections.length === 0) {
    return <p className="text-gray-500">No curriculum available yet.</p>;
  }

  return (
    <>
      <div className="space-y-4">
        {sections.map((section, idx) => {
          const isExpanded = expandedSections[section.id] || false;
          const itemCount = section.items?.length || 0;
          const guestLabel = formatGuestInstructors(section.guest_instructors);

          return (
            <div
              key={section.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm transition-all duration-200"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                aria-expanded={isExpanded}
              >
                <div className="flex flex-col text-left">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    Section {idx + 1}: {section.title}
                  </h3>
                  <span className="text-sm text-gray-500 mt-1">
                    {itemCount} {itemCount === 1 ? "lectures" : "lectures"}
                  </span>
                  {guestLabel && (
                    <span className="mt-1 text-sm font-semibold text-[#2D6A4F] dark:text-[#b7e4c7]">
                      {guestLabel}
                    </span>
                  )}
                </div>
                <div className="flex-shrink-0 ml-4 text-gray-500">
                  {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                </div>
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <ul className="overflow-hidden min-h-0 divide-y divide-gray-100 dark:divide-gray-800/50 bg-white dark:bg-gray-900">
                  {section.items?.map((item) => {
                    const link = getLinkPayload(item);
                    const liveSessionMeta = getLiveSessionMeta(item);

                    return (
                    <li
                      key={item.id}
                      className="px-6 py-4 flex flex-col gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        {getItemIcon(item.item_type)}
                        <div className="min-w-0">
                          <span className={`block font-medium ${item.is_preview ? "text-[#2D6A4F] dark:text-[#52b788]" : "text-gray-700 dark:text-gray-300"}`}>
                            {link?.label || item.title}
                          </span>
                          {link?.description && (
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-500 dark:text-gray-400">
                              {link.description}
                            </p>
                          )}
                          {liveSessionMeta && (
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-500 dark:text-gray-400">
                              {liveSessionMeta}
                            </p>
                          )}
                          {getEstimatedMinutes(item) > 0 && item.item_type !== "LIVE_SESSION" && (
                            <span className="mt-2 inline-flex rounded-md bg-[#e7f6ee] px-2 py-1 text-xs font-bold text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
                              {formatMinutes(getEstimatedMinutes(item))}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {link?.url ? (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-md bg-[#e7f6ee] px-3 py-1.5 text-sm font-bold text-[#2D6A4F] transition-colors hover:bg-[#d8f3dc] dark:bg-[#52b788]/15 dark:text-[#b7e4c7] dark:hover:bg-[#52b788]/25"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open
                          </a>
                        ) : item.item_type === "LIVE_SESSION" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#e7f6ee] px-3 py-1.5 text-sm font-bold text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
                            <CalendarDays className="h-4 w-4" />
                            {getLiveSessionStatusLabel(item)}
                          </span>
                        ) : item.is_preview ? (
                          <button
                            onClick={() => setPreviewItem(item)}
                            className="flex items-center gap-1.5 text-sm font-bold text-[#F4A261] hover:text-[#d98b4f] transition-colors bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {getItemLabel(item)}
                          </span>
                        )}
                      </div>
                    </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal Overlay */}
      {previewItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#F4A261] uppercase tracking-wider mb-1">
                  Free Preview
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                  {previewItem.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors focus:outline-none"
                aria-label="Close preview"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-black flex items-center justify-center min-h-[400px]">
              {previewItem.item_type === "VIDEO" ? (
                previewItem.video?.playback_url ? (
                  <div className="w-full aspect-video">
                    <HlsVideoPlayer 
                      url={previewItem.video.playback_url}
                      className="w-full h-full rounded-xl bg-black"
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Video content is processing or unavailable.</p>
                  </div>
                )
              ) : previewItem.item_type === "DOCUMENT" ? (
                (() => {
                  const docUrl = previewItem.document?.file_url || previewItem.document?.content_url || previewItem.document?.url || previewItem.document_url || previewItem.content_url;
                  if (docUrl) {
                    return (
                      <iframe
                        src={docUrl.toLowerCase().endsWith('.pdf') ? docUrl : `https://docs.google.com/viewer?url=${encodeURIComponent(docUrl)}&embedded=true`}
                        className="w-full h-[600px] bg-white rounded-xl"
                        title={previewItem.title}
                      />
                    );
                  }
                  return (
                    <div className="text-center text-gray-400 bg-gray-900 rounded-xl p-12 border border-gray-800">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h4 className="text-white text-xl font-bold mb-2">{previewItem.document?.file_name || previewItem.title}</h4>
                      <p>This document is available for preview, but the file link is not provided by the server.</p>
                    </div>
                  );
                })()
              ) : previewItem.item_type === "LINKS" ? (
                (() => {
                  const link = getLinkPayload(previewItem);
                  if (link?.url) {
                    return (
                      <div className="w-full max-w-xl rounded-xl bg-white p-6 text-left dark:bg-gray-900">
                        <Link2 className="mb-4 h-10 w-10 text-[#2D6A4F] dark:text-[#b7e4c7]" />
                        <h4 className="text-xl font-extrabold text-gray-900 dark:text-white">
                          {link.label || previewItem.title}
                        </h4>
                        {link.description && (
                          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                            {link.description}
                          </p>
                        )}
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-[#2D6A4F] px-4 text-sm font-bold text-white transition hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d]"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open resource
                        </a>
                      </div>
                    );
                  }
                  return (
                    <div className="text-center text-gray-400">
                      <Link2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Link preview is not available.</p>
                    </div>
                  );
                })()
              ) : isQuizItem(previewItem) ? (
                getQuizQuestions(previewItem)?.length ? (
                  <div className="w-full bg-white dark:bg-gray-50 rounded-xl max-h-[75vh] overflow-y-auto p-4 md:p-6">
                    <QuizEngine
                      courseId={courseId || ""}
                      itemId={previewItem.id}
                      isCompleted={false}
                      questions={getQuizQuestions(previewItem) || []}
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Quiz preview is not available.</p>
                  </div>
                )
              ) : (
                <div className="text-center text-gray-400">
                  <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Preview is not available for this item type.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function isQuizItem(item: CurriculumItem) {
  return (
    item?.item_type === "QUIZ" ||
    (item?.item_type === "ASSESSMENT" && item?.assessment_type === "QUIZ")
  );
}

function getQuizQuestions(item: CurriculumItem) {
  return item?.questions || item?.quiz?.questions;
}

function getItemLabel(item: CurriculumItem) {
  if (item?.item_type === "ASSESSMENT" && item?.assessment_type) {
    return `${item.assessment_type} assessment`;
  }

  return item?.item_type;
}

function getLinkPayload(item: CurriculumItem) {
  if (item.item_type !== "LINKS") return null;
  return item.link || null;
}

function getLiveSessionMeta(item: CurriculumItem) {
  if (item.item_type !== "LIVE_SESSION") return null;

  const pieces = [
    formatDateTime(item.live_session?.scheduled_start_at),
    formatGuest(item.live_session?.guest_name, item.live_session?.guest_title),
  ].filter(Boolean);

  return pieces.join(" - ") || null;
}

function getLiveSessionStatusLabel(item: CurriculumItem) {
  const status = item.live_session?.status;
  if (status === "ENDED" && item.live_session?.recording_status === "READY") {
    return "Recording ready";
  }
  if (status === "ENDED") return "Ended";
  if (status === "CANCELLED") return "Cancelled";
  return "Scheduled";
}

function formatGuestInstructors(guests?: GuestInstructor[] | null) {
  const names = (guests || [])
    .map((guest) => guest.name?.trim())
    .filter((name): name is string => Boolean(name));

  if (names.length === 0) return null;
  return `${names.length === 1 ? "Guest lecturer" : "Guest lecturers"}: ${names.join(", ")}`;
}

function getEstimatedMinutes(item: CurriculumItem) {
  return typeof item.estimated_minutes === "number" && item.estimated_minutes > 0
    ? item.estimated_minutes
    : 0;
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
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

function formatGuest(name?: string | null, title?: string | null) {
  const guestName = name?.trim();
  const guestTitle = title?.trim();
  if (!guestName) return null;
  return guestTitle ? `${guestName}, ${guestTitle}` : guestName;
}
