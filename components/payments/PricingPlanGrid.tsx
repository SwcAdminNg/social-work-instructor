"use client";

import { useState } from "react";
import { SubscriptionButton } from "./SubscriptionButton";
import { IconSpinner } from "@/components/auth/shared/icons";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { SavedCard } from "@/components/payments/SavedCardDisplay";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { estimateTotalWithTax, formatNaira } from "@/lib/paymentTax";

interface Plan {
  id: string;
  name: string;
  description: string;
  duration_days: number;
  price: number;
  is_free_trial: boolean;
  is_active: boolean;
}

interface PricingPlanGridProps {
  plans: Plan[];
  isLoggedIn: boolean;
  currentSubscription?: {
    is_active?: boolean;
    plan_id?: string;
    pending_plan_id?: string;
  } | null;
}

export function PricingPlanGrid({
  plans,
  isLoggedIn,
  currentSubscription,
}: PricingPlanGridProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    name: string;
    price: number;
  } | null>(null);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("NEW");
  const [saveNewCard, setSaveNewCard] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasActiveSubscription =
    !!currentSubscription && currentSubscription.is_active;
  const selectedPlanEstimate = selectedPlan
    ? estimateTotalWithTax(selectedPlan.price)
    : null;

  const handleSubscribeClick = async (
    planId: string,
    planName: string,
    price: number,
  ) => {
    setSelectedPlan({ id: planId, name: planName, price });
    setShowModal(true);

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
  };

  const executeSubscription = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    setError("");

    try {
      if (hasActiveSubscription) {
        // Handle Plan Change
        const res = await fetch(
          `/api/proxy/payments/subscriptions/change-plan`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ new_plan_id: selectedPlan.id }),
          },
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to change plan.");

        window.location.reload();
        return;
      } else {
        // Handle New Subscription
        if (selectedCardId && selectedCardId !== "NEW") {
          // 1-Click Checkout with saved card
          const chargeRes = await fetch(`/api/proxy/payments/charge-card`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              card_id: selectedCardId,
              transaction_type: "SUBSCRIPTION",
              related_id: selectedPlan.id,
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

          window.location.href =
            "/payment-confirmation?reference=" +
            (chargeData.data?.reference || "success");
          return;
        } else {
          // Initialize Paystack for a new card
          const initRes = await fetch(`/api/proxy/payments/initialize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transaction_type: "SUBSCRIPTION",
              related_id: selectedPlan.id,
              gateway: "PAYSTACK",
              save_card: saveNewCard,
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
          throw new Error("Failed to initialize payment. Please try again.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
        <p className="text-gray-500 dark:text-gray-400">
          No subscription plans available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-8xl mx-auto">
      {plans
        .filter((p) => p.is_active)
        .map((plan, idx) => {
          // Highlight the middle plan or the one with "Pro" in the name
          const isHighlighted =
            plan.name.toLowerCase().includes("pro") || idx === 1;

          const isCurrentPlan = currentSubscription?.plan_id === plan.id;
          const isPendingPlan =
            currentSubscription?.pending_plan_id === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col p-8 rounded-3xl transition-transform hover:-translate-y-2 ${
                isHighlighted
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-2xl shadow-gray-900/20 dark:shadow-white/10 border-2 border-gray-900 dark:border-white scale-105 z-10"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg"
              }`}
            >
              {isHighlighted && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="px-4 py-1 text-xs font-bold uppercase tracking-wider bg-[#2D6A4F] text-white rounded-full shadow-md">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3
                  className={`text-2xl font-bold mb-2 ${isHighlighted ? "text-white dark:text-gray-900" : "text-gray-900 dark:text-white"}`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm ${isHighlighted ? "text-gray-300 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {plan.description ||
                    "Get unlimited access to all standard courses."}
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-extrabold tracking-tight ${isHighlighted ? "text-white dark:text-gray-900" : "text-gray-900 dark:text-white"}`}
                  >
                    ₦{plan.price.toLocaleString()}
                  </span>
                  <span
                    className={`text-sm font-medium ${isHighlighted ? "text-gray-300 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    /{plan.duration_days} days
                  </span>
                </div>
                {plan.is_free_trial && (
                  <p className="mt-2 text-sm font-semibold text-[#2D6A4F] dark:text-[#52b788]">
                    Includes free trial
                  </p>
                )}
              </div>

              <div className="flex-1">
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isHighlighted ? "bg-[#2D6A4F]" : "bg-[#2D6A4F]"}`}
                    />
                    <span
                      className={`text-sm ${isHighlighted ? "text-gray-200 dark:text-gray-700" : "text-gray-600 dark:text-gray-400"}`}
                    >
                      Access to all standard courses
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isHighlighted ? "bg-[#2D6A4F]" : "bg-[#2D6A4F]"}`}
                    />
                    <span
                      className={`text-sm ${isHighlighted ? "text-gray-200 dark:text-gray-700" : "text-gray-600 dark:text-gray-400"}`}
                    >
                      Cancel anytime
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isHighlighted ? "bg-[#2D6A4F]" : "bg-[#2D6A4F]"}`}
                    />
                    <span
                      className={`text-sm ${isHighlighted ? "text-gray-200 dark:text-gray-700" : "text-gray-600 dark:text-gray-400"}`}
                    >
                      Certificate of completion
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-auto">
                <SubscriptionButton
                  planId={plan.id}
                  price={plan.price}
                  isLoggedIn={isLoggedIn}
                  planName={plan.name}
                  isHighlighted={isHighlighted}
                  isCurrentPlan={isCurrentPlan}
                  isPendingPlan={isPendingPlan}
                  hasActiveSubscription={hasActiveSubscription}
                  onSubscribeClick={() =>
                    handleSubscribeClick(plan.id, plan.name, plan.price)
                  }
                />
              </div>
            </div>
          );
        })}
      {/* Checkout / plan-change confirmation dialog, lifted to the root of PricingPlanGrid */}
      <Dialog.Root
        open={showModal && !!selectedPlan}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) setError("");
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/65 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-[10000] max-h-[94vh] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 dark:border-gray-800 dark:bg-gray-950 sm:p-6">
            {selectedPlan && (
              <>
                <div className="w-16 h-16 mx-auto bg-[#52b788]/10 text-[#52b788] rounded-full flex items-center justify-center mb-6">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div className="mb-6 text-center">
                  <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
                    {hasActiveSubscription
                      ? "Confirm Plan Change"
                      : "Choose how to pay"}
                  </Dialog.Title>
                  <Dialog.Description className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                    {hasActiveSubscription ? (
                      <>
                        Your plan will securely change to{" "}
                        <span className="font-bold text-gray-900 dark:text-white">
                          {selectedPlan.name}
                        </span>{" "}
                        at the end of your current billing cycle. You will be charged{" "}
                        <span className="font-bold text-[#52b788]">
                          {formatNaira(
                            selectedPlanEstimate?.totalWithTax ?? selectedPlan.price,
                          )}
                        </span>{" "}
                        upon renewal.
                      </>
                    ) : (
                      <>
                        Subscribe to{" "}
                        <span className="font-bold text-gray-900 dark:text-white">
                          {selectedPlan.name}
                        </span>{" "}
                        for{" "}
                        <span className="font-bold text-[#2D6A4F] dark:text-[#52b788]">
                          {formatNaira(
                            selectedPlanEstimate?.totalWithTax ?? selectedPlan.price,
                          )}
                        </span>
                        .
                      </>
                    )}
                  </Dialog.Description>
                </div>

                {selectedPlanEstimate && (
                  <dl className="mb-6 grid gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-900/70">
                    <PaymentSummaryRow
                      label="Subtotal"
                      value={formatNaira(selectedPlan.price)}
                    />
                    <PaymentSummaryRow
                      label="VAT (7.5%)"
                      value={formatNaira(selectedPlanEstimate.taxAmount)}
                    />
                    <PaymentSummaryRow
                      label="Total"
                      value={formatNaira(selectedPlanEstimate.totalWithTax)}
                      strong
                    />
                  </dl>
                )}

                {/* Saved Cards UI only if not changing an active subscription */}
                {!hasActiveSubscription && cardsLoading ? (
                  <div className="flex justify-center my-8">
                    <IconSpinner className="w-6 h-6 animate-spin text-[#52b788]" />
                  </div>
                ) : !hasActiveSubscription ? (
                  <div className="mb-8">
                    <PaymentMethodSelector
                      cards={savedCards}
                      selectedCardId={selectedCardId}
                      saveNewCard={saveNewCard}
                      onSelectCard={setSelectedCardId}
                      onSaveNewCardChange={setSaveNewCard}
                      accentClassName="text-[#52b788]"
                    />
                  </div>
                ) : null}

                {error && (
                  <p
                    role="alert"
                    aria-live="assertive"
                    className="text-sm font-medium text-red-600 dark:text-red-400 mb-4 text-center"
                  >
                    {error}
                  </p>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setError("");
                    }}
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeSubscription}
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-[#52b788] hover:bg-[#40916c] transition-colors shadow-md shadow-[#52b788]/20 flex items-center justify-center disabled:opacity-70"
                  >
                    {loading ? (
                      <IconSpinner className="w-5 h-5 animate-spin mr-2" />
                    ) : null}
                    Proceed
                  </button>
                </div>

                <Dialog.Close asChild>
                  <button
                    onClick={() => setError("")}
                    className="absolute right-4 top-4 rounded-sm p-2 opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:ring-offset-gray-950 text-gray-500 dark:text-gray-400"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </button>
                </Dialog.Close>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function PaymentSummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
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
            : "font-extrabold text-gray-900 dark:text-white"
        }
      >
        {value}
      </dd>
    </div>
  );
}
