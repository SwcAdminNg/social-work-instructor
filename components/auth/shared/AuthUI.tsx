import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReactNode, Ref } from "react";

/** Underlined text link in the form panel. */
export const authLink =
  "font-semibold text-swc-label underline underline-offset-4 decoration-1 hover:text-swc-ink hover:decoration-2";

/** Full-width primary action (50px tall, 6px radius). */
export const authButton = "swc-btn swc-btn--green w-full";

/** Quiet text button (Back, Choose a different method). */
export const authTextButton =
  "inline-flex min-h-[40px] items-center gap-1.5 rounded text-[0.88rem] font-semibold text-swc-ink-2 hover:text-swc-label disabled:cursor-not-allowed disabled:opacity-50";

/** Eyebrow, the page's h1 and a short introduction above a form. */
export function AuthHeading({
  eyebrow,
  title,
  intro,
  icon,
  headingRef,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  icon?: ReactNode;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="mb-7">
      {icon && (
        <span aria-hidden="true" className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-swc-mint text-swc-label">
          {icon}
        </span>
      )}
      {eyebrow && <p className="swc-eyebrow">{eyebrow}</p>}
      <h1
        ref={headingRef}
        tabIndex={headingRef ? -1 : undefined}
        className="mt-3 text-[clamp(1.75rem,3vw,2.25rem)] font-bold leading-[1.12] tracking-[-0.02em] text-swc-ink outline-none first:mt-0"
      >
        {title}
      </h1>
      {intro && <div className="mt-3 text-[1rem] leading-[1.6] text-swc-ink-2">{intro}</div>}
    </div>
  );
}

/** Error or success message: icon and text, announced to screen readers. */
export function AuthMessage({
  tone = "error",
  children,
  className = "mb-5",
}: {
  tone?: "error" | "success";
  children: ReactNode;
  className?: string;
}) {
  const error = tone === "error";
  const Icon = error ? AlertCircle : CheckCircle2;
  return (
    <div
      role={error ? "alert" : "status"}
      aria-live={error ? "assertive" : "polite"}
      className={`flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-[0.9rem] font-medium leading-[1.5] ${
        error
          ? "border-red-300 bg-red-50 text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200"
          : "border-swc-mid/30 bg-swc-mint text-swc-ink"
      } ${className}`}
    >
      <Icon aria-hidden="true" className={`mt-[2px] h-[18px] w-[18px] flex-none ${error ? "" : "text-swc-label"}`} />
      <div className="min-w-0">
        <span className="sr-only">{error ? "Error: " : "Success: "}</span>
        {children}
      </div>
    </div>
  );
}

/** Rule with a short label, between two ways to sign in. */
export function AuthDivider({ children, className = "my-5" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-swc-line" />
      <span className="text-[0.8rem] font-medium text-swc-ink-3">{children}</span>
      <span className="h-px flex-1 bg-swc-line" />
    </div>
  );
}
