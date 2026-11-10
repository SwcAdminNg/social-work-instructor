"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Lenis from "lenis";

/**
 * One small engine drives all the motion on the public pages, so the pages
 * themselves stay server-rendered and only carry data attributes:
 *
 *   data-reveal[="up|fade|scale|left|right|clip|words"]  plays once on entry
 *   data-progress[="view|enter|scrub|pin"]               writes --p (0..1) while on screen
 *   data-hscroll                                         writes --travel (px) for pinned side-scrolls
 *   data-count="1234"                                    counts up when revealed
 *
 * A revealed element gets data-in. It also runs smooth scrolling and the
 * curtain between pages. Everything is switched off for people who ask for
 * reduced motion.
 */

// Routes that have their own shell; the curtain is only for the public pages.
const NO_CURTAIN = /^\/(dashboard|api|logout|complete-setup|instructor)(\/|$)/;
const COVER_MS = 480;

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * React keeps a private key on every element it has hydrated. Content inside
 * a Suspense boundary hydrates late, and touching it sooner would show up as
 * a hydration mismatch, so the engine waits for that key (for a few seconds
 * at most).
 */
const isHydrated = (el: Element) => Object.keys(el).some((key) => key.startsWith("__reactFiber$"));
const HYDRATION_WAIT_MS = 4000;

