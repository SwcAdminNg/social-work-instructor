"use client";

// Shared design-system primitives for the instructor workspace.
// Brand: green (brand-600 light / brand-400 dark). Surfaces: white / ink-surface.

import Link from "next/link";
import { forwardRef, useId } from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/studio/labels";
import { initials } from "@/lib/studio/labels";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ───────────────────────── Button ───────────────────────── */

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "soft-danger";
type Size = "xs" | "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-[0_8px_20px_-12px_rgba(45,106,79,0.9)] hover:bg-brand-700 dark:bg-brand-400 dark:text-[#06130d] dark:hover:bg-brand-300",
  secondary:
    "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-400/12 dark:text-brand-300 dark:hover:bg-brand-400/20",
  outline:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-ink-line dark:bg-ink-surface dark:text-slate-200 dark:hover:bg-white/5",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white",
  danger: "bg-rose-600 text-white shadow-[0_8px_20px_-12px_rgba(225,29,72,0.9)] hover:bg-rose-700",
  "soft-danger": "text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10",
};

const SIZES: Record<Size, string> = {
  xs: "h-7 gap-1 rounded-md px-2 text-xs",
  sm: "h-8 gap-1.5 rounded-lg px-3 text-[13px]",
  md: "h-10 gap-2 rounded-lg px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-5 text-[15px]",
};

const ICON_SIZES: Record<Size, string> = { xs: "h-3.5 w-3.5", sm: "h-4 w-4", md: "h-4 w-4", lg: "h-5 w-5" };

type ButtonBaseProps = {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  /** Square icon-only button. Pass `aria-label`. */
  iconOnly?: boolean;
};

function buttonClass({ variant = "primary", size = "md", iconOnly }: ButtonBaseProps, className?: string) {
  return cn(
    "inline-flex flex-shrink-0 cursor-pointer items-center justify-center whitespace-nowrap font-semibold no-underline transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-ink-page",
    VARIANTS[variant],
    SIZES[size],
    iconOnly && "aspect-square px-0",
    className,
  );
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonBaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(function Button({ variant, size = "md", icon: Icon, iconRight: IconRight, loading, iconOnly, className, children, disabled, type, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      disabled={disabled || loading}
      className={buttonClass({ variant, size, iconOnly }, className)}
      {...rest}
    >
      {loading ? <Loader2 className={cn(ICON_SIZES[size], "animate-spin")} /> : Icon && <Icon className={ICON_SIZES[size]} strokeWidth={2} />}
      {children}
      {IconRight && !loading && <IconRight className={ICON_SIZES[size]} strokeWidth={2} />}
    </button>
  );
});

export function ButtonLink({
  href,
  variant,
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  iconOnly,
  className,
  children,
  ...rest
}: ButtonBaseProps & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={buttonClass({ variant, size, iconOnly }, className)} {...rest}>
      {Icon && <Icon className={ICON_SIZES[size]} strokeWidth={2} />}
      {children}
      {IconRight && <IconRight className={ICON_SIZES[size]} strokeWidth={2} />}
    </Link>
  );
}

/* ───────────────────────── Badge ───────────────────────── */

const TONES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-slate-200/70 dark:bg-white/8 dark:text-slate-300 dark:ring-white/10",
  brand: "bg-brand-50 text-brand-700 ring-brand-200/70 dark:bg-brand-400/12 dark:text-brand-300 dark:ring-brand-400/20",
  info: "bg-sky-50 text-sky-700 ring-sky-200/70 dark:bg-sky-500/12 dark:text-sky-300 dark:ring-sky-400/20",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/12 dark:text-emerald-300 dark:ring-emerald-400/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-200/70 dark:bg-amber-500/12 dark:text-amber-300 dark:ring-amber-400/20",
  danger: "bg-rose-50 text-rose-700 ring-rose-200/70 dark:bg-rose-500/12 dark:text-rose-300 dark:ring-rose-400/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-200/70 dark:bg-violet-500/12 dark:text-violet-300 dark:ring-violet-400/20",
};

const DOTS: Record<Tone, string> = {
  neutral: "bg-slate-400",
  brand: "bg-brand-500",
  info: "bg-sky-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  violet: "bg-violet-500",
};

export function toneClasses(tone: Tone) {
  return TONES[tone];
}

export function Badge({
  tone = "neutral",
  dot,
  pulse,
  icon: Icon,
  size = "sm",
  className,
  children,
  title,
}: {
  tone?: Tone;
  dot?: boolean;
  pulse?: boolean;
  icon?: LucideIcon;
  size?: "xs" | "sm";
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset",
        size === "xs" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        TONES[tone],
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", DOTS[tone])} />}
          <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", DOTS[tone])} />
        </span>
      )}
      {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.2} />}
      <span className="truncate">{children}</span>
    </span>
  );
}

