"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, ShoppingCart, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { SavedCard } from "@/components/payments/SavedCardDisplay";
import { estimateTotalWithTax, formatNaira } from "@/lib/paymentTax";

type CourseDetailActionProps = {
  courseId: string;
  slug: string;
  isFree: boolean;
  price?: number | null;
  isEnrolled: boolean;
  hasAccess: boolean;
  isCompleted?: boolean;
  hideHelperText?: boolean;
};

type CouponPreview = {
  valid: boolean;
  code: string;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
};

export function CourseDetailAction({
  courseId,
  slug,
  isFree,
  price,
  isEnrolled,
  hasAccess,
  isCompleted = false,
  hideHelperText = false,
}: CourseDetailActionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("NEW");
  const [saveNewCard, setSaveNewCard] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const canViewCourse = isEnrolled || hasAccess || isCompleted;
  const appliedCouponCode = coupon?.code || "";
  const discountAmount = coupon?.discount_amount ?? 0;
  const checkoutEstimate =
    typeof price === "number" ? estimateTotalWithTax(price, discountAmount) : null;
  const checkoutTotalLabel =
    checkoutEstimate ? formatNaira(checkoutEstimate.totalWithTax) : "Premium";

  async function handleAction() {
    if (canViewCourse) {
      router.push(`/learn/${courseId}`);
      return;
    }

    if (!isFree && !hasAccess) {
      setShowPaymentModal(true);
      setError("");
      setCouponError("");
      if (savedCards.length === 0) {
        setCardsLoading(true);
        try {
          const res = await fetch("/api/proxy/payments/cards");
          const data = await res.json().catch(() => ({}));
          if (res.ok && Array.isArray(data.data) && data.data.length > 0) {
            setSavedCards(data.data);
            setSelectedCardId(data.data[0].id);
          }
        } catch {
          // Payment can continue with a new card if this fetch fails.
        } finally {
          setCardsLoading(false);
        }
      }
      return;
    }

    await executeEnrollment();
  }

  async function addToCart() {
    setCartLoading(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.push(
          `/login?callbackUrl=${encodeURIComponent(`/dashboard/course-catalogue/${slug}`)}`,
        );
        return;
      }

      if (!res.ok) {
        throw new Error(data?.message || "Unable to add this course to cart.");
      }

      toast.success("Course added to cart");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to add this course to cart.";
      setError(message);
      toast.error(message);
    } finally {
      setCartLoading(false);
    }
  }

  async function applyCoupon() {
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
  }

  async function executeEnrollment() {
    setLoading(true);
    setError("");
    setShowPaymentModal(false);

    try {
      const enrollRes = await fetch(`/api/proxy/learning/courses/${courseId}/enroll`, {
        method: "POST",
      });
      const enrollData = await enrollRes.json().catch(() => ({}));

      if (enrollRes.status === 401) {
        router.push(
          `/login?callbackUrl=${encodeURIComponent(`/dashboard/course-catalogue/${slug}`)}`,
        );
        return;
      }

      if (enrollRes.ok || isFree) {
        router.push(`/learn/${courseId}`);
        return;
      }

      if (enrollRes.status !== 402) {
        throw new Error(enrollData?.message || "Unable to enroll right now.");
      }

      if (selectedCardId && selectedCardId !== "NEW" && !appliedCouponCode) {
        const chargeRes = await fetch("/api/proxy/payments/charge-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            card_id: selectedCardId,
            transaction_type: "COURSE_PURCHASE",
            related_id: courseId,
          }),
        });
        const chargeData = await chargeRes.json().catch(() => ({}));

        if (!chargeRes.ok) {
          throw new Error(chargeData?.message || "Failed to charge saved card.");
        }
        if (chargeData.data?.status && chargeData.data.status !== "SUCCESS") {
          throw new Error(
            chargeData?.message ||
              "The saved card could not be charged. Please try another card.",
          );
        }

        router.push(`/learn/${courseId}`);
        return;
      }

      const paymentRes = await fetch("/api/proxy/payments/initialize", {
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
      const paymentData = await paymentRes.json().catch(() => ({}));

      if (!paymentRes.ok || !paymentData?.data?.authorization_url) {
        throw new Error(paymentData?.message || "Unable to initialize payment.");
      }

      window.location.href = paymentData.data.authorization_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid gap-2">
      <button
        type="button"
        onClick={handleAction}
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-5 text-sm font-extrabold text-white shadow-[0_16px_32px_-20px_rgba(45,106,79,0.95)] transition hover:bg-[#1B4332] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
        {loading ? "Processing..." : canViewCourse ? "View Course" : "Enroll"}
      </button>
      {!canViewCourse && !isFree && (
        <button
          type="button"
          onClick={addToCart}
          disabled={loading || cartLoading}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#b7e4c7] bg-white px-4 text-sm font-extrabold text-[#2D6A4F] transition hover:bg-[#f0fbf5] disabled:cursor-not-allowed disabled:opacity-70 dark:border-[#315244] dark:bg-[#13231d] dark:text-[#b7e4c7] dark:hover:bg-[#183026]"
        >
          {cartLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          {cartLoading ? "Adding..." : "Add to cart"}
        </button>
      )}
      {!hideHelperText && !canViewCourse && !isFree && typeof price === "number" && (
        <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400">
          Secure checkout for paid enrollment.
        </p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}
      </div>

      {showPaymentModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl border border-gray-100 bg-white p-4 shadow-2xl dark:border-gray-800 dark:bg-gray-950 sm:max-w-xl sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-normal text-[#2D6A4F] dark:text-[#95d5b2]">
                  Secure checkout
                </p>
                <h3 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">
                  Choose how to pay
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  Complete your course enrollment with a saved card or Paystack checkout.
                </p>
              </div>
              {typeof price === "number" && (
                <div className="rounded-lg bg-[#f1fbf6] px-4 py-3 dark:bg-[#10261c] sm:text-right">
                  <p className="text-xs font-bold uppercase text-[#2D6A4F] dark:text-[#95d5b2]">
                    Total
                  </p>
                  <p className="text-xl font-black text-[#173f2d] dark:text-[#d8f3dc]">
                    {checkoutTotalLabel}
                  </p>
                </div>
              )}
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
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#2D6A4F] dark:text-[#52b788]" />
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

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                disabled={loading}
                className="flex-1 rounded-md bg-gray-100 px-4 py-3 text-sm font-extrabold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeEnrollment}
                disabled={loading || cardsLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-4 py-3 text-sm font-extrabold text-white shadow-[0_16px_32px_-20px_rgba(45,106,79,0.95)] transition hover:bg-[#1B4332] disabled:opacity-60 dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
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
