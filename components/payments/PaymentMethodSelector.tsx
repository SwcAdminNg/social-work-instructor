"use client";

import { CheckCircle2, CreditCard, Plus, ShieldCheck } from "lucide-react";
import {
  formatCardBrand,
  SavedCard,
} from "@/components/payments/SavedCardDisplay";

type PaymentMethodSelectorProps = {
  cards: SavedCard[];
  selectedCardId: string;
  saveNewCard: boolean;
  onSelectCard: (cardId: string) => void;
  onSaveNewCardChange: (save: boolean) => void;
  accentClassName?: string;
};

export function PaymentMethodSelector({
  cards,
  selectedCardId,
  saveNewCard,
  onSelectCard,
  onSaveNewCardChange,
  accentClassName = "text-[#2D6A4F] dark:text-[#52b788]",
}: PaymentMethodSelectorProps) {
  const formatExpiry = (card: SavedCard) => {
    const month = String(card.exp_month || "").padStart(2, "0").slice(-2);
    const year = String(card.exp_year || "").slice(-2);
    if (!month && !year) return "No expiry";
    return `${month || "MM"}/${year || "YY"}`;
  };

  return (
    <div className="grid gap-4 text-left">
      {cards.length > 0 && (
        <div className="grid gap-3">
          <p className="text-sm font-extrabold text-gray-800 dark:text-gray-100">
            Saved cards
          </p>
          <div className="grid max-h-[38vh] gap-3 overflow-y-auto pr-1">
            {cards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelectCard(card.id)}
                className={`flex w-full min-w-0 items-center gap-3 rounded-lg border p-3 text-left transition sm:p-4 ${
                  selectedCardId === card.id
                    ? "border-[#52b788] bg-[#f1fbf6] shadow-sm dark:border-[#52b788] dark:bg-[#10261c]"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
                }`}
                aria-pressed={selectedCardId === card.id}
              >
                <span
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md ${
                    selectedCardId === card.id
                      ? "bg-[#d8f3dc] text-[#2D6A4F] dark:bg-[#173326] dark:text-[#95d5b2]"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300"
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-gray-950 dark:text-white">
                      {formatCardBrand(card)} ending in ••••{" "}
                      {card.last4 || "----"}
                    </span>
                    {card.is_default && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#d8f3dc] px-2 py-0.5 text-[0.65rem] font-black uppercase text-[#1B4332] dark:bg-[#173326] dark:text-[#b7e4c7]">
                        <CheckCircle2 className="h-3 w-3" />
                        Default
                      </span>
                    )}
                  </span>
                  <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span className="truncate">
                      {card.bank || card.gateway || "Saved card"}
                    </span>
                    <span>Expires {formatExpiry(card)}</span>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Tokenized
                    </span>
                  </span>
                </span>
                <span
                  className={`h-4 w-4 flex-shrink-0 rounded-full border ${
                    selectedCardId === card.id
                      ? "border-[#2D6A4F] bg-[#2D6A4F] ring-2 ring-[#2D6A4F]/20 dark:border-[#52b788] dark:bg-[#52b788]"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onSelectCard("NEW")}
        className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition ${
          selectedCardId === "NEW"
            ? "border-[#52b788] bg-[#f1fbf6] dark:border-[#52b788] dark:bg-[#10261c]"
            : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
        }`}
      >
        <span
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md ${
            selectedCardId === "NEW"
              ? "bg-[#d8f3dc] text-[#2D6A4F] dark:bg-[#173326] dark:text-[#95d5b2]"
              : "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300"
          }`}
        >
          <Plus className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold text-gray-900 dark:text-white">
            Pay with a new card
          </span>
          <span className="mt-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Secure checkout powered by Paystack
          </span>
        </span>
        <span
          className={`h-4 w-4 rounded-full border ${
            selectedCardId === "NEW"
              ? "border-[#2D6A4F] bg-[#2D6A4F] ring-2 ring-[#2D6A4F]/20 dark:border-[#52b788] dark:bg-[#52b788]"
              : "border-gray-300 dark:border-gray-700"
          }`}
        />
      </button>

      {selectedCardId === "NEW" && (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
          <input
            type="checkbox"
            checked={saveNewCard}
            onChange={(event) => onSaveNewCardChange(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2D6A4F] focus:ring-[#2D6A4F]"
          />
          <span>
            <span className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-100">
              <CreditCard className={`h-4 w-4 ${accentClassName}`} />
              Save this card
            </span>
            <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
              Use it later for one-click course payments and renewals.
            </span>
          </span>
        </label>
      )}
    </div>
  );
}
