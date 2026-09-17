"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

function SessionModal() {
  const { data: session, update } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const continueBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showModal) continueBtnRef.current?.focus();
  }, [showModal]);

  useEffect(() => {
    // If there is no session, or if NextAuth has already flagged an error, sign them out.
    if (!session) return;

    if ((session as any).error === "RefreshAccessTokenError") {
      signOut({ callbackUrl: "/login" });
      return;
    }

    const expiresAt = (session as any).expiresAt;
    if (!expiresAt) return;

    const expiryTime = expiresAt * 1000;

    const interval = setInterval(() => {
      const timeRemaining = expiryTime - Date.now();

      // If less than 60 seconds remaining, show modal
      if (timeRemaining <= 60000 && timeRemaining > 0) {
        setShowModal(true);
      } else if (timeRemaining <= 0) {
        // Expired completely
        setShowModal(true);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [session]);

  const handleContinue = async () => {
    setIsRefreshing(true);
    await update({ action: "refresh" });
    setIsRefreshing(false);
    setShowModal(false);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-expiring-title"
        aria-describedby="session-expiring-description"
        className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300"
      >
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 id="session-expiring-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Session Expiring Soon
        </h3>
        <p id="session-expiring-description" className="text-gray-600 dark:text-gray-400 font-medium mb-8">
          Your session is about to expire due to inactivity. Would you like to stay signed in?
        </p>
        <div className="flex flex-col sm:flex-row w-full gap-4">
          <button
            onClick={handleLogout}
            className="flex-1 px-6 py-3 rounded-full font-bold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Log Out
          </button>
          <button
            ref={continueBtnRef}
            onClick={handleContinue}
            disabled={isRefreshing}
            className="flex-1 px-6 py-3 rounded-full font-bold bg-[#2D6A4F] text-white hover:bg-[#1e4d38] transition-colors disabled:opacity-70 flex justify-center items-center"
          >
            {isRefreshing ? "Refreshing..." : "Continue Session"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SessionMonitor({ children, session }: { children: React.ReactNode, session: any }) {
  return (
    <SessionProvider session={session}>
      {children}
      <SessionModal />
    </SessionProvider>
  );
}