export default function MotionEngine() {
  const pathname = usePathname();
  const router = useRouter();
  const curtainRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const rescanRef = useRef<() => void>(() => {});
  const covering = useRef(false);
  const failSafe = useRef(0);
  const liftRef = useRef<() => void>(() => {});

  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    root.classList.add("sw-motion", "sw-ready");
    const startedAt = performance.now();
    const seenReveal = new WeakSet<Element>();
    const seenProgress = new WeakSet<Element>();

    /* ── Smooth scrolling ── */
    let lenis: Lenis | null = null;
    let raf = 0;
    const startLenis = () => {
      if (lenis || reduced.matches) return;
      lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, anchors: true, allowNestedScroll: true });
      lenisRef.current = lenis;
      lenis.on("scroll", schedule);
    };
    const stopLenis = () => {
      lenis?.destroy();
      lenis = null;
      lenisRef.current = null;
    };

    /* ── Reveal on entry ── */
    const revealIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.dataset.in = "1";
          revealIO.unobserve(el);
          el.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
          if (el.dataset.count !== undefined) countUp(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    const countUp = (el: HTMLElement) => {
      if (el.dataset.counted || reduced.matches) return;
      el.dataset.counted = "1";
      const target = Number(el.dataset.count);
      if (!Number.isFinite(target)) return;
      const decimals = (el.dataset.count?.split(".")[1] || "").length;
      const format = (v: number) =>
        v.toLocaleString("en-NG", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      const startAt = performance.now();
      const duration = 1600;
      const tick = (now: number) => {
        const t = clamp((now - startAt) / duration);
        const eased = 1 - (1 - t) ** 4;
        el.textContent = format(target * eased);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    /* ── Scroll progress ── */
    const live = new Set<HTMLElement>();
    const progressIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) live.add(el);
          else live.delete(el);
        }
        schedule();
      },
      { rootMargin: "25% 0px 25% 0px" },
    );

    let queued = false;
    const update = () => {
      queued = false;
      const vh = window.innerHeight;
      for (const el of live) {
        const rect = el.getBoundingClientRect();
        let p: number;
        switch (el.dataset.progress) {
          case "pin": // a tall section with a sticky child: 0 as it pins, 1 as it releases
            p = clamp(-rect.top / Math.max(1, rect.height - vh));
            break;
          case "enter": // 0 as the top appears, 1 once the top reaches the top of the screen
            p = clamp((vh - rect.top) / vh);
            break;
          case "scrub": // reading pace: done by the time the block sits mid-screen
            p = clamp((vh * 0.88 - rect.top) / (rect.height + vh * 0.38));
            break;
          default: // 0 as it enters from below, 1 as it leaves at the top
            p = clamp((vh - rect.top) / (vh + rect.height));
        }
        el.style.setProperty("--p", p.toFixed(4));
      }
    };
    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }

    const measureTracks = () => {
      document.querySelectorAll<HTMLElement>("[data-hscroll]").forEach((track) => {
        const viewport = track.parentElement;
        if (!viewport) return;
        track.style.setProperty("--travel", String(Math.max(0, track.scrollWidth - viewport.clientWidth)));
      });
    };

    /* ── Find new elements (first paint, route changes, streamed content) ── */
    let retry = 0;
    const scan = () => {
      window.clearTimeout(retry);
      const waited = performance.now() - startedAt > HYDRATION_WAIT_MS;
      let pending = false;
      const ready = (el: Element) => {
        if (waited) return true;
        // A HydrationGate says exactly when its contents are safe to touch.
        const gate = el.closest<HTMLElement>("[data-hydrate-gate]");
        if (gate ? gate.dataset.hydrated === "1" : isHydrated(el)) return true;
        pending = true;
        return false;
      };
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        if (seenReveal.has(el) || !ready(el)) return;
        seenReveal.add(el);
        if (reduced.matches) el.dataset.in = "1";
        else revealIO.observe(el);
      });
      document.querySelectorAll<HTMLElement>("[data-progress]").forEach((el) => {
        if (seenProgress.has(el) || !ready(el)) return;
        seenProgress.add(el);
        if (!reduced.matches) progressIO.observe(el);
      });
      measureTracks();
      schedule();
      // Something has not hydrated yet: look again shortly.
      if (pending) retry = window.setTimeout(scan, 150);
    };
    rescanRef.current = scan;

    let scanQueued = 0;
    const mutations = new MutationObserver(() => {
      if (scanQueued) return;
      scanQueued = window.setTimeout(() => {
        scanQueued = 0;
        scan();
      }, 80);
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    /* ── Pause smooth scrolling while an overlay locks the page ── */
    const lockWatcher = new MutationObserver(() => {
      if (!lenis) return;
      const locked =
        root.style.overflow === "hidden" ||
        document.body.style.overflow === "hidden" ||
        document.body.hasAttribute("data-scroll-locked"); // set by open menus and dialogs
      if (locked) lenis.stop();
      else lenis.start();
    });
    lockWatcher.observe(root, { attributes: true, attributeFilter: ["style"] });
    lockWatcher.observe(document.body, { attributes: true, attributeFilter: ["style", "data-scroll-locked"] });

    const loop = (time: number) => {
      lenis?.raf(time);
      raf = requestAnimationFrame(loop);
    };

    const onResize = () => {
      measureTracks();
      schedule();
    };
    const onMotionPreference = () => {
      if (reduced.matches) {
        stopLenis();
        document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => (el.dataset.in = "1"));
      } else {
        startLenis();
      }
    };

    startLenis();
    scan();
    raf = requestAnimationFrame(loop);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);
    window.addEventListener("sw:scan", scan);
    reduced.addEventListener("change", onMotionPreference);

    return () => {
      window.removeEventListener("sw:scan", scan);
      cancelAnimationFrame(raf);
      window.clearTimeout(scanQueued);
      window.clearTimeout(retry);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
      reduced.removeEventListener("change", onMotionPreference);
      revealIO.disconnect();
      progressIO.disconnect();
      mutations.disconnect();
      lockWatcher.disconnect();
      stopLenis();
      root.classList.remove("sw-motion", "sw-ready");
    };
  }, []);

  /* ── Curtain: cover, change page, lift ── */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (anchor.dataset.noCurtain !== undefined) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // same page: filters, anchors
      if (NO_CURTAIN.test(url.pathname)) return;
      const curtain = curtainRef.current;
      if (!curtain || covering.current) return;

      event.preventDefault();
      covering.current = true;
      curtain.dataset.state = "in";
      lenisRef.current?.stop();
      const href = url.pathname + url.search + url.hash;
      window.setTimeout(() => router.push(href), COVER_MS);
      // Never leave the page covered if the navigation stalls.
      failSafe.current = window.setTimeout(() => lift(), 8000);
    };

    const lift = () => {
      window.clearTimeout(failSafe.current);
      const curtain = curtainRef.current;
      if (!covering.current || !curtain) return;
      covering.current = false;
      curtain.dataset.state = "out";
      lenisRef.current?.start();
    };
    liftRef.current = lift;

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(failSafe.current);
    };
  }, [router]);

  // A new page has rendered: start at the top, pick up its elements, lift the curtain.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (lenis && !window.location.hash) lenis.scrollTo(0, { immediate: true, force: true });
    rescanRef.current();
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => liftRef.current()));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div ref={curtainRef} className="sw-curtain" aria-hidden="true">
      <div className="sw-curtain-mark flex flex-col items-center gap-3 text-center">
        <span className="h-2 w-2 rounded-full bg-gold" />
        <span className="font-display text-[clamp(1.6rem,4vw,2.6rem)] font-bold leading-none tracking-[-0.03em]">
          Social Work <em className="sw-em text-gold-light">Nigeria</em>
        </span>
      </div>
    </div>
  );
}
