"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconSpinner } from "@/components/auth/shared/icons";

interface SubscriptionButtonProps {
  planId: string;
  price: number;
  isLoggedIn: boolean;
  planName: string;
  isHighlighted?: boolean;
  isCurrentPlan?: boolean;
  isPendingPlan?: boolean;
  hasActiveSubscription?: boolean;
  onSubscribeClick: () => void;
}

export function SubscriptionButton({ 
  planId, price, isLoggedIn, planName, isHighlighted, 
  isCurrentPlan, isPendingPlan, hasActiveSubscription,
  onSubscribeClick
}: SubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubscribeClick = () => {
    if (!isLoggedIn) {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.href));
      return;
    }
    onSubscribeClick();
  };

  return (
    <>
      <div className="flex flex-col gap-3 w-full">
        <button 
          onClick={handleSubscribeClick}
          disabled={loading || isCurrentPlan || isPendingPlan}
          className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold transition-all shadow-lg disabled:opacity-70 ${
            isCurrentPlan 
              ? "bg-gray-100 dark:bg-gray-800 text-gray-500 shadow-none cursor-not-allowed" 
              : isPendingPlan
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-none cursor-not-allowed"
                : isHighlighted 
                  ? "bg-[#52b788] hover:bg-[#40916c] text-white shadow-[#52b788]/20" 
                  : "bg-[#52b788] hover:bg-[#40916c] text-white shadow-[#52b788]/20"
          }`}
        >
          {loading ? <IconSpinner className="w-5 h-5 animate-spin" /> : null}
          {loading 
            ? "Processing..." 
            : isCurrentPlan 
              ? "Current Plan" 
              : isPendingPlan 
                ? "Pending Switch" 
                : hasActiveSubscription 
                  ? "Switch to this Plan" 
                  : "Subscribe Now"}
        </button>
        {error && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400 text-center">
            {error}
          </p>
        )}
        {/* Modal has been lifted to PricingPlanGrid */}
      </div>
    </>
  );
}
