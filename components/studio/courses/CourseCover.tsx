"use client";

import {
  BookOpen,
  Briefcase,
  Camera,
  ClipboardList,
  Code2,
  Coffee,
  Cpu,
  GraduationCap,
  HeartPulse,
  Landmark,
  Languages,
  Megaphone,
  Music,
  Palette,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/components/ui/primitives";
import type { CourseCategory } from "@/lib/studio/types";
import { coverGradient } from "./courseStatus";

export const CATEGORY_ICONS: Record<CourseCategory, LucideIcon> = {
  DEVELOPMENT: Code2,
  BUSINESS: Briefcase,
  FINANCE_ACCOUNTING: Landmark,
  IT_SOFTWARE: Cpu,
  OFFICE_PRODUCTIVITY: ClipboardList,
  PERSONAL_DEVELOPMENT: Sprout,
  DESIGN: Palette,
  MARKETING: Megaphone,
  HEALTH_FITNESS: HeartPulse,
  MUSIC: Music,
  TEACHING_ACADEMICS: GraduationCap,
  PHOTOGRAPHY_VIDEO: Camera,
  LIFESTYLE: Coffee,
  LANGUAGE: Languages,
};

function monogram(title?: string) {
  const words = (title ?? "").replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/**
 * Course cover: the uploaded thumbnail, or a generated gradient with the
 * category icon and the title's initials.
 */
export function CourseCover({
  title,
  seed,
  thumbnailUrl,
  category,
  className,
  size = "md",
  children,
}: {
  title?: string;
  seed: string;
  thumbnailUrl?: string | null;
  category?: CourseCategory | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}) {
  const Icon = (category && CATEGORY_ICONS[category]) || BookOpen;
  const text = monogram(title);
  return (
    <div className={cn("relative overflow-hidden bg-slate-100 dark:bg-white/5", className)}>
      {thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="absolute inset-0" style={{ background: coverGradient(seed) }} aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.28),transparent_45%),radial-gradient(circle_at_10%_100%,rgba(0,0,0,0.18),transparent_50%)]" />
          <Icon
            className={cn(
              "absolute text-white/15",
              size === "sm" ? "-bottom-2 -right-2 h-12 w-12" : size === "lg" ? "-bottom-6 -right-4 h-40 w-40" : "-bottom-4 -right-3 h-28 w-28",
            )}
            strokeWidth={1.4}
          />
          {size !== "sm" ? (
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-sm">
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              </span>
            </div>
          ) : null}
          {text && (
            <span
              className={cn(
                "absolute font-display font-extrabold tracking-tight text-white/90",
                size === "sm" ? "inset-0 grid place-items-center text-base" : size === "lg" ? "bottom-5 left-5 text-5xl" : "bottom-3 left-4 text-3xl",
              )}
            >
              {text}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
