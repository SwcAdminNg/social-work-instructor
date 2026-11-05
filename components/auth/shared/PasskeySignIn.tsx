"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Fingerprint } from "lucide-react";
import { autofillSupported, cancelPasskeyCeremony, PasskeyError, passkeysSupported, signInWithPasskey } from "@/lib/passkeys";
import { IconSpinner } from "./icons";

const noopSubscribe = () => () => {};

/**
 * "Sign in with fingerprint or face" button, plus passkey suggestions in the
 * username field's autofill where the browser supports it. Hidden on browsers
 * without passkey support.
 */
export function PasskeySignIn({
  identifier,
  keepLoggedIn,
  onSession,
  onError,
  disabled,
}: {
  identifier: string;
  keepLoggedIn: boolean;
  onSession: (sessionData: unknown) => Promise<void> | void;
  onError: (message: string) => void;
  disabled?: boolean;
}) {
  const supported = useSyncExternalStore(noopSubscribe, passkeysSupported, () => false);
  const [busy, setBusy] = useState(false);
  const handlers = useRef({ onSession, onError });
  // Keep the latest callbacks for the long-running autofill request.
  useEffect(() => {
    handlers.current = { onSession, onError };
  }, [onSession, onError]);

  // Offer saved passkeys in the username field's autofill list.
  useEffect(() => {
    if (!supported) return;
    let active = true;
    autofillSupported().then((ok) => {
      if (!ok || !active) return;
      signInWithPasskey({ autofill: true })
        .then(async (session) => {
          if (!active) return;
          setBusy(true);
          await handlers.current.onSession(session);
        })
        .catch((error: PasskeyError) => {
          // This runs in the background: only speak up when someone picked a
          // passkey and it was refused (not for cancels or setup problems).
          if (active && !error.cancelled && (error.status === 401 || error.status === 403)) {
            handlers.current.onError(error.message);
          }
        });
    });
    return () => {
      active = false;
      cancelPasskeyCeremony();
    };
  }, [supported]);

  if (!supported) return null;

  const start = async () => {
    setBusy(true);
    try {
      const session = await signInWithPasskey({ identifier: identifier.trim() || undefined, keepLoggedIn });
      await onSession(session);
    } catch (error) {
      const e = error as PasskeyError;
      if (!e.cancelled) onError(e.message);
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={busy || disabled}
        className="group flex h-[56px] w-full items-center justify-center gap-3 rounded-xl border-[1.5px] border-[#cfd4cc] bg-white text-[0.98rem] font-semibold text-[#10231a] transition-colors duration-150 hover:border-[#2D6A4F] hover:bg-[#f3faf6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 disabled:cursor-progress disabled:opacity-70 dark:border-white/15 dark:bg-[#121e18] dark:text-white dark:hover:border-[#74c69d] dark:hover:bg-[#16231c] dark:focus-visible:ring-[#74c69d] dark:focus-visible:ring-offset-[#0b1410]"
      >
        {busy ? (
          <IconSpinner className="h-5 w-5 animate-spin text-[#2D6A4F] dark:text-[#95d5b2]" />
        ) : (
          <Fingerprint className="h-6 w-6 text-[#2D6A4F] transition-transform duration-200 group-hover:scale-110 dark:text-[#95d5b2]" aria-hidden="true" />
        )}
        {busy ? "Waiting for your passkey…" : "Sign in with fingerprint or face"}
      </button>
      <p className="mt-2 text-center text-[0.8rem] text-gray-500 dark:text-gray-400">
        Uses a passkey saved on this device or your phone. No password needed.
      </p>
    </div>
  );
}
