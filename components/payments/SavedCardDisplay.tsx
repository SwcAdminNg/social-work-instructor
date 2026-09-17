import { CheckCircle2, CreditCard, Radio, ShieldCheck, Trash2 } from "lucide-react";

export type SavedCard = {
  id: string;
  gateway?: string | null;
  last4?: string | null;
  exp_month?: string | number | null;
  exp_year?: string | number | null;
  card_type?: string | null;
  brand?: string | null;
  bank?: string | null;
  is_default?: boolean | null;
};

type SavedCardDisplayProps = {
  card: SavedCard;
  selected?: boolean;
  compact?: boolean;
  interactive?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  onSetDefault?: () => void;
  onDelete?: () => void;
  actionLoading?: boolean;
};

const cardStyles: Record<string, string> = {
  visa:
    "from-[#112d4e] via-[#2d6a4f] to-[#03a9a6] text-white shadow-[#112d4e]/20",
  mastercard:
    "from-[#231942] via-[#7f5539] to-[#f77f00] text-white shadow-[#7f5539]/20",
  verve:
    "from-[#132a13] via-[#31572c] to-[#90a955] text-white shadow-[#31572c]/20",
  amex:
    "from-[#073b4c] via-[#118ab2] to-[#8ecae6] text-white shadow-[#118ab2]/20",
  discover:
    "from-[#2b2d42] via-[#ef476f] to-[#ffd166] text-white shadow-[#ef476f]/20",
  default:
    "from-[#111827] via-[#334155] to-[#2D6A4F] text-white shadow-slate-900/20",
};

export function normalizeCardBrand(card: SavedCard) {
  const value = (card.card_type || card.brand || "card").trim();
  return value || "card";
}

export function formatCardBrand(card: SavedCard) {
  const brand = normalizeCardBrand(card);
  const map: Record<string, string> = {
    visa: "VISA",
    mastercard: "Mastercard",
    master: "Mastercard",
    verve: "Verve",
    amex: "AMEX",
    americanexpress: "AMEX",
    discover: "Discover",
  };
  const key = brand.toLowerCase().replace(/[\s_-]/g, "");
  return map[key] || brand.toUpperCase();
}

function getCardGradient(card: SavedCard) {
  const key = normalizeCardBrand(card).toLowerCase().replace(/[\s_-]/g, "");
  if (key.includes("visa")) return cardStyles.visa;
  if (key.includes("master")) return cardStyles.mastercard;
  if (key.includes("verve")) return cardStyles.verve;
  if (key.includes("amex") || key.includes("americanexpress")) return cardStyles.amex;
  if (key.includes("discover")) return cardStyles.discover;
  return cardStyles.default;
}

function formatExpiry(card: SavedCard) {
  const month = String(card.exp_month || "").padStart(2, "0").slice(-2);
  const year = String(card.exp_year || "").slice(-2);
  if (!month && !year) return "MM/YY";
  return `${month || "MM"}/${year || "YY"}`;
}

export function SavedCardDisplay({
  card,
  selected = false,
  compact = false,
  interactive = false,
  disabled = false,
  onSelect,
  onSetDefault,
  onDelete,
  actionLoading = false,
}: SavedCardDisplayProps) {
  const brand = formatCardBrand(card);
  const last4 = card.last4 || "----";
  const Wrapper = interactive ? "button" : "div";

  return (
    <div className="grid gap-3">
      <Wrapper
        type={interactive ? "button" : undefined}
        disabled={interactive ? disabled : undefined}
        onClick={interactive ? onSelect : undefined}
        className={`group relative w-full overflow-hidden rounded-xl bg-gradient-to-br ${getCardGradient(card)} p-4 text-left shadow-xl transition duration-200 ${
          compact ? "min-h-[150px]" : "min-h-[190px]"
        } ${
          selected
            ? "ring-2 ring-[#52b788] ring-offset-2 ring-offset-white dark:ring-offset-gray-950"
            : "ring-1 ring-white/15"
        } ${interactive ? "hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" : ""}`}
        aria-pressed={interactive ? selected : undefined}
      >
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/12" />
        <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-black/15" />
        <div className="relative flex h-full min-h-[118px] flex-col justify-between gap-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-white/70">
                {card.bank || card.gateway || "Payment card"}
              </p>
              <p className="mt-1 text-xl font-black tracking-normal">{brand}</p>
            </div>
            <div className="flex items-center gap-2">
              {card.is_default && (
                <span className="inline-flex items-center gap-1 rounded-md bg-white/18 px-2 py-1 text-[0.65rem] font-black uppercase text-white">
                  <CheckCircle2 className="h-3 w-3" />
                  Default
                </span>
              )}
              {interactive && selected ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#2D6A4F]">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              ) : (
                <CreditCard className="h-6 w-6 text-white/80" />
              )}
            </div>
          </div>

          <div>
            <div className="mb-5 h-8 w-11 rounded-md border border-white/25 bg-gradient-to-br from-[#f9d976] to-[#f39f86] shadow-inner" />
            <p className="font-mono text-lg font-bold tracking-normal text-white sm:text-xl">
              •••• •••• •••• {last4}
            </p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[0.62rem] font-bold uppercase text-white/60">
                  Expires
                </p>
                <p className="font-mono text-sm font-bold">{formatExpiry(card)}</p>
              </div>
              <div className="text-right">
                <p className="text-[0.62rem] font-bold uppercase text-white/60">
                  Secure
                </p>
                <p className="inline-flex items-center gap-1 text-sm font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  Tokenized
                </p>
              </div>
            </div>
          </div>
        </div>
      </Wrapper>

      {(onSetDefault || onDelete) && (
        <div className="flex flex-wrap gap-2">
          {onSetDefault && !card.is_default && (
            <button
              type="button"
              onClick={onSetDefault}
              disabled={disabled || actionLoading}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-[#b7e4c7] bg-white px-3 text-xs font-extrabold text-[#2D6A4F] transition hover:bg-[#f1fbf6] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#2f6f55] dark:bg-gray-950 dark:text-[#95d5b2] dark:hover:bg-[#10261c] sm:flex-none"
            >
              <Radio className="h-4 w-4" />
              Set default
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={disabled || actionLoading}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/40 dark:bg-gray-950 dark:text-red-300 dark:hover:bg-red-950/30 sm:flex-none"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function SavedCardSummary({ card }: { card: SavedCard }) {
  return (
    <span className="font-medium text-gray-900 dark:text-white">
      {formatCardBrand(card)} ending in •••• {card.last4 || "----"}
    </span>
  );
}
