"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Award, Download, ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CopyLinkButton } from "./CopyLinkButton";

export type Certificate = {
  id: string;
  course_id: string;
  course_title: string;
  recipient_name: string;
  certificate_number: string;
  verification_code: string;
  issued_at: string;
  pdf_url: string;
  verify_url: string;
};

export default function CertificatesList({
  initialData,
  totalItems,
  currentPage,
  limit,
  error,
}: {
  initialData: Certificate[];
  totalItems: number;
  currentPage: number;
  limit: number;
  error: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400">
        <p className="font-semibold text-sm">{error}</p>
      </div>
    );
  }

  if (!initialData || initialData.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="No certificates yet"
        description="Complete a course from start to finish (including passing any final assessments) and your certificate will show up here automatically. Scheduled/cohort courses issue theirs on the course's official end date, even if you finish early."
      />
    );
  }

  const totalPages = Math.ceil(totalItems / limit);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {initialData.map((cert) => (
          <div
            key={cert.id}
            className="flex flex-col gap-4 p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 text-[#2D6A4F] dark:text-[#52b788]">
                <Award className="h-6 w-6" />
              </span>
              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-right">
                {formatDate(cert.issued_at)}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                {cert.course_title}
              </h3>
              <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                Cert #{cert.certificate_number}
              </p>
            </div>

            <div className="mt-auto flex flex-col gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              <a
                href={cert.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] dark:bg-[#52b788] px-4 py-2.5 text-sm font-bold text-white dark:text-gray-950 transition hover:bg-[#1B4332] dark:hover:bg-[#74c69d]"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </a>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/certificates/${cert.course_id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  View
                </Link>
                <CopyLinkButton value={cert.verify_url} label="Copy link" className="flex-1" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Showing{" "}
            <span className="font-bold text-gray-900 dark:text-white">
              {(currentPage - 1) * limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-bold text-gray-900 dark:text-white">
              {Math.min(currentPage * limit, totalItems)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-gray-900 dark:text-white">
              {totalItems}
            </span>{" "}
            certificates
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
              disabled={currentPage === totalPages}
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
