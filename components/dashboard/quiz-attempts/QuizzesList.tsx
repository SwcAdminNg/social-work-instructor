"use client";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconClipboardCheck } from "@/components/dashboard/icons";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type Quiz = {
  item_id: string;
  title: string;
  course_id: string;
  course_title: string;
  status: string;
  score: number | null;
  attempted_at: string | null;
};

const TABS = [
  { id: "ALL", label: "All Quizzes" },
  { id: "PASSED", label: "Passed" },
  { id: "FAILED", label: "Failed" },
  { id: "NOT_STARTED", label: "Available" },
];

export default function QuizzesList({
  initialData,
  totalItems,
  currentPage,
  currentStatus,
  limit,
  error,
}: {
  initialData: Quiz[];
  totalItems: number;
  currentPage: number;
  currentStatus: string;
  limit: number;
  error: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (statusId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // reset to page 1 on filter change
    if (statusId === "ALL") {
      params.delete("status");
    } else {
      params.set("status", statusId);
    }
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil(totalItems / limit);
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const getStatusDisplay = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PASSED":
        return (
          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-lg border border-green-200 dark:border-green-800/30">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Passed</span>
          </div>
        );
      case "FAILED":
        return (
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800/30">
            <XCircle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Failed</span>
          </div>
        );
      case "NOT_STARTED":
        return (
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800/30">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Not Started</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="text-xs font-bold uppercase tracking-wider">{status}</span>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Tabs */}
      <div className="flex items-center overflow-x-auto hide-scrollbar gap-2 p-1.5 bg-gray-50/80 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl w-full md:w-fit max-w-full border border-gray-200/50 dark:border-gray-800/50">
        {TABS.map((tab) => {
          const isActive = currentStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap
                ${isActive 
                  ? "bg-white dark:bg-gray-800 text-[#2D6A4F] dark:text-[#52b788] shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-700/50" 
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400">
          <p className="font-semibold text-sm">{error}</p>
        </div>
      ) : !initialData || initialData.length === 0 ? (
        <EmptyState
          icon={IconClipboardCheck}
          title="No quizzes found"
          description={
            currentStatus === "ALL" 
              ? "You don't have any quizzes yet. Enroll in a course to get started!"
              : `You don't have any quizzes matching "${TABS.find(t => t.id === currentStatus)?.label}".`
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {initialData.map((quiz) => (
            <Link
              key={quiz.item_id}
              href={`/learn/${quiz.course_id}/item/${quiz.item_id}`}
              className="flex flex-col bg-white dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 hover:shadow-xl hover:shadow-gray-200/40 dark:hover:shadow-none hover:border-green-100 dark:hover:border-green-900/30 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-[#2D6A4F] dark:group-hover:text-[#52b788] transition-colors">
                    {quiz.title}
                  </h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                    {quiz.course_title}
                  </p>
                </div>
                {getStatusDisplay(quiz.status)}
              </div>

              <div className="mt-auto pt-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-[0.7rem] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1">
                    Score
                  </p>
                  <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                    {typeof quiz.score === 'number' ? `${quiz.score}%` : "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[0.7rem] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1">
                    Last Attempt
                  </p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {quiz.attempted_at ? new Intl.DateTimeFormat('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }).format(new Date(quiz.attempted_at)) : "Never"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalItems > limit && (
        <div className="flex items-center justify-between px-2 pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Showing <span className="font-bold text-gray-900 dark:text-white">{(currentPage - 1) * limit + 1}</span> to <span className="font-bold text-gray-900 dark:text-white">{Math.min(currentPage * limit, totalItems)}</span> of <span className="font-bold text-gray-900 dark:text-white">{totalItems}</span> quizzes
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === Math.ceil(totalItems / limit)}
              className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F]"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
