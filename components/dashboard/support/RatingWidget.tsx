"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { StarRating } from "@/components/learning/StarRating";
import { IconSpinner } from "@/components/auth/shared/icons";

export function RatingWidget({
  ticketId,
  ticketStatus,
}: {
  ticketId: string;
  ticketStatus: string;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);

  if (submitted || alreadyRated) {
    return (
      <div className="flex items-center gap-3 text-sm font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl px-4 py-3.5">
        <CheckCircle2 className="w-5 h-5 shrink-0" />
        Thanks for rating your support experience!
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proxy/support/tickets/${ticketId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (res.status === 409) {
        setAlreadyRated(true);
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit your rating.");
      }

      setSubmitted(true);
      toast.success("Thanks for your feedback!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit your rating.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            This ticket is {ticketStatus === "CLOSED" ? "closed" : "resolved"}.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            How was your support experience?
          </p>
        </div>
        <StarRating rating={rating} onRatingChange={setRating} size={26} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          placeholder="Add an optional comment..."
          className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:border-transparent transition-all"
        />
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#2D6A4F] text-white text-sm font-bold hover:bg-[#1B4332] transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-sm shrink-0"
        >
          {submitting && <IconSpinner className="h-4 w-4 animate-spin" />}
          Submit Rating
        </button>
      </div>
    </form>
  );
}
