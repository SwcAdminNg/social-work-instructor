"use client";

import { useEffect, useState, type RefObject } from "react";

export type SurfaceTone = "light" | "dark";

export type AdaptiveSurface = {
  /** "r, g, b" of the colour beneath the header, ready for rgba(). */
  rgb: string;
  /** Whether that colour is light or dark, which decides the text colour. */
  tone: SurfaceTone;
  /** True while the page is scrolled to the very top. */
  atTop: boolean;
  /** False until the first reading has been painted; use it to skip the load-time fade. */
  ready: boolean;
};

type RGB = [number, number, number];

const FALLBACK: AdaptiveSurface = { rgb: "255, 255, 255", tone: "light", atTop: true, ready: false };

// Points across the bar where the colour is sampled, as fractions of its width.
const SAMPLE_X = [0.08, 0.5, 0.92];

const colorCache = new Map<string, [number, number, number, number]>();
let colorCtx: CanvasRenderingContext2D | null | undefined;

/**
 * Turns any CSS colour (rgb, oklch, color(), named…) into RGBA bytes by
 * painting it onto a 1×1 canvas, so Tailwind's oklch colours work too.
 */
function toRgba(color: string): [number, number, number, number] | null {
  const cached = colorCache.get(color);
  if (cached) return cached;
  if (colorCtx === undefined) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    colorCtx = canvas.getContext("2d", { willReadFrequently: true });
  }
  if (!colorCtx) return null;
  colorCtx.clearRect(0, 0, 1, 1);
  colorCtx.fillStyle = "rgba(0,0,0,0)";
  colorCtx.fillStyle = color;
  colorCtx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = colorCtx.getImageData(0, 0, 1, 1).data;
  const value: [number, number, number, number] = [r, g, b, a / 255];
  colorCache.set(color, value);
  return value;
}

/**
 * Finds the first opaque colour painted beneath a point, skipping the
 * header itself. An element can declare the colour of a photo or video
 * with data-nav-bg="#123e29", which wins over its computed background.
 */
function colorAt(x: number, y: number, header: HTMLElement): RGB | null {
  for (const el of document.elementsFromPoint(x, y)) {
    if (header.contains(el)) continue;
    const declared = (el as HTMLElement).dataset?.navBg;
    if (declared) {
      const rgba = toRgba(declared);
      if (rgba) return [rgba[0], rgba[1], rgba[2]];
    }
    const rgba = toRgba(getComputedStyle(el).backgroundColor);
    if (rgba && rgba[3] > 0.5) return [rgba[0], rgba[1], rgba[2]];
  }
  return null;
}

function relativeLuminance([r, g, b]: RGB) {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function pageColor(): RGB {
  for (const el of [document.body, document.documentElement]) {
    const rgba = toRgba(getComputedStyle(el).backgroundColor);
    if (rgba && rgba[3] > 0.5) return [rgba[0], rgba[1], rgba[2]];
  }
  return [255, 255, 255];
}

/**
 * Watches what is underneath the header (on scroll, resize, route and
 * theme changes) and reports its colour and tone, so the header can
 * have no colour of its own and simply blend with the page.
 */
export function useAdaptiveSurface(
  headerRef: RefObject<HTMLElement | null>,
  headerHeight: number,
  deps: unknown[] = [],
): AdaptiveSurface {
  const [surface, setSurface] = useState<AdaptiveSurface>(FALLBACK);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let frame = 0;
    let readyFrame = 0;
    let first = true;
    const measure = () => {
      frame = 0;
      const width = window.innerWidth;
      // Sample just inside the bar's lower half, where content slides beneath it.
      const y = Math.min(headerHeight * 0.6, window.innerHeight - 1);
      const fallback = pageColor();
      const samples = SAMPLE_X.map((fx) => colorAt(fx * width, y, header) ?? fallback);
      const rgb = samples
        .reduce<RGB>((sum, c) => [sum[0] + c[0], sum[1] + c[1], sum[2] + c[2]], [0, 0, 0])
        .map((v) => Math.round(v / samples.length)) as RGB;
      // Text tone follows the darkest sample so no word lands on a clashing patch.
      const darkest = Math.min(...samples.map(relativeLuminance));
      const tone: SurfaceTone = darkest < 0.36 ? "dark" : "light";
      const reading = { rgb: rgb.join(", "), tone, atTop: window.scrollY < 4 };
      setSurface((prev) =>
        prev.rgb === reading.rgb && prev.tone === reading.tone && prev.atTop === reading.atTop
          ? prev
          : { ...reading, ready: prev.ready },
      );
      if (first) {
        first = false;
        // Turn transitions on only after the first reading has been painted.
        readyFrame = requestAnimationFrame(() => {
          readyFrame = requestAnimationFrame(() =>
            setSurface((prev) => (prev.ready ? prev : { ...prev, ready: true })),
          );
        });
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    schedule();
    // Late layout shifts (fonts, images, streamed content) can change what sits beneath.
    const settle = window.setTimeout(schedule, 350);

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("load", schedule);
    const themeObserver = new MutationObserver(schedule);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const sizeObserver = new ResizeObserver(schedule);
    sizeObserver.observe(document.body);

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(readyFrame);
      window.clearTimeout(settle);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("load", schedule);
      themeObserver.disconnect();
      sizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerRef, headerHeight, ...deps]);

  return surface;
}