/* ───────────────────────── Surfaces ───────────────────────── */

export function Card({
  className,
  children,
  padded = true,
  interactive,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { padded?: boolean; interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-18px_rgba(16,24,40,0.18)] dark:border-ink-line dark:bg-ink-surface dark:shadow-none",
        padded && "p-5 sm:p-6",
        interactive && "transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_18px_40px_-24px_rgba(45,106,79,0.45)] dark:hover:border-brand-500/40",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/12 dark:text-brand-300">
            <Icon className="h-5 w-5" strokeWidth={1.9} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
          {description && <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">{eyebrow}</p>
        )}
        <h1 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-[1.75rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
        {Icon && (
          <span className={cn("grid h-9 w-9 place-items-center rounded-xl ring-1 ring-inset", TONES[tone])}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-[1.75rem] font-extrabold leading-none tracking-tight text-slate-950 dark:text-white">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block no-underline">
      <Card interactive className="h-full">
        {body}
      </Card>
    </Link>
  ) : (
    <Card className="h-full">{body}</Card>
  );
}

const CALLOUT_ICON_TONES: Record<Tone, string> = {
  neutral: "text-slate-500",
  brand: "text-brand-600 dark:text-brand-300",
  info: "text-sky-600 dark:text-sky-300",
  success: "text-emerald-600 dark:text-emerald-300",
  warning: "text-amber-600 dark:text-amber-300",
  danger: "text-rose-600 dark:text-rose-300",
  violet: "text-violet-600 dark:text-violet-300",
};

const CALLOUT_TONES: Record<Tone, string> = {
  neutral: "border-slate-200 bg-slate-50 dark:border-ink-line dark:bg-white/[0.03]",
  brand: "border-brand-200 bg-brand-50/70 dark:border-brand-500/25 dark:bg-brand-400/[0.07]",
  info: "border-sky-200 bg-sky-50/80 dark:border-sky-500/25 dark:bg-sky-500/[0.07]",
  success: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/25 dark:bg-emerald-500/[0.07]",
  warning: "border-amber-200 bg-amber-50/80 dark:border-amber-500/25 dark:bg-amber-500/[0.07]",
  danger: "border-rose-200 bg-rose-50/80 dark:border-rose-500/25 dark:bg-rose-500/[0.07]",
  violet: "border-violet-200 bg-violet-50/80 dark:border-violet-500/25 dark:bg-violet-500/[0.07]",
};

/** A banner/notice with an icon, title, body and optional actions. */
export function Callout({
  tone = "info",
  icon: Icon,
  title,
  children,
  actions,
  className,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  title?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center", CALLOUT_TONES[tone], className)}>
      <div className="flex min-w-0 flex-1 gap-3">
        {Icon && <Icon className={cn("mt-0.5 h-5 w-5 flex-shrink-0", CALLOUT_ICON_TONES[tone])} strokeWidth={2} />}
        <div className="min-w-0 text-sm leading-6">
          {title && <p className="font-semibold text-slate-900 dark:text-white">{title}</p>}
          {children && <div className="text-slate-600 dark:text-slate-300">{children}</div>}
        </div>
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:ml-auto">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 text-center dark:border-ink-line dark:bg-white/[0.02]",
        compact ? "gap-2 px-6 py-8" : "gap-3 px-6 py-14",
        className,
      )}
    >
      {Icon && (
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-200/60 dark:from-brand-400/15 dark:to-brand-400/5 dark:text-brand-300 dark:ring-brand-400/20">
          <Icon className="h-6 w-6" strokeWidth={1.8} />
        </span>
      )}
      <p className="font-display text-[15px] font-bold text-slate-900 dark:text-white">{title}</p>
      {description && <p className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-lg bg-[linear-gradient(90deg,rgba(148,163,184,0.12)_0%,rgba(148,163,184,0.24)_50%,rgba(148,163,184,0.12)_100%)] bg-[length:800px_100%]",
        className,
      )}
    />
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin text-brand-600 dark:text-brand-300", className)} />;
}

