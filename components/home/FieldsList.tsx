"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type Field = {
  name: string;
  text: string;
  image: { src: string; alt: string };
};

/**
 * A list of practice settings. On a pointer device a photograph follows the
 * cursor and changes with the row; on touch screens each row carries its own
 * small photograph instead.
 */
export default function FieldsList({ fields }: { fields: Field[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const wrap = wrapRef.current;
    const float = floatRef.current;
    if (!wrap || !float) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let started = false;
    const onMove = (event: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      tx = event.clientX - rect.left;
      ty = event.clientY - rect.top;
      if (!started) {
        started = true;
        x = tx;
        y = ty;
      }
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const tick = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      const tilt = Math.max(-8, Math.min(8, (tx - x) * 0.08));
      float.style.transform = `translate3d(${x}px, ${y}px, 0) translate(12%, -55%) rotate(${tilt}deg)`;
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(tick) : 0;
    };
    wrap.addEventListener("pointermove", onMove);
    return () => {
      wrap.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative" onPointerLeave={() => setActive(-1)}>
      <ul className="m-0 list-none border-t border-line p-0">
        {fields.map((field, index) => {
          const on = active === index;
          return (
            <li
              key={field.name}
              data-reveal
              style={{ "--d": `${Math.min(index, 6) * 0.05}s` } as React.CSSProperties}
              onPointerEnter={() => setActive(index)}
              className="group grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 border-b border-line py-5 transition-[padding] duration-500 ease-sw md:grid-cols-[4rem_1.1fr_1fr] md:gap-x-8 md:py-7 md:hover:pl-4"
            >
              <span className="sw-cap text-ink-3 tabular-nums transition-colors duration-300 group-hover:text-clay-ink max-md:hidden">
                {String(index + 1).padStart(2, "0")}
              </span>
              {/* Touch screens: the photo sits in the row. */}
              <span className="relative h-14 w-14 overflow-hidden rounded-2xl md:hidden">
                <Image src={field.image.src} alt="" fill sizes="160px" quality={90} className="object-cover" />
              </span>
              <h3
                className={`sw-display m-0 text-[clamp(1.35rem,3.2vw,2.6rem)] transition-colors duration-300 ${
                  active >= 0 && !on ? "md:text-ink-3/60" : "text-ink"
                }`}
              >
                {field.name}
              </h3>
              <p className="m-0 text-[0.95rem] leading-relaxed text-ink-2 max-md:col-span-2 md:text-base">
                {field.text}
              </p>
            </li>
          );
        })}
      </ul>

      {/* Pointer devices: one photo follows the cursor. */}
      <div
        ref={floatRef}
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-0 z-10 hidden h-[300px] w-[240px] overflow-hidden rounded-[28px] shadow-[0_30px_60px_-20px_rgba(4,18,11,0.5)] transition-[opacity,scale] duration-500 ease-sw md:block ${
          active >= 0 ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
      >
        {fields.map((field, index) => (
          <Image
            key={field.name}
            src={field.image.src}
            alt=""
            fill
            sizes="640px"
            quality={90}
            className={`object-cover transition-[opacity,transform] duration-700 ease-sw ${
              active === index ? "scale-100 opacity-100" : "scale-110 opacity-0"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
