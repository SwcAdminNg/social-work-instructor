"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Fingerprint, X } from "lucide-react";
import { IconSpinner } from "@/components/auth/shared/icons";
import { addPasskey, deviceUnlockAvailable, listPasskeys, type Passkey, PasskeyError, passkeysSupported } from "@/lib/passkeys";
import { PASSKEYS_QUERY_KEY } from "./PasskeySettings";

const DISMISS_KEY = "swcl:passkey-prompt-dismissed";

/**
 * A one-time card in the dashboard inviting people who signed in with a password
 * to add a passkey on this device. Only shown when the device has a built-in
 * fingerprint, face or screen-lock authenticator and the account has no passkeys.
 */
export function PasskeyPrompt() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!passkeysSupported() || localStorage.getItem(DISMISS_KEY)) return;
    let active = true;
    (async () => {
      if (!(await deviceUnlockAvailable())) return;
      const passkeys = await listPasskeys().catch(() => null);
      if (active && passkeys && passkeys.length === 0) setVisible(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Settings has its own passkey section.
  if (!visible || pathname.startsWith("/dashboard/settings")) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const setUp = async () => {
    setBusy(true);
    try {
      const passkey = await addPasskey();
      queryClient.setQueryData<Passkey[]>(PASSKEYS_QUERY_KEY, (current = []) => [passkey, ...current]);
      toast.success("Passkey added. Next time, sign in with your fingerprint or face.");
      dismiss();
    } catch (error) {
      const e = error as PasskeyError;
      if (!e.cancelled) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-labelledby="passkey-prompt-title"
      aria-describedby="passkey-prompt-body"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-[#121a16] sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <button type="button" onClick={dismiss} className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-4 pr-6">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#95d5b2]">
          <Fingerprint className="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <p id="passkey-prompt-title" className="font-bold text-gray-900 dark:text-white">Sign in faster next time</p>
          <p id="passkey-prompt-body" className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Use your fingerprint, face or screen lock instead of your password and verification code.
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={setUp}
          disabled={busy}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] text-sm font-semibold text-white hover:bg-[#1B4332] disabled:opacity-70"
        >
          {busy ? <IconSpinner className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" aria-hidden="true" />}
          {busy ? "Follow your device’s prompt…" : "Set up a passkey"}
        </button>
        <button type="button" onClick={dismiss} className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
          Not now
        </button>
      </div>
    </div>
  );
}
