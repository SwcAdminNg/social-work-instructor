"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { IconSpinner } from "@/components/auth/shared/icons";
import Link from "next/link";
import { ReceiptDownloadButton } from "@/components/dashboard/orders/ReceiptDownloadButton";

export default function PaymentVerifier() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const hasVerified = useRef(false);

  const verifyPayment = useCallback(async () => {
    if (!reference) {
      setStatus("error");
      setErrorMessage("No payment reference found in the URL.");
      return;
    }

    setStatus("verifying");
    setErrorMessage("");

    try {
      const res = await fetch(`/api/proxy/payments/verify/${reference}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to verify payment. The transaction might still be processing.");
      }

      setStatus("success");
    } catch (err) {
      console.error("Payment verification failed:", err);
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to verify payment.",
      );
    }
  }, [reference]);

  useEffect(() => {
    if (reference && !hasVerified.current) {
      hasVerified.current = true;
      verifyPayment();
    }
  }, [reference, verifyPayment]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-center">
        {status === "verifying" && (
          <div role="status" aria-live="polite" className="flex flex-col items-center py-8">
            <IconSpinner className="w-12 h-12 text-[#2D6A4F] animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verifying Payment</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Please wait while we confirm your transaction with Paystack. This should only take a moment.
            </p>
          </div>
        )}

        {status === "success" && (
          <div role="status" aria-live="polite" className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Your transaction was verified successfully. You now have access to your purchase.
            </p>
            {reference && (
              <div className="mb-4 w-full">
                <ReceiptDownloadButton reference={reference} />
              </div>
            )}
            <Link
              href="/dashboard/courses"
              className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-[#2D6A4F] hover:bg-[#1B4332] transition-colors shadow-lg shadow-[#2D6A4F]/20"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === "error" && (
          <div role="alert" aria-live="assertive" className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verification Failed</h2>
            <p className="text-red-500 font-medium mb-6">
              {errorMessage}
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={verifyPayment}
                className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:opacity-90 transition-opacity shadow-lg"
              >
                Verify Payment Again
              </button>
              <Link
                href="/dashboard/courses"
                className="w-full py-4 px-6 rounded-2xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
