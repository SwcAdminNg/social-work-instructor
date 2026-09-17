import { fetchApi } from "@/lib/fetchApi";
import OrdersList from "./OrdersList";
import PaymentMethodsPanel from "./PaymentMethodsPanel";

export default async function OrdersContainer({
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

  let transactions = [];
  let totalItems = 0;
  let error = null;

  try {
    const res = await fetchApi(
      `/payments/transactions/me?page=${page}&page_size=${limit}`,
      {
        next: { revalidate: 0 },
      },
    );

    if (!res.ok) {
      throw new Error("Failed to fetch transactions");
    }

    const json = await res.json().catch(() => ({}));
    if (json && json.data) {
      transactions = json.data;
      totalItems = json.meta?.total_items || 0;
    }
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "An error occurred while fetching your orders.";
  }

  return (
    <div className="w-full h-full max-w-8xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Payment & Billing
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage saved cards, course purchases, and subscription payments.
        </p>
      </div>

      <PaymentMethodsPanel />

      <div className="mb-4">
        <h2 className="text-lg font-black text-gray-900 dark:text-white">
          Order history
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Receipts and transaction updates from your account.
        </p>
      </div>

      <OrdersList
        initialData={transactions}
        totalItems={totalItems}
        currentPage={page}
        limit={limit}
        error={error}
      />
    </div>
  );
}
