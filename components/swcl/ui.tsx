import Image from "next/image";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import type { ReactNode } from "react";

export const cx = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(" ");

type ButtonVariant = "gold" | "green" | "outline" | "outline-light";

/** Page action: 50px tall, 6px radius. */
export function Button({
  href,
  children,
  variant = "gold",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  const classes = cx("swc-btn", `swc-btn--${variant}`, className);
  if (/^(https?:|mailto:|tel:)/.test(href)) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("swc-eyebrow", className)}>{children}</p>;
}

/** Eyebrow, h2 and an optional introduction. */
export function SectionIntro({
  eyebrow,
  title,
  intro,
  id,
  align = "left",
  className,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  id?: string;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cx(align === "center" ? "mx-auto max-w-[760px] text-center" : "max-w-[640px]", className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Tag id={id} className={cx("swc-h2", eyebrow && "mt-4")}>
        {title}
      </Tag>
      {intro && <div className={cx("swc-lead mt-5", align === "center" && "mx-auto max-w-[680px]")}>{intro}</div>}
    </div>
  );
}

/** Ticked list. `tone="dark"` for use on the deep green panels. */
export function CheckList({
  items,
  tone = "light",
  className,
  divided,
}: {
  items: ReactNode[];
  tone?: "light" | "dark";
  className?: string;
  /** Rule between items, as on the "working together" panels. */
  divided?: boolean;
}) {
  const dark = tone === "dark";
  return (
    <ul className={cx("m-0 list-none p-0", divided ? "" : "flex flex-col gap-3", className)}>
      {items.map((item, i) => (
        <li
          key={i}
          className={cx(
            "flex items-start gap-3 text-[0.95rem] leading-[1.5]",
            dark ? "text-white/90" : "text-swc-ink-2",
            divided && "border-b py-3.5 last:border-b-0",
            divided && (dark ? "border-white/15" : "border-swc-line"),
          )}
        >
          <Check
            aria-hidden="true"
            className={cx("mt-[3px] h-4 w-4 flex-none", dark ? "text-swc-gold-light" : "text-swc-label")}
            strokeWidth={2.6}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export type HeroImage = { src: string; alt: string; width: number; height: number };

/**
 * Split hero: deep green content panel on the left, photograph on the right
 * with an angled edge. Carries the page's single h1.
 */
export function PageHero({
  id,
  eyebrow,
  title,
  lead,
  image,
  position = "60% 50%",
  children,
  compact,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  image?: HeroImage;
  /** CSS object-position for the photograph. */
  position?: string;
  /** Actions under the text. */
  children?: ReactNode;
  /** Shorter hero for utility pages. */
  compact?: boolean;
}) {
  return (
    <section aria-labelledby={id} className="swc-dark relative overflow-hidden bg-swc-hero text-white">
      <div className={cx("grid grid-cols-[minmax(0,1fr)]", image && "min-[1001px]:grid-cols-[48fr_52fr]")}>
        <div
          className={cx(
            "relative z-10 flex flex-col justify-center",
            compact ? "py-16 md:py-20" : "py-16 md:py-24",
            image
              ? "px-5 min-[701px]:px-[26px] min-[1001px]:pl-[max(26px,calc((100vw-1220px)/2))] min-[1001px]:pr-10"
              : "swc-wrap",
          )}
        >
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1
            id={id}
            className={cx(
              "swc-h1 mt-5 text-white",
              compact && "text-[clamp(2.25rem,4.4vw,3.75rem)]",
              !image && "max-w-[900px]",
            )}
          >
            {title}
          </h1>
          {lead && <div className="swc-lead mt-6 max-w-[560px]">{lead}</div>}
          {children && <div className="mt-8 flex flex-wrap items-center gap-3">{children}</div>}
        </div>
        {image && (
          <div className="swc-hero-media aspect-[16/10] min-[1001px]:aspect-auto">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority
              sizes="(min-width: 1001px) 56vw, 100vw"
              className="object-cover"
              style={{ objectPosition: position }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

/** Deep green closing band with two actions. */
export function CtaBand({
  title,
  body,
  primary,
  secondary,
  id = "closing-title",
}: {
  title: ReactNode;
  body?: ReactNode;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
  id?: string;
}) {
  return (
    <section aria-labelledby={id} className="swc-dark swc-section bg-swc-deep text-center text-white">
      <div className="swc-wrap max-w-[860px]">
        <h2 id={id} className="swc-h2 text-white">
          {title}
        </h2>
        {body && <p className="swc-lead mx-auto mt-5 max-w-[660px]">{body}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href={primary.href}>{primary.label}</Button>
          {secondary && (
            <Button href={secondary.href} variant="outline-light">
              {secondary.label}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

/** Native details/summary disclosures; several can be open at once. */
export function FaqList({
  items,
  className,
}: {
  items: { q: string; a: ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cx("swc-faq", className)}>
      {items.map((item) => (
        <details key={item.q}>
          <summary>
            <span>{item.q}</span>
            <Plus aria-hidden="true" className="swc-faq-icon h-5 w-5" strokeWidth={2.2} />
          </summary>
          <div className="swc-faq-body">{item.a}</div>
        </details>
      ))}
    </div>
  );
}

/** Rounded square holding a line icon, as on the role cards. */
export function IconTile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("grid h-11 w-11 place-items-center rounded-lg bg-swc-mint text-swc-label", className)}
    >
      {children}
    </span>
  );
}
