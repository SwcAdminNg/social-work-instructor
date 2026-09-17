"use client";

import { useEffect } from "react";

export type DashboardBadgeCounts = {
  unread_notifications_count: number;
  unread_community_messages_count: number;
  cart_item_count: number;
  open_support_tickets_count: number;
};

export function DashboardBadgeSync({ counts }: { counts: DashboardBadgeCounts }) {
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("dashboard:overview-counts", { detail: counts }),
    );
  }, [counts]);

  return null;
}
