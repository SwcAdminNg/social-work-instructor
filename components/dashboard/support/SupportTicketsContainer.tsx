import { fetchApi } from "@/lib/fetchApi";
import SupportTicketsList from "./SupportTicketsList";

export default async function SupportTicketsContainer({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const page =
    typeof resolvedParams.page === "string"
      ? parseInt(resolvedParams.page, 10)
      : 1;
  const limit = 20;
  const openNewTicket = resolvedParams.new === "1";
  const initialSubject =
    typeof resolvedParams.subject === "string" ? resolvedParams.subject : "";
  const initialMessage =
    typeof resolvedParams.message === "string" ? resolvedParams.message : "";

  let tickets = [];
  let totalItems = 0;
  let error = null;

  try {
    const res = await fetchApi(
      `/support/tickets/mine?page=${page}&page_size=${limit}`,
      { next: { revalidate: 0 } },
    );

    if (!res.ok) {
      throw new Error("Failed to fetch support tickets");
    }

    const json = await res.json().catch(() => ({}));
    if (json && json.data) {
      tickets = json.data;
      totalItems = json.meta?.total_items || 0;
    }
  } catch (err: unknown) {
    error =
      err instanceof Error
        ? err.message
        : "An error occurred while fetching your support tickets.";
  }

  return (
    <div className="w-full h-full max-w-8xl mx-auto py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Support Tickets
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Browse your open and past support requests, or start a new one.
          </p>
        </div>
      </div>

      <SupportTicketsList
        initialData={tickets}
        totalItems={totalItems}
        currentPage={page}
        limit={limit}
        error={error}
        openNewTicketOnLoad={openNewTicket}
        initialSubject={initialSubject}
        initialMessage={initialMessage}
      />
    </div>
  );
}
