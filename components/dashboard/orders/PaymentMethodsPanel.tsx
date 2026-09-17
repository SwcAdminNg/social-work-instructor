"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Trash2,
  X,
  WalletCards,
} from "lucide-react";
import {
  formatCardBrand,
  SavedCard,
  SavedCardDisplay,
} from "@/components/payments/SavedCardDisplay";

export default function PaymentMethodsPanel() {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionCardId, setActionCardId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showCards, setShowCards] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<SavedCard | null>(null);

  async function loadCards() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/proxy/payments/cards", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Unable to load saved cards.");
      }

      setCards(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load saved cards.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial client refresh keeps this panel in sync after Paystack redirects.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCards();
  }, []);

  async function setDefault(cardId: string) {
    setActionCardId(cardId);
    setError("");

    try {
      const res = await fetch(`/api/proxy/payments/cards/${cardId}/default`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Unable to update default card.");
      }

      await loadCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update default card.");
    } finally {
      setActionCardId(null);
    }
  }

  async function removeCard() {
    if (!cardToDelete) return;

    setActionCardId(cardToDelete.id);
    setError("");

    try {
      const res = await fetch(`/api/proxy/payments/cards/${cardToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Unable to remove saved card.");
      }

      await loadCards();
      setCardToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove saved card.");
    } finally {
      setActionCardId(null);
    }
  }

  const defaultCard = cards.find((card) => card.is_default) || cards[0];
  const cardCountLabel =
    cards.length === 1 ? "1 saved card" : `${cards.length} saved cards`;

  return (
    <>
      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-[#2D6A4F] text-white shadow-sm dark:bg-[#52b788] dark:text-[#06130d]">
              <WalletCards className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-black text-gray-950 dark:text-white">
                Payment methods
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                Saved cards are hidden by default and available for one-click payments.
              </p>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-md border border-[#b7e4c7] bg-[#f1fbf6] px-3 py-2 text-xs font-extrabold text-[#2D6A4F] dark:border-[#2f6f55] dark:bg-[#10261c] dark:text-[#95d5b2]">
            <ShieldCheck className="h-4 w-4" />
            Tokenized by Paystack
          </div>
        </div>
        </div>

        <div className="p-5 sm:p-6">
        {loading ? (
          <div className="flex min-h-[110px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#2D6A4F] dark:text-[#52b788]" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center dark:border-gray-700 dark:bg-gray-900/40 sm:flex-row sm:items-center sm:text-left">
            <span className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-white text-[#2D6A4F] shadow-sm dark:bg-gray-950 dark:text-[#52b788] sm:mx-0">
              <CreditCard className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-base font-black text-gray-950 dark:text-white">
                No saved cards yet
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                Cards appear here after a successful Paystack checkout where card saving is enabled.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5">
            <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/45 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-white text-[#2D6A4F] shadow-sm dark:bg-gray-950 dark:text-[#52b788]">
                  <CreditCard className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-black text-gray-950 dark:text-white">
                      {cardCountLabel}
                    </p>
                    {defaultCard && (
                      <span className="rounded-md bg-[#d8f3dc] px-2 py-1 text-[0.68rem] font-black uppercase text-[#1B4332] dark:bg-[#173326] dark:text-[#b7e4c7]">
                        Default: {formatCardBrand(defaultCard)} ••••{" "}
                        {defaultCard.last4 || "----"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Card details stay private until you choose to view and manage them.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCards((current) => !current)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-4 text-sm font-extrabold text-white transition hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
                aria-expanded={showCards}
              >
                {showCards ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {showCards ? "Hide cards" : "View cards"}
                <ChevronDown
                  className={`h-4 w-4 transition ${showCards ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {showCards && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => (
                  <SavedCardDisplay
                    key={card.id}
                    card={card}
                    disabled={actionCardId !== null}
                    actionLoading={actionCardId === card.id}
                    onSetDefault={() => setDefault(card.id)}
                    onDelete={() => setCardToDelete(card)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </section>

      {cardToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-card-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 dark:border-gray-800">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-300">
                  <Trash2 className="h-5 w-5" />
                </span>
                <div>
                  <h3
                    id="delete-card-title"
                    className="text-lg font-black text-gray-950 dark:text-white"
                  >
                    Remove saved card?
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    This card will no longer be available for one-click payments.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                disabled={actionCardId === cardToDelete.id}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-60 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white"
                aria-label="Close delete card dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 px-5 py-5">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-950 dark:text-white">
                      {formatCardBrand(cardToDelete)} ending in ••••{" "}
                      {cardToDelete.last4 || "----"}
                    </p>
                    <p className="mt-1 truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                      {cardToDelete.bank || cardToDelete.gateway || "Saved card"}
                    </p>
                  </div>
                  {cardToDelete.is_default && (
                    <span className="flex-shrink-0 rounded-md bg-[#d8f3dc] px-2 py-1 text-[0.68rem] font-black uppercase text-[#1B4332] dark:bg-[#173326] dark:text-[#b7e4c7]">
                      Default
                    </span>
                  )}
                </div>
              </div>

              {cardToDelete.is_default && cards.length > 1 && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                  Removing your default card will automatically make another saved card the default.
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                disabled={actionCardId === cardToDelete.id}
                className="inline-flex h-11 items-center justify-center rounded-md bg-gray-100 px-4 text-sm font-extrabold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Keep card
              </button>
              <button
                type="button"
                onClick={removeCard}
                disabled={actionCardId === cardToDelete.id}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-red-500 dark:text-white dark:hover:bg-red-600"
              >
                {actionCardId === cardToDelete.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {actionCardId === cardToDelete.id ? "Removing..." : "Remove card"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
