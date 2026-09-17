"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Loader2 } from "lucide-react";
import { toast } from "sonner";

type CourseBookmarkButtonProps = {
  courseId: string;
  initialBookmarked?: boolean | null;
  courseTitle: string;
  variant?: "floating" | "inline";
};

export function CourseBookmarkButton({
  courseId,
  initialBookmarked = false,
  courseTitle,
  variant = "floating",
}: CourseBookmarkButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [bookmarked, setBookmarked] = useState(initialBookmarked === true);
  const [pending, setPending] = useState(false);

  async function toggleBookmark() {
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);
    setPending(true);

    try {
      const res = await fetch(`/api/proxy/courses/${courseId}/bookmark`, {
        method: nextBookmarked ? "POST" : "DELETE",
      });

      if (res.status === 401) {
        const query = searchParams.toString();
        const callbackUrl = query ? `${pathname}?${query}` : pathname;
        router.push(`/logout?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data?.message ||
            (nextBookmarked
              ? "Unable to save this course."
              : "Unable to remove this course from saved courses."),
        );
      }

      toast.success(
        nextBookmarked ? "Course saved." : "Course removed from saved.",
      );
      router.refresh();
    } catch (error) {
      setBookmarked(!nextBookmarked);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update this course right now.",
      );
    } finally {
      setPending(false);
    }
  }

  const label = bookmarked ? "Saved Course" : "Save Course";
  const className =
    variant === "inline"
      ? `inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border px-4 text-sm font-extrabold transition disabled:cursor-wait disabled:opacity-75 ${
          bookmarked
            ? "border-[#2D6A4F] bg-[#e7f6ee] text-[#2D6A4F] hover:bg-[#d8f3dc] dark:border-[#52b788]/50 dark:bg-[#52b788]/15 dark:text-[#b7e4c7] dark:hover:bg-[#52b788]/25"
            : "border-[#b7e4c7] bg-white text-[#2D6A4F] hover:bg-[#f0fbf5] dark:border-[#27433a] dark:bg-[#111525] dark:text-[#b7e4c7] dark:hover:bg-[#183026]"
        }`
      : `absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-md border shadow-sm backdrop-blur transition disabled:cursor-wait disabled:opacity-75 ${
          bookmarked
            ? "border-[#2D6A4F] bg-[#2D6A4F] text-white hover:bg-[#1B4332] dark:border-[#52b788] dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
            : "border-white/70 bg-white/95 text-slate-700 hover:bg-[#f0fbf5] hover:text-[#2D6A4F] dark:border-white/10 dark:bg-[#111525]/95 dark:text-slate-200 dark:hover:bg-[#183026] dark:hover:text-[#b7e4c7]"
        }`;

  return (
    <button
      type="button"
      aria-pressed={bookmarked}
      aria-label={
        bookmarked
          ? `Remove ${courseTitle} from saved courses`
          : `Save ${courseTitle}`
      }
      title={bookmarked ? "Remove from saved" : "Save course"}
      onClick={toggleBookmark}
      disabled={pending}
      className={className}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
      )}
      {variant === "inline" && <span>{pending ? "Updating..." : label}</span>}
    </button>
  );
}
