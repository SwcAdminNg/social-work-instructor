"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageSquarePlus, TicketX, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { getTicketStatusBadge } from "./statusBadge";
import { NewTicketModal } from "./NewTicketModal";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

export default function SupportTicketsList({
  initialData,
  totalItems,
  currentPage,
  limit,
  error,
  openNewTicketOnLoad,
  initialSubject,
  initialMessage,
}: {
  initialData: Ticket[];
  totalItems: number;
  currentPage: number;
  limit: number;
  error: string | null;
  openNewTicketOnLoad?: boolean;
  initialSubject?: string;
  initialMessage?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(Boolean(openNewTicketOnLoad));

  const NewTicketButton = (
    <button
      onClick={() => setModalOpen(true)}
      className="inline-flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors shadow-lg shadow-[#2D6A4F]/20"
    >
      <MessageSquarePlus className="w-4 h-4" />
      New Ticket
    </button>
  );

  if (error) {
    return (
      <>
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400">
          <p className="font-semibold text-sm">{error}</p>
        </div>
        <NewTicketModal
          key={`${initialSubject || ""}:${initialMessage || ""}`}
          isOpen={modalOpen}
          onOpenChange={setModalOpen}
          initialSubject={initialSubject}
          initialMessage={initialMessage}
        />
      </>
    );
  }

  if (!initialData || initialData.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center gap-6">
          <EmptyState
            icon={TicketX}
            title="No support tickets yet"
            description="Have a question or ran into an issue? Open a ticket and chat live with our Support Desk team."
          />
          {NewTicketButton}
        </div>
        <NewTicketModal
          key={`${initialSubject || ""}:${initialMessage || ""}`}
          isOpen={modalOpen}
          onOpenChange={setModalOpen}
          initialSubject={initialSubject}
          initialMessage={initialMessage}
        />
      </>
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
      <div className="flex justify-end">{NewTicketButton}</div>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
        {/* Mobile Cards View */}
        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
          {initialData.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => router.push(`/dashboard/support-tickets/${ticket.id}`)}
              className="text-left flex flex-col gap-3 p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:border-[#2D6A4F]/40 transition-colors"
            >
              <div className="flex justify-between items-start gap-3">
                <span className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
                  {ticket.subject}
                </span>
                {getTicketStatusBadge(ticket.status)}
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex flex-col">
                  <span className="text-[0.65rem] uppercase font-bold text-gray-400 tracking-wider mb-1">
                    Opened
                  </span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {formatDate(ticket.created_at)}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Opened
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {initialData.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => router.push(`/dashboard/support-tickets/${ticket.id}`)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150 cursor-pointer"
                >
                  <td className="px-6 py-5">
                    <Link
                      href={`/dashboard/support-tickets/${ticket.id}`}
                      className="text-sm font-bold text-gray-900 dark:text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2"
                    >
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {formatDate(ticket.created_at)}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {getTicketStatusBadge(ticket.status)}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right">
                    <ChevronRight className="w-5 h-5 text-gray-400 inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
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
            tickets
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

      <NewTicketModal
        key={`${initialSubject || ""}:${initialMessage || ""}`}
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        initialSubject={initialSubject}
        initialMessage={initialMessage}
      />
    </div>
  );
}
