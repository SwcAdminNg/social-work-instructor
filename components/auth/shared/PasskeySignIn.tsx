"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Fingerprint } from "lucide-react";
import {
  autofillSupported,
  cancelPasskeyCeremony,
  checkPasskeyAvailable,
  findRememberedAccount,
  forgetPasskeyAccount,
  getRememberedAccounts,
  getServerRememberedAccounts,
  type PasskeyError,
  passkeysSupported,
  type RememberedAccount,
  signInWithPasskey,
  subscribeRememberedAccounts,
} from "@/lib/passkeys";
import { IconSpinner } from "./icons";

const noopSubscribe = () => () => {};
const useSupported = () => useSyncExternalStore(noopSubscribe, passkeysSupported, () => false);
const useRemembered = () =>
  useSyncExternalStore(subscribeRememberedAccounts, getRememberedAccounts, getServerRememberedAccounts);

type Callbacks = {
  onSession: (sessionData: unknown) => Promise<void> | void;
  onError: (message: string) => void;
};

/**
 * Smart passkey sign-in state for a sign-in form.
 *
 * The fingerprint option appears only when it can work: for an account this
 * device has used a passkey with before, or — once an email or username is typed
 * — when the API confirms that account has a passkey for this site. Saved
 * passkeys are also offered in the username field's autofill, which the browser
 * only shows when the device really has one.
 */
export function usePasskeySignIn({ identifier, keepLoggedIn, onSession, onError }: Callbacks & { identifier: string; keepLoggedIn: boolean }) {
  const supported = useSupported();
  const remembered = useRemembered();
  const [busy, setBusy] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);
  const handlers = useRef<Callbacks>({ onSession, onError });
  useEffect(() => {
    handlers.current = { onSession, onError };
  }, [onSession, onError]);

  const typed = identifier.trim();
  const typedKey = typed.toLowerCase();
  const rememberedMatch = typed ? findRememberedAccount(typed, remembered) : null;

  // Ask the API about a typed identifier, after a pause in typing.
  useEffect(() => {
    if (!supported || typed.length < 3 || rememberedMatch) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const available = await checkPasskeyAvailable(typed, controller.signal);
      if (!controller.signal.aborted) setDetected(available ? typedKey : null);
    }, 550);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [supported, typed, typedKey, rememberedMatch]);

  // Passkeys in the username field's autofill.
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
          // Background request: only speak up when a chosen passkey was refused.
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

  const start = async (forIdentifier?: string) => {
    setBusy(true);
    try {
      const session = await signInWithPasskey({ identifier: forIdentifier || undefined, keepLoggedIn });
      await handlers.current.onSession(session);
    } catch (error) {
      const e = error as PasskeyError;
      if (!e.cancelled) handlers.current.onError(e.message);
      // A passkey that no longer exists: stop suggesting it for this account.
      if (e.status === 401 && forIdentifier) forgetPasskeyAccount(forIdentifier);
      setBusy(false);
    }
  };

  return {
    supported,
    busy,
    start,
    /** The account to offer "Continue as" for, when nothing has been typed yet. */
    continueAccount: supported && !typed ? remembered[0] ?? null : null,
    /** Whether to offer the fingerprint button for the typed identifier. */
    availableForTyped: supported && !!typed && (!!rememberedMatch || detected === typedKey),
  };
}

const initials = (account: RememberedAccount) =>
  (account.name || account.email)
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

/** "Continue as …" card for the account this device last used a passkey with. */
export function PasskeyContinueCard({
  account,
  busy,
  onContinue,
  onUseAnother,
}: {
  account: RememberedAccount;
  busy: boolean;
  onContinue: () => void;
  onUseAnother: () => void;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-[#d9e7df] bg-white p-4 shadow-[0_12px_32px_-24px_rgba(18,62,41,0.5)] dark:border-white/10 dark:bg-[#121e18]">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#2D6A4F] text-sm font-bold text-white" aria-hidden="true">
          {initials(account) || "?"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.95rem] font-semibold text-[#10231a] dark:text-white">{account.name || account.email}</p>
          {account.name && <p className="truncate text-[0.82rem] text-gray-500 dark:text-gray-400">{account.email}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={onContinue}
        disabled={busy}
        className="group mt-4 flex h-[54px] w-full items-center justify-center gap-3 rounded-full bg-[#14402F] dark:bg-[#2D6A4F] text-[0.98rem] font-semibold text-white shadow-lg shadow-green-900/20 transition-colors hover:bg-[#1e4d38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 disabled:cursor-progress disabled:opacity-80 dark:focus-visible:ring-offset-[#0b1410]"
      >
        {busy ? <IconSpinner className="h-5 w-5 animate-spin text-white/90" /> : <Fingerprint className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />}
        {busy ? "Waiting for your fingerprint or face…" : "Continue with fingerprint or face"}
      </button>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[0.84rem]">
        <button type="button" onClick={onUseAnother} className="min-h-[40px] rounded-md font-semibold text-[#2D6A4F] hover:underline dark:text-[#95d5b2]">
          Use another account
        </button>
        <button
          type="button"
          onClick={() => forgetPasskeyAccount(account.email)}
          className="min-h-[40px] rounded-md text-gray-500 hover:text-gray-800 hover:underline dark:text-gray-400 dark:hover:text-gray-200"
        >
          Not you? Forget this account
        </button>
      </div>
    </div>
  );
}

/** Fingerprint button shown under the form when the typed account has a passkey. */
export function PasskeyButton({ busy, disabled, onClick }: { busy: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <div className="swcl-passkey-rise">
      <button
        type="button"
        onClick={onClick}
        disabled={busy || disabled}
        className="group flex h-[56px] w-full items-center justify-center gap-3 rounded-full border-[1.5px] border-[#2D6A4F]/40 bg-[#f3faf6] text-[0.98rem] font-semibold text-[#10231a] transition-colors duration-150 hover:border-[#2D6A4F] hover:bg-[#e8f5ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 disabled:cursor-progress disabled:opacity-70 dark:border-[#74c69d]/40 dark:bg-[#132119] dark:text-white dark:hover:border-[#74c69d] dark:focus-visible:ring-[#74c69d] dark:focus-visible:ring-offset-[#0b1410]"
      >
        {busy ? (
          <IconSpinner className="h-5 w-5 animate-spin text-[#2D6A4F] dark:text-[#95d5b2]" />
        ) : (
          <Fingerprint className="h-6 w-6 text-[#2D6A4F] transition-transform duration-200 group-hover:scale-110 dark:text-[#95d5b2]" aria-hidden="true" />
        )}
        {busy ? "Waiting for your fingerprint or face…" : "Sign in with fingerprint or face"}
      </button>
      <p className="mt-2 text-center text-[0.8rem] text-gray-500 dark:text-gray-400">This account has a passkey. No password needed.</p>
    </div>
  );
}