export function ProgressBar({ value, tone = "brand", className }: { value: number; tone?: Tone; className?: string }) {
  const bar: Record<Tone, string> = {
    neutral: "bg-slate-400",
    brand: "bg-gradient-to-r from-brand-500 to-brand-400",
    info: "bg-sky-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    violet: "bg-violet-500",
  };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/8", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-300", bar[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Avatar({ name, src, size = "md", className }: { name?: string; src?: string | null; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const s = { xs: "h-6 w-6 text-[10px]", sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" }[size];
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name ?? ""} className={cn("flex-shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-ink-surface", s, className)} />
  ) : (
    <span
      title={name}
      className={cn(
        "grid flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white ring-2 ring-white dark:from-brand-400 dark:to-brand-600 dark:ring-ink-surface",
        s,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-slate-100 dark:bg-ink-line", className)} />;
}

/* ───────────────────────── Tabs & segmented ───────────────────────── */

export type TabDef<K extends string> = { key: K; label: string; icon?: LucideIcon; count?: number; tone?: Tone; hidden?: boolean };

/** Underlined tab bar. Scrolls horizontally on small screens. */
export function Tabs<K extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabDef<K>[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
}) {
  return (
    <div className={cn("-mx-1 overflow-x-auto px-1", className)}>
      <div role="tablist" className="flex min-w-max gap-1 border-b border-slate-200 dark:border-ink-line">
        {tabs
          .filter((t) => !t.hidden)
          .map((t) => {
            const active = t.key === value;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => onChange(t.key)}
                className={cn(
                  "relative inline-flex h-11 cursor-pointer items-center gap-2 px-3 text-sm font-semibold transition-colors",
                  active
                    ? "text-brand-700 dark:text-brand-300"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
                )}
              >
                {Icon && <Icon className="h-4 w-4" strokeWidth={2} />}
                {t.label}
                {typeof t.count === "number" && t.count > 0 && (
                  <span
                    className={cn(
                      "min-w-5 rounded-full px-1.5 py-px text-center text-[11px] font-bold",
                      t.tone ? TONES[t.tone] : active ? TONES.brand : TONES.neutral,
                    )}
                  >
                    {t.count}
                  </span>
                )}
                <span
                  className={cn(
                    "absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-all",
                    active ? "bg-brand-600 dark:bg-brand-400" : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
      </div>
    </div>
  );
}

/** Pill-style segmented control for 2–5 options. */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: {
  options: { key: K; label: React.ReactNode; icon?: LucideIcon }[];
  value: K;
  onChange: (key: K) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-xl bg-slate-100 p-1 dark:bg-white/5", className)}>
      {options.map((o) => {
        const active = o.key === value;
        const Icon = o.icon;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={cn(
              "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg font-semibold transition-all",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[13px]",
              active
                ? "bg-white text-slate-900 shadow-sm dark:bg-ink-raised dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Form controls ───────────────────────── */

const CONTROL =
  "w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-400/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-ink-line dark:bg-ink-page/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-400 dark:disabled:bg-white/[0.03]";

export function Field({
  label,
  hint,
  error,
  required,
  optional,
  children,
  className,
  htmlFor,
  aside,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || aside) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label htmlFor={htmlFor} className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
              {label}
              {required && <span className="ml-0.5 text-rose-500">*</span>}
              {optional && <span className="ml-1.5 text-xs font-normal text-slate-400">Optional</span>}
            </label>
          )}
          {aside}
        </div>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-300">{error}</p>
      ) : (
        hint && <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; leading?: React.ReactNode }>(
  function Input({ className, invalid, leading, ...rest }, ref) {
    if (leading) {
      return (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">{leading}</span>
          <input ref={ref} className={cn(CONTROL, "h-10 pl-9 pr-3", invalid && "border-rose-400", className)} {...rest} />
        </div>
      );
    }
    return <input ref={ref} className={cn(CONTROL, "h-10 px-3", invalid && "border-rose-400", className)} {...rest} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, rows = 4, ...rest }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(CONTROL, "resize-y px-3 py-2.5 leading-6", invalid && "border-rose-400", className)} {...rest} />;
  },
);

// Dropdown selects live in "@/components/ui/select" (shared with the admin app).

export function Switch({
  checked,
  onChange,
  disabled,
  label,
  description,
  className,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const control = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-brand-600 dark:bg-brand-400" : "bg-slate-200 dark:bg-white/15",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
  if (!label) return control;
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</span>}
      </label>
      {control}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  disabled,
  label,
  description,
  className,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", disabled && "cursor-not-allowed opacity-60", className)}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-slate-300 accent-brand-600 dark:accent-brand-400"
      />
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>}
          {description && <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</span>}
        </span>
      )}
    </label>
  );
}

/** Large selectable card (used for picking item types, risk levels, etc.). */
export function ChoiceCard({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
  tone = "brand",
  disabled,
  className,
}: {
  selected?: boolean;
  onClick?: () => void;
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: Tone;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "group flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-brand-500 bg-brand-50/60 ring-4 ring-brand-400/15 dark:border-brand-400 dark:bg-brand-400/10"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 dark:border-ink-line dark:bg-ink-surface dark:hover:border-white/20",
        className,
      )}
    >
      {Icon && (
        <span className={cn("grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl ring-1 ring-inset", TONES[tone])}>
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-sm font-bold text-slate-900 dark:text-white">{title}</span>
        {description && <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</span>}
      </span>
    </button>
  );
}

/** Small key/value row used in summaries and detail panes. */
export function Meta({ label, children, className }: { label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
      <div className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{children}</div>
    </div>
  );
}
