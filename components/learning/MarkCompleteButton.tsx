"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconSpinner, IconCheck } from "@/components/auth/shared/icons";
import { ReviewModal } from "./ReviewModal";

interface MarkCompleteButtonProps {
  courseId: string;
  itemId: string;
  isCompleted: boolean;
  className?: string;
}

const REVIEW_COOLDOWN_DAYS = 7;
const REVIEW_COOLDOWN_MS = REVIEW_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export function MarkCompleteButton({ courseId, itemId, isCompleted, className = "" }: MarkCompleteButtonProps) {
  const [marking, setMarking] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const router = useRouter();

  const handleComplete = async () => {
    if (isCompleted) return;
    
    setMarking(true);
    try {
      await fetch(`/api/proxy/learning/courses/${courseId}/items/${itemId}/complete`, { 
        method: "POST" 
      });
      router.refresh();

      // Check if we should prompt for a review
      const lastPrompt = localStorage.getItem(`last_review_prompt_${courseId}`);
      const hasReviewedStorage = localStorage.getItem(`has_reviewed_${courseId}`);

      if (hasReviewedStorage === "true") {
        return; // Already reviewed
      }

      const now = Date.now();
      if (lastPrompt && now - parseInt(lastPrompt, 10) < REVIEW_COOLDOWN_MS) {
        return; // On cooldown
      }

      // Check with server to see if they've already reviewed
      const reviewCheckRes = await fetch(`/api/proxy/courses/${courseId}/reviews/me`);
      if (reviewCheckRes.ok) {
        const reviewData = await reviewCheckRes.json();
        if (reviewData?.data?.id) {
          // Already reviewed on server, save to local storage to prevent future checks
          localStorage.setItem(`has_reviewed_${courseId}`, "true");
          return;
        }
      }

      // Safe to prompt
      setShowReviewModal(true);
      localStorage.setItem(`last_review_prompt_${courseId}`, now.toString());

    } catch (e) {
      console.error("Failed to mark as complete", e);
    } finally {
      setMarking(false);
    }
  };

  const handleReviewDismiss = () => {
    // Already set last_review_prompt_ in handleComplete, so we just close
  };

  return (
    <>
      <button
        onClick={handleComplete}
        disabled={isCompleted || marking}
        className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-extrabold transition ${
          isCompleted 
            ? "cursor-default bg-[#e7f6ee] text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]" 
            : "bg-[#2D6A4F] text-white shadow-sm shadow-[#2D6A4F]/20 hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
        } ${className}`}
      >
        {marking ? (
          <IconSpinner className="w-4 h-4 animate-spin" />
        ) : isCompleted ? (
          <span className="w-4 h-4 [&>svg]:w-full [&>svg]:h-full"><IconCheck /></span>
        ) : null}
        
        {isCompleted ? "Completed" : marking ? "Marking..." : "Mark as Complete"}
      </button>

      <ReviewModal 
        courseId={courseId} 
        isOpen={showReviewModal} 
        onOpenChange={setShowReviewModal} 
        onDismiss={handleReviewDismiss} 
      />
    </>
  );
}
