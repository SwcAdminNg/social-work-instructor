import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ElementType, ReactNode } from "react";

export const cx = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(" ");

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * A heading whose words rise in one after another. Wrap a phrase in
 * *asterisks* to set it in the italic accent serif.
 */
export function Heading({
  as: Tag = "h2",
  text,
  className,
  accent = "text-clay-ink",
  delay = 0,
  id,
  reveal = true,
  scrub = false,
}: {
  as?: ElementType;
  text: string;
  className?: string;
  /** Colour class for the accent phrase. */
  accent?: string;
  delay?: number;
  id?: string;
  reveal?: boolean;
  /** Light the words up with the scroll instead of playing once. */
  scrub?: boolean;
}) {
  const plain = text.replace(/\*/g, "");
  const words: { word: string; em: boolean }[] = [];
  text.split("*").forEach((segment, index) => {
    segment
      .split(/\s+/)
      .filter(Boolean)
      .forEach((word) => words.push({ word, em: index % 2 === 1 }));
  });

  return (
    <Tag
      id={id}
      className={className}
      aria-label={plain}
      data-reveal={reveal && !scrub ? "words" : undefined}
      data-progress={scrub ? "scrub" : undefined}
      style={{ "--d": `${delay}s`, "--n": words.length } as Vars}
    >
      {words.map(({ word, em }, i) => (
        <span key={i} aria-hidden="true">
          <span className="sw-w">
            <span className={em ? cx("sw-em", accent) : undefined} style={{ "--i": i } as Vars}>
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}

function Arrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

type BtnVariant = "green" | "gold" | "clay" | "light" | "ghost";

/** Pill link with the round arrow. */
export function Btn({
  href,
  children,
  variant = "green",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: BtnVariant;
  className?: string;
}) {
  const classes = cx("sw-btn", variant !== "green" && `sw-btn--${variant}`, className);
  const inner = (
    <>
      <span>{children}</span>
      <span className="sw-btn-dot" aria-hidden="true">
        <Arrow />
        <Arrow />
      </span>
    </>
  );
  if (/^(https?:|mailto:|tel:)/.test(href)) {
    return (
      <a href={href} className={classes} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  );
}

/** Text link with a sliding underline and a small arrow. */
export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cx("sw-link", className)}>
      {children}
      <Arrow />
    </Link>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("sw-eyebrow m-0", className)}>{children}</p>;
}

/** Topographic lines in the current text colour; place inside a relative, overflow-hidden parent. */
export function Contours({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx("sw-contours", className)} />;
}

/** An endless strip. Decorative: the items are repeated for the loop and hidden from assistive tech. */
export function Marquee({
  children,
  className,
  reverse,
  duration = 46,
  gap = "2.5rem",
}: {
  children: ReactNode;
  className?: string;
  reverse?: boolean;
  duration?: number;
  gap?: string;
}) {
  return (
    <div
      className={cx("sw-marquee", className)}
      data-reverse={reverse || undefined}
      aria-hidden="true"
      style={{ "--dur": `${duration}s`, "--gap": gap } as Vars}
    >
      <div>{children}</div>
      <div>{children}</div>
    </div>
  );
}

type PhotoSource = { src: string; alt: string; place?: string; width?: number; height?: number };

/**
 * `sizes` describes the frame's width, but a wide photo cropped into a taller
 * frame is drawn wider than the frame. Scale each slot's width up by that
 * overflow (plus the parallax zoom) so the browser fetches a sharp source.
 */
function sizesForCrop(sizes: string, photo: PhotoSource, frame: number | undefined, parallax: boolean) {
  const ratio = photo.width && photo.height ? photo.width / photo.height : 0;
  const crop = frame && ratio ? Math.max(1, ratio / frame) : 1;
  const k = crop * (parallax ? 1.14 : 1);
  if (k <= 1.01) return sizes;
  return sizes
    .split(",")
    .map((part) =>
      part.replace(/(\d+(?:\.\d+)?)(vw|px)\s*$/, (_, n: string, unit: string) => `${Math.ceil(Number(n) * k)}${unit}`),
    )
    .join(",");
}

/** A framed photograph with a slow parallax inside the frame. */
export function Photo({
  photo,
  className,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority,
  position,
  place = true,
  parallax = true,
  frame,
  imgClassName,
  children,
}: {
  photo: PhotoSource;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** CSS object-position, to keep the subject in frame. */
  position?: string;
  /** Show the place label when the photo has one. */
  place?: boolean;
  parallax?: boolean;
  /** The frame's width ÷ height, so a cropped photo still loads at full sharpness. */
  frame?: number;
  imgClassName?: string;
  children?: ReactNode;
}) {
  return (
    <figure className={cx("sw-photo m-0", className)} data-progress={parallax ? "view" : undefined}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizesForCrop(sizes, photo, frame, parallax)}
        priority={priority}
        quality={90}
        className={cx("sw-photo-img", imgClassName)}
        style={position ? { objectPosition: position } : undefined}
      />
      {place && photo.place && (
        <figcaption className="sw-photo-place sw-cap">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold" />
          {photo.place}
        </figcaption>
      )}
      {children}
    </figure>
  );
}

/** The standard opening for a section: eyebrow, heading, optional lead. */
export function SectionHead({
  eyebrow,
  title,
  lead,
  id,
  align = "left",
  onDark,
  className,
  accent,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  id?: string;
  align?: "left" | "center";
  onDark?: boolean;
  className?: string;
  accent?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cx(align === "center" && "mx-auto text-center", "max-w-3xl", className)}>
      {eyebrow && (
        <div data-reveal>
          <Eyebrow className={onDark ? "text-gold-light" : "text-accent"}>{eyebrow}</Eyebrow>
        </div>
      )}
      <Heading
        id={id}
        text={title}
        accent={accent ?? (onDark ? "text-gold-light" : "text-clay-ink")}
        className={cx("sw-display m-0 text-[clamp(2.1rem,4.6vw,3.9rem)]", eyebrow && "mt-5")}
      />
      {lead && (
        <p
          data-reveal
          style={{ "--d": "0.15s" } as Vars}
          className={cx("sw-lead m-0 mt-5", onDark ? "text-white/75" : "text-ink-2", align === "center" && "mx-auto", "max-w-2xl")}
        >
          {lead}
        </p>
      )}
      {children}
    </div>
  );
}

export type { Vars };
