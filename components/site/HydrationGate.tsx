"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Content inside a Suspense boundary hydrates after the rest of the page.
 * This wrapper tells the motion engine when that has finished, so it never
 * touches the elements inside too early.
 */
export default function HydrationGate({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.dataset.hydrated = "1";
    window.dispatchEvent(new Event("sw:scan"));
  }, []);
  return (
    <div ref={ref} data-hydrate-gate="" className={className}>
      {children}
    </div>
  );
}
