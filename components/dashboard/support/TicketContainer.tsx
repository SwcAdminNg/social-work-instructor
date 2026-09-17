import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { fetchApi } from "@/lib/fetchApi";
import TicketChat from "./TicketChat";

export default async function TicketContainer({
  ticketId,
}: {
  ticketId: string;
}) {
  let ticket = null;
  let messages = [];
  let error: string | null = null;

  try {
    const res = await fetchApi(`/support/tickets/${ticketId}`, {
      next: { revalidate: 0 },
    });

    if (res.status === 404) {
      error = "This ticket doesn't exist or you don't have access to it.";
    } else if (!res.ok) {
      throw new Error("Failed to fetch ticket");
    } else {
      const json = await res.json().catch(() => ({}));
      ticket = json?.data || null;
    }

    if (ticket) {
      const msgRes = await fetchApi(
        `/support/tickets/${ticketId}/messages?page=1&page_size=50`,
        { next: { revalidate: 0 } },
      );
      if (msgRes.ok) {
        const msgJson = await msgRes.json().catch(() => ({}));
        messages = msgJson?.data || [];
      }
    }
  } catch (err: any) {
    error = err.message || "An error occurred while loading this ticket.";
  }

  return (
    <div className="w-full h-full max-w-5xl mx-auto py-8 flex flex-col gap-4">
      <Link
        href="/dashboard/support-tickets"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors w-fit"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to my tickets
      </Link>

      {error || !ticket ? (
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400">
          <p className="font-semibold text-sm">
            {error || "This ticket could not be found."}
          </p>
        </div>
      ) : (
        <TicketChat ticketId={ticketId} initialTicket={ticket} initialMessages={messages} />
      )}
    </div>
  );
}
