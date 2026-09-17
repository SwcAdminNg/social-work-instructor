"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { StarRating } from "./StarRating";
import { IconSpinner } from "@/components/auth/shared/icons";
import { toast } from "sonner";

interface ReviewModalProps {
  courseId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
  existingReview?: {
    id: string;
    rating: number;
    review_text?: string;
  } | null;
  onReviewSubmitted?: () => void;
}

export function ReviewModal({
  courseId,
  isOpen,
  onOpenChange,
  onDismiss,
  existingReview,
  onReviewSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingReview) {
        setRating(existingReview.rating);
        setReviewText(existingReview.review_text || "");
      } else {
        setRating(0);
        setReviewText("");
      }
    }
  }, [isOpen, existingReview]);

  const isEditing = !!existingReview;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }

    setSubmitting(true);
    try {
      const url = isEditing
        ? `/api/proxy/courses/reviews/${existingReview.id}`
        : `/api/proxy/courses/${courseId}/reviews`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          review_text: reviewText.trim() || undefined,
        }),
      });

      if (!res.ok) {
        if (res.status === 409) {
          toast.error("You have already reviewed this course.");
        } else {
          throw new Error("Failed to submit review");
        }
        return;
      }

      toast.success(isEditing ? "Review updated successfully!" : "Thank you for your feedback!");
      if (onReviewSubmitted) onReviewSubmitted();
      onOpenChange(false);
    } catch (error) {
      toast.error("An error occurred while submitting your review.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    onDismiss();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212] p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl">
          <div className="flex flex-col space-y-2 text-center sm:text-left">
            <Dialog.Title className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              How would you rate this course so far?
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400">
              Your feedback helps us improve and helps other students choose the right course.
            </Dialog.Description>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              <StarRating rating={rating} onRatingChange={setRating} size={40} />
              <span className="text-sm font-medium text-gray-500">
                {rating === 0 ? "Select a rating" : `${rating} out of 5 stars`}
              </span>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="review"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
              >
                Tell us more (Optional)
              </label>
              <textarea
                id="review"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you like or dislike?"
                className="flex min-h-[100px] w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm ring-offset-white dark:ring-offset-gray-950 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0">
              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-50"
              >
                Ask me later
              </button>
              <button
                type="submit"
                disabled={submitting || rating === 0}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2D6A4F] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] disabled:pointer-events-none disabled:opacity-50 shadow-sm"
              >
                {submitting ? (
                  <IconSpinner className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isEditing ? "Update Review" : "Submit Review"}
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              onClick={handleDismiss}
              className="absolute right-4 top-4 rounded-sm p-2 opacity-70 ring-offset-white dark:ring-offset-gray-950 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500 text-gray-500 dark:text-gray-400"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
