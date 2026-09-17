"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { estimateTotalWithTax, formatNaira } from "@/lib/paymentTax";

export type CartItem = {
  course_id: string;
  course_title: string;
  course_slug: string;
  course_thumbnail_url?: string | null;
  price: number;
  added_at?: string | null;
};

export type CartRead = {
  items: CartItem[];
  item_count: number;
  subtotal_amount: number;
};

type CouponPreview = {
  valid: boolean;
  code: string;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
};

type CartContainerProps = {
  initialCart: CartRead;
  initialError?: string | null;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop";

export default function CartContainer({
  initialCart,
  initialError,
}: CartContainerProps) {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);
  const [error, setError] = useState(initialError || "");
  const [couponError, setCouponError] = useState("");
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [saveCard, setSaveCard] = useState(false);

  const hasItems = cart.items.length > 0;
  const discountAmount = coupon?.discount_amount ?? 0;
  const paymentEstimate = estimateTotalWithTax(
    cart.subtotal_amount,
    discountAmount,
  );
  const appliedCouponCode = coupon?.code || "";

  const sortedItems = useMemo(
    () =>
      [...cart.items].sort((a, b) =>
        String(a.added_at || "").localeCompare(String(b.added_at || "")),
      ),
    [cart.items],
  );

  async function removeItem(courseId: string) {
    setPendingCourseId(courseId);
    setError("");
    try {
      const res = await fetch(`/api/proxy/cart/items/${courseId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.message || "Unable to remove item.");

      setCart(normalizeCart(data?.data));
      setCoupon(null);
      setCouponError("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove item.");
    } finally {
      setPendingCourseId(null);
    }
  }

  async function clearCart() {
    setClearing(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/cart", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.message || "Unable to clear cart.");

      setCart({ items: [], item_count: 0, subtotal_amount: 0 });
      setCoupon(null);
      setCouponCode("");
      setCouponError("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to clear cart.");
    } finally {
      setClearing(false);
    }
  }

  async function validateCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = couponCode.trim();
    if (!code) {
      setCoupon(null);
      setCouponError("Enter a coupon code first.");
      return;
    }

    setValidating(true);
    setCouponError("");
    setError("");

    try {
      const res = await fetch("/api/proxy/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
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
      setValidating(false);
    }
  }

  async function checkout() {
    setCheckingOut(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coupon_code: appliedCouponCode || undefined,
          gateway: "PAYSTACK",
          save_card: saveCard,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.data?.authorization_url) {
        throw new Error(data?.message || "Unable to initialize checkout.");
      }

      window.location.href = data.data.authorization_url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to initialize checkout.",
      );
      setCheckingOut(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Cart
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Review selected courses, apply a coupon, and complete checkout in
            one Paystack payment.
          </p>
        </div>
        <Link
          href="/dashboard/course-catalogue"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#b7e4c7] bg-white px-4 text-sm font-bold text-[#2D6A4F] no-underline shadow-sm transition hover:bg-[#f0fbf5] dark:border-[#315244] dark:bg-[#13231d] dark:text-[#b7e4c7] dark:hover:bg-[#183026]"
        >
          <ShoppingBag className="h-4 w-4" />
          Browse courses
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      )}

      {hasItems ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-3">
            {sortedItems.map((item) => (
              <article
                key={item.course_id}
                className="grid gap-4 rounded-lg border border-[#dceee4] bg-white p-3 shadow-sm dark:border-[#27433a] dark:bg-[#111525] sm:grid-cols-[160px_minmax(0,1fr)]"
              >
                <Link
                  href={`/dashboard/course-catalogue/${item.course_slug}`}
                  className="aspect-video overflow-hidden rounded-md bg-[#e7f6ee] sm:aspect-[4/3]"
                >
                  <img
                    src={item.course_thumbnail_url || FALLBACK_IMAGE}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </Link>
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                      <Link
                        href={`/dashboard/course-catalogue/${item.course_slug}`}
                        className="no-underline hover:text-[#2D6A4F] dark:hover:text-[#b7e4c7]"
                      >
                        {item.course_title}
                      </Link>
                    </h2>
                    <p className="mt-1 text-sm font-bold text-[#2D6A4F] dark:text-[#b7e4c7]">
                      {formatNaira(item.price)}
                    </p>
                    {item.added_at && (
                      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        Added {formatDate(item.added_at)}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.course_id)}
                    disabled={pendingCourseId === item.course_id}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/30 dark:bg-[#111525] dark:text-red-300 dark:hover:bg-red-500/10"
                  >
                    {pendingCourseId === item.course_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="grid h-max gap-4 xl:sticky xl:top-[92px]">
            <div className="rounded-lg border border-[#dceee4] bg-white p-4 shadow-sm dark:border-[#27433a] dark:bg-[#111525]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  Order summary
                </h2>
                <span className="rounded-md bg-[#e7f6ee] px-2.5 py-1 text-xs font-black text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
                  {cart.item_count} {cart.item_count === 1 ? "item" : "items"}
                </span>
              </div>

              <dl className="grid gap-3 text-sm">
                <SummaryRow label="Subtotal" value={formatNaira(cart.subtotal_amount)} />
                {discountAmount > 0 && (
                  <SummaryRow
                    label={`Coupon ${appliedCouponCode}`}
                    value={`-${formatNaira(discountAmount)}`}
                    tone="discount"
                  />
                )}
                <SummaryRow
                  label="VAT (7.5%)"
                  value={formatNaira(paymentEstimate.taxAmount)}
                />
                <div className="border-t border-[#e6f2eb] pt-3 dark:border-[#27433a]">
                  <SummaryRow
                    label="Total"
                    value={formatNaira(paymentEstimate.totalWithTax)}
                    strong
                  />
                </div>
              </dl>

              <form onSubmit={validateCoupon} className="mt-5 grid gap-2">
                <label className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Coupon code
                </label>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                    className="h-11 min-w-0 flex-1 rounded-md border border-[#dceee4] bg-white px-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#2D6A4F] focus:ring-4 focus:ring-[#2D6A4F]/10 dark:border-[#27433a] dark:bg-[#0f1726] dark:text-slate-100 dark:focus:border-[#52b788]"
                    placeholder="WELCOME20"
                  />
                  <button
                    type="submit"
                    disabled={validating}
                    className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-[#2D6A4F] text-white transition hover:bg-[#1B4332] disabled:opacity-60 dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
                    aria-label="Apply coupon"
                  >
                    {validating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Tag className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {coupon && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoupon(null);
                      setCouponCode("");
                      setCouponError("");
                    }}
                    className="inline-flex w-max items-center gap-1 text-xs font-bold text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove coupon
                  </button>
                )}
                {couponError && (
                  <p className="rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-100">
                    {couponError}
                  </p>
                )}
              </form>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-[#dceee4] bg-[#f7fcf9] p-3 dark:border-[#27433a] dark:bg-[#13231d]">
                <input
                  type="checkbox"
                  checked={saveCard}
                  onChange={(event) => setSaveCard(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#2D6A4F] focus:ring-[#2D6A4F]"
                />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  <span className="block font-bold text-slate-900 dark:text-white">
                    Save this card
                  </span>
                  Keep the new Paystack card for future payments.
                </span>
              </label>

              <button
                type="button"
                onClick={checkout}
                disabled={checkingOut}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-5 text-sm font-extrabold text-white shadow-[0_16px_32px_-20px_rgba(45,106,79,0.95)] transition hover:bg-[#1B4332] disabled:opacity-60 dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
              >
                {checkingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                {checkingOut ? "Starting checkout..." : "Checkout"}
              </button>

              <button
                type="button"
                onClick={clearCart}
                disabled={clearing || checkingOut}
                className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-[#111525] dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Clear cart
              </button>
            </div>
          </aside>
        </section>
      ) : (
        <div className="rounded-lg border border-dashed border-[#cfe8da] bg-white px-6 py-16 text-center dark:border-[#27433a] dark:bg-[#111525]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-[#e7f6ee] text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
            <ShoppingCart className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
            Your cart is empty
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
            Add paid courses from the catalogue, then return here to apply a
            coupon and check out.
          </p>
          <Link
            href="/dashboard/course-catalogue"
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-4 text-sm font-bold text-white no-underline transition hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
          >
            Browse courses
          </Link>
        </div>
      )}
    </div>
  );
}

function SummaryRow({
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
            ? "text-base font-black text-slate-950 dark:text-white"
            : "font-medium text-slate-500 dark:text-slate-400"
        }
      >
        {label}
      </dt>
      <dd
        className={
          strong
            ? "text-xl font-black text-slate-950 dark:text-white"
            : tone === "discount"
              ? "font-extrabold text-[#0f8a46] dark:text-[#8de5b5]"
              : "font-extrabold text-slate-950 dark:text-white"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function normalizeCart(value: unknown): CartRead {
  const data = value && typeof value === "object" ? (value as Partial<CartRead>) : {};
  return {
    items: Array.isArray(data.items) ? data.items : [],
    item_count:
      typeof data.item_count === "number" ? data.item_count : data.items?.length ?? 0,
    subtotal_amount:
      typeof data.subtotal_amount === "number" ? data.subtotal_amount : 0,
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
