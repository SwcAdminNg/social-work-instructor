"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, FileQuestion, RefreshCw, ShieldOff, WifiOff } from "lucide-react";
import { Button, ButtonLink, EmptyState } from "@/components/ui/primitives";

/** Shown when the course can't be loaded on the server (missing, no access, or an outage). */
export function CourseUnavailable({ status }: { status: number }) {
  const router = useRouter();
  const notFound = status === 404;
  const forbidden = status === 403 || status === 401;
  return (
    <div className="mx-auto w-full max-w-2xl py-10 sm:py-16">
      <EmptyState
        icon={notFound ? FileQuestion : forbidden ? ShieldOff : WifiOff}
        title={notFound ? "We couldn't find this course" : forbidden ? "You don't have access to this course" : "This course didn't load"}
        description={
          notFound
            ? "It may have been deleted, or the link is out of date."
            : forbidden
              ? "Only the course's instructors and people with an editing role can open it. Ask the course owner or an administrator if you need access."
              : "Something went wrong on our side. Check your connection and try again."
        }
        action={
          <>
            {!notFound && !forbidden && (
              <Button icon={RefreshCw} onClick={() => router.refresh()}>
                Try again
              </Button>
            )}
            <ButtonLink href="/dashboard/courses" variant={notFound || forbidden ? "primary" : "outline"} icon={ArrowLeft}>
              Back to my courses
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}
