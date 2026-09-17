"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { IconSpinner } from "@/components/auth/shared/icons";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { SavedCard } from "@/components/payments/SavedCardDisplay";
import { Loader2, Tag, X } from "lucide-react";
import { estimateTotalWithTax, formatNaira } from "@/lib/paymentTax";

interface EnrollButtonProps {
  courseId: string;
  isEnrolled: boolean;
  isFree: boolean;
  price?: number;
  hasAccess?: boolean;
  isCompleted?: boolean;
  compact?: boolean;
}

type CouponPreview = {
  valid: boolean;
  code: string;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
};

export function EnrollButton({
  courseId,
  isEnrolled,
  isFree,
  price,
  hasAccess,
  isCompleted,
  compact = false,
}: EnrollButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("NEW");
  const [saveNewCard, setSaveNewCard] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const router = useRouter();
  const appliedCouponCode = coupon?.code || "";
  const discountAmount = coupon?.discount_amount ?? 0;
  const checkoutEstimate =
    typeof price === "number" ? estimateTotalWithTax(price, discountAmount) : null;
  const checkoutTotalLabel =
    checkoutEstimate ? formatNaira(checkoutEstimate.totalWithTax) : "...";

  if (isEnrolled || hasAccess || isCompleted) {
    return (
      <button
        onClick={() => router.push(`/learn/${courseId}`)}
        className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-[#2D6A4F] hover:bg-[#1B4332] dark:bg-[#52b788] dark:hover:bg-[#40916c] transition-colors shadow-lg shadow-[#2D6A4F]/20"
      >
        View Course
      </button>
    );
  }

  const handleEnrollClick = async () => {
    if (isFree || hasAccess) {
      executeEnrollment();
    } else {
      setShowModal(true);
      setCouponError("");
      if (savedCards.length === 0) {
        setCardsLoading(true);
        try {
          const res = await fetch("/api/proxy/payments/cards");
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.data?.length > 0) {
            setSavedCards(data.data);
            setSelectedCardId(data.data[0].id);
          }
        } catch {
          // ignore
        } finally {
          setCardsLoading(false);
        }
      }
    }
  };

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      setCoupon(null);
      setCouponError("Enter a coupon code first.");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const res = await fetch("/api/proxy/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, course_ids: [courseId] }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.data?.valid) {
        throw new Error(data?.message || "Coupon could not be applied.");
      }

      setCoupon(data.data);
      setCouponCode(data.data.code || code);
    } catch (err) {
      setCoupon(null);
      setCouponError(
        err instanceof Error ? err.message : "Coupon could not be applied.",
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const executeEnrollment = async () => {
    setLoading(true);
    setError("");
    setShowModal(false);

    try {
      const res = await fetch(
        `/api/proxy/learning/courses/${courseId}/enroll`,
        {
          method: "POST",
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          router.push(
            "/login?callbackUrl=" + encodeURIComponent(window.location.href),
          );
          return;
        }

        if (res.status === 402) {
          if (selectedCardId && selectedCardId !== "NEW" && !appliedCouponCode) {
            const chargeRes = await fetch(`/api/proxy/payments/charge-card`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                card_id: selectedCardId,
                transaction_type: "COURSE_PURCHASE",
                related_id: courseId,
              }),
            });
            const chargeData = await chargeRes.json().catch(() => ({}));
            if (!chargeRes.ok)
              throw new Error(
                chargeData.message || "Failed to charge saved card.",
              );
            if (chargeData.data?.status && chargeData.data.status !== "SUCCESS") {
              throw new Error(
                chargeData.message ||
                  "The saved card could not be charged. Please try another card.",
              );
            }

            router.push(`/learn/${courseId}`);
            return;
          } else {
            const initRes = await fetch(`/api/proxy/payments/initialize`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                transaction_type: "COURSE_PURCHASE",
                related_id: courseId,
                gateway: "PAYSTACK",
                save_card: saveNewCard,
                coupon_code: appliedCouponCode || undefined,
              }),
            });

            const initData = await initRes.json().catch(() => ({}));
            if (!initRes.ok)
              throw new Error(
                initData.message || "Failed to initialize payment.",
              );

            if (initData.data?.authorization_url) {
              window.location.href = initData.data.authorization_url;
              return;
            }
          }
        }

        throw new Error(data.message || "Failed to enroll. Please try again.");
      }

      router.push(`/learn/${courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <button
          onClick={handleEnrollClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-white bg-[#2D6A4F] hover:bg-[#1B4332] dark:bg-[#52b788] dark:hover:bg-[#40916c] transition-colors shadow-lg shadow-[#2D6A4F]/20 disabled:opacity-70"
        >
          {loading ? <IconSpinner className="w-5 h-5 animate-spin" /> : null}
          {loading
            ? "Processing..."
            : isFree
              ? compact
                ? "Enroll free"
                : "Enroll for Free"
              : hasAccess
                ? "Enroll Now"
                : compact
                  ? "Enroll now"
                  : `Buy for ${
                      typeof price === "number"
                        ? formatNaira(estimateTotalWithTax(price).totalWithTax)
                        : "..."
                    }`}
        </button>
        {error && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400 text-center">
            {error}
          </p>
        )}
      </div>

      {showModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl border border-gray-100 bg-white p-4 shadow-2xl transition-all dark:border-gray-800 dark:bg-gray-950 sm:max-w-xl sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-normal text-[#2D6A4F] dark:text-[#95d5b2]">
                  Secure checkout
                </p>
                <h3 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">
                  Choose how to pay
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  Complete your course purchase for{" "}
                  <span className="font-extrabold text-gray-900 dark:text-white">
                    {checkoutTotalLabel}
                  </span>
                  .
                </p>
              </div>
              <div className="rounded-lg bg-[#f1fbf6] px-4 py-3 text-left dark:bg-[#10261c] sm:text-right">
                <p className="text-xs font-bold uppercase text-[#2D6A4F] dark:text-[#95d5b2]">
                  Total
                </p>
                <p className="text-xl font-black text-[#173f2d] dark:text-[#d8f3dc]">
                  {checkoutTotalLabel}
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-lg border border-[#dceee4] bg-[#f7fcf9] p-3 dark:border-[#27433a] dark:bg-[#13231d]">
              {checkoutEstimate && (
                <dl className="mb-4 grid gap-2 border-b border-[#dceee4] pb-4 text-sm dark:border-[#27433a]">
                  <CheckoutRow label="Subtotal" value={formatNaira(price || 0)} />
                  {discountAmount > 0 && (
                    <CheckoutRow
                      label={`Coupon ${appliedCouponCode}`}
                      value={`-${formatNaira(discountAmount)}`}
                      tone="discount"
                    />
                  )}
                  <CheckoutRow
                    label="VAT (7.5%)"
                    value={formatNaira(checkoutEstimate.taxAmount)}
                  />
                  <CheckoutRow
                    label="Total"
                    value={formatNaira(checkoutEstimate.totalWithTax)}
                    strong
                  />
                </dl>
              )}
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="h-10 min-w-0 flex-1 rounded-md border border-[#dceee4] bg-white px-3 text-sm font-bold text-gray-900 outline-none transition focus:border-[#2D6A4F] focus:ring-4 focus:ring-[#2D6A4F]/10 dark:border-[#27433a] dark:bg-gray-950 dark:text-white dark:focus:border-[#52b788]"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading}
                  className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-[#2D6A4F] text-white transition hover:bg-[#1B4332] disabled:opacity-60 dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
                  aria-label="Apply coupon"
                >
                  {couponLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Tag className="h-4 w-4" />
                  )}
                </button>
              </div>
              {coupon && (
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold text-[#0f8a46] dark:text-[#8de5b5]">
                    {coupon.code} saves {formatNaira(coupon.discount_amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCoupon(null);
                      setCouponCode("");
                      setCouponError("");
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              )}
              {couponError && (
                <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-100">
                  {couponError}
                </p>
              )}
            </div>

            {cardsLoading ? (
              <div className="flex justify-center my-8">
                <IconSpinner className="w-6 h-6 animate-spin text-[#2D6A4F]" />
              </div>
            ) : (
              <div className="mb-6">
                <PaymentMethodSelector
                  cards={savedCards}
                  selectedCardId={selectedCardId}
                  saveNewCard={saveNewCard}
                  onSelectCard={setSelectedCardId}
                  onSaveNewCardChange={setSaveNewCard}
                />
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-md font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={executeEnrollment}
                disabled={loading || cardsLoading}
                className="flex-1 py-3 px-4 rounded-md font-bold text-white bg-[#2D6A4F] hover:bg-[#1B4332] transition-colors shadow-md shadow-[#2D6A4F]/20 disabled:opacity-60"
              >
                {loading ? "Processing..." : "Pay now"}
              </button>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}

function CheckoutRow({
  label,
  value,
  strong = false,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "discount";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt
        className={
          strong
            ? "font-black text-gray-950 dark:text-white"
            : "font-semibold text-gray-500 dark:text-gray-400"
        }
      >
        {label}
      </dt>
      <dd
        className={
          strong
            ? "text-base font-black text-gray-950 dark:text-white"
            : tone === "discount"
              ? "font-extrabold text-[#0f8a46] dark:text-[#8de5b5]"
              : "font-extrabold text-gray-900 dark:text-white"
        }
      >
        {value}
      </dd>
    </div>
  );
}
