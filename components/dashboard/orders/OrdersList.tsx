"use client";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconReceipt } from "@/components/dashboard/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { ReceiptDownloadButton } from "./ReceiptDownloadButton";
import { formatNaira } from "@/lib/paymentTax";

type Transaction = {
  id: string;
  amount: number;
  reference: string;
  gateway: string;
  status: string;
  transaction_type: string;
  created_at: string;
  subtotal_amount?: number | null;
  discount_amount?: number | null;
  tax_rate?: number | null;
  tax_amount?: number | null;
};

export default function OrdersList({
  initialData,
  totalItems,
  currentPage,
  limit,
  error,
}: {
  initialData: Transaction[];
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
        icon={IconReceipt}
        title="No orders yet"
        description="Your course purchases and payment receipts will be listed here."
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

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return (
          <span className="inline-flex max-w-full items-center justify-center rounded-full border border-green-200 bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700 dark:border-green-800/50 dark:bg-green-900/30 dark:text-green-400">
            Successful
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex max-w-full items-center justify-center rounded-full border border-yellow-200 bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-700 dark:border-yellow-800/50 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pending
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex max-w-full items-center justify-center rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-400">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex max-w-full items-center justify-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
        {/* Mobile Cards View */}
        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
          {initialData.map((txn) => (
            <div
              key={txn.id}
              className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="grid min-w-0 gap-3">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <span className="min-w-0 break-words text-sm font-bold text-gray-900 dark:text-white">
                    {formatTransactionType(txn.transaction_type)}
                  </span>
                  <div className="flex-shrink-0">{getStatusBadge(txn.status)}</div>
                </div>

                <div className="min-w-0 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-950/50">
                  <span className="block text-[0.65rem] font-bold uppercase text-gray-400">
                    Reference
                  </span>
                  <span className="mt-1 block break-all font-mono text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {txn.reference}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 dark:border-gray-800 min-[380px]:grid-cols-2">
                <div className="min-w-0">
                  <span className="mb-1 block text-[0.65rem] font-bold uppercase text-gray-400">
                    Date
                  </span>
                  <span className="block text-sm font-medium leading-5 text-gray-600 dark:text-gray-300">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    }).format(new Date(txn.created_at))}
                  </span>
                </div>
                <div className="min-w-0 min-[380px]:text-right">
                  <span className="mb-1 block text-[0.65rem] font-bold uppercase text-gray-400">
                    Amount
                  </span>
                  <span className="block break-words text-lg font-bold text-gray-900 dark:text-white">
                    {formatNaira(txn.amount, 2)}
                  </span>
                  {hasDiscount(txn) && (
                    <span className="mt-1 block text-xs font-semibold text-[#0f8a46] dark:text-[#8de5b5]">
                      Saved {formatNaira(Number(txn.discount_amount))}
                    </span>
                  )}
                  {hasTax(txn) && (
                    <span className="mt-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                      VAT {formatNaira(Number(txn.tax_amount))}
                    </span>
                  )}
                </div>
              </div>
              {canDownloadReceipt(txn) && (
                <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <ReceiptDownloadButton reference={txn.reference} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {initialData.map((txn) => (
                <tr
                  key={txn.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150"
                >
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatTransactionType(txn.transaction_type)}
                      </span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                        Ref: {txn.reference}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      }).format(new Date(txn.created_at))}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatNaira(txn.amount, 2)}
                    </span>
                    {hasDiscount(txn) && (
                      <span className="ml-2 text-xs font-bold text-[#0f8a46] dark:text-[#8de5b5]">
                        -{formatNaira(Number(txn.discount_amount))}
                      </span>
                    )}
                    {hasTax(txn) && (
                      <span className="ml-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                        VAT {formatNaira(Number(txn.tax_amount))}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {getStatusBadge(txn.status)}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {canDownloadReceipt(txn) ? (
                      <ReceiptDownloadButton reference={txn.reference} />
                    ) : (
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                        Not available
                      </span>
                    )}
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
            orders
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

function canDownloadReceipt(txn: Transaction) {
  const type = txn.transaction_type?.toUpperCase();
  return (
    (type === "COURSE_PURCHASE" || type === "CART_PURCHASE") &&
    txn.status?.toUpperCase() === "SUCCESS"
  );
}

function formatTransactionType(type: string) {
  if (type?.toUpperCase() === "CART_PURCHASE") return "Cart purchase";
  if (type?.toUpperCase() === "COURSE_PURCHASE") return "Course purchase";
  return type?.replace(/_/g, " ") || "Transaction";
}

function hasDiscount(txn: Transaction) {
  return Number(txn.discount_amount || 0) > 0;
}

function hasTax(txn: Transaction) {
  return Number(txn.tax_amount || 0) > 0;
}
