import type { ReactNode } from "react";
import { Contours, Eyebrow, Heading, Photo, cx, type Vars } from "./ui";

type HeroPhoto = { src: string; alt: string; place?: string };

/**
 * The opening of every public page: it slides under the header, carries the
 * page's h1 and, when given a photograph, frames it on the right.
 */
export default function PageHero({
  id,
  eyebrow,
  title,
  lead,
  body,
  photo,
  position,
  tone = "forest",
  children,
  aside,
  compact,
}: {
  id: string;
  eyebrow: string;
  /** Wrap a phrase in *asterisks* for the accent serif. */
  title: string;
  lead?: ReactNode;
  body?: ReactNode;
  photo?: HeroPhoto;
  /** CSS object-position for the photo. */
  position?: string;
  tone?: "forest" | "paper";
  /** Buttons or other actions under the text. */
  children?: ReactNode;
  /** Replaces the photo column with custom content. */
  aside?: ReactNode;
  /** Shorter hero for utility pages. */
  compact?: boolean;
}) {
  const dark = tone === "forest";
  const split = Boolean(photo || aside);

  return (
    <section
      aria-labelledby={id}
      data-progress="view"
      className={cx(
        "relative -mt-[var(--nav-h)] overflow-hidden pt-[var(--nav-h)]",
        compact ? "pb-20 md:pb-28" : "pb-24 md:pb-36",
        dark ? "sw-on-dark sw-grain bg-forest" : "bg-paper text-ink",
      )}
    >
      <Contours className={dark ? "text-leaf" : "text-brand opacity-[0.07]"} />
      {dark && (
        <>
          <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-1/4 h-[480px] w-[480px] rounded-full bg-brand/40 blur-[150px]" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-24 h-[400px] w-[400px] rounded-full bg-clay/25 blur-[140px]" />
        </>
      )}

      <div
        className={cx(
          "sw-wrap relative grid items-center gap-x-14 gap-y-12",
          compact ? "pt-8 md:pt-12" : "pt-10 md:pt-16",
          split && "lg:grid-cols-[1.08fr_0.92fr]",
        )}
      >
        <div className={split ? undefined : "max-w-4xl"}>
          <div data-reveal>
            <Eyebrow className={dark ? "text-gold-light" : "text-accent"}>{eyebrow}</Eyebrow>
          </div>
          <Heading
            as="h1"
            id={id}
            text={title}
            accent={dark ? "text-gold-light" : "text-clay-ink"}
            delay={0.5}
            className={cx(
              "sw-display m-0 mt-6",
              compact ? "text-[clamp(2.4rem,5vw,4.2rem)]" : "text-[clamp(2.5rem,5.6vw,4.9rem)]",
              dark ? "text-[#fffdf4]" : "text-ink",
            )}
          />
          {lead && (
            <p
              data-reveal
              style={{ "--d": "0.9s" } as Vars}
              className={cx("sw-lead m-0 mt-7 max-w-[38rem]", dark ? "text-white/85" : "text-ink-2")}
            >
              {lead}
            </p>
          )}
          {body && (
            <p
              data-reveal
              style={{ "--d": "1s" } as Vars}
              className={cx("m-0 mt-4 max-w-[38rem] text-[1rem] leading-relaxed", dark ? "text-white/65" : "text-ink-3")}
            >
              {body}
            </p>
          )}
          {children && (
            <div data-reveal style={{ "--d": "1.1s" } as Vars} className="mt-9 flex flex-wrap items-center gap-3">
              {children}
            </div>
          )}
        </div>

        {aside}
        {photo && !aside && (
          <div className="relative mx-auto w-full max-w-[520px] lg:max-w-none" data-reveal="clip" style={{ "--d": "0.6s" } as Vars}>
            <Photo
              photo={photo}
              priority
              frame={1.1}
              sizes="(min-width: 1024px) 44vw, 92vw"
              position={position}
              className="aspect-[5/4] w-full rounded-[36px] md:rounded-[44px] lg:aspect-[4/3.6]"
            >
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-night/45 via-transparent to-transparent" />
            </Photo>
          </div>
        )}
      </div>
    </section>
  );
}
