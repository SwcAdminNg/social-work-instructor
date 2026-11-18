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
    <div className="mb-6 rounded-lg border border-swc-line bg-swc-mint p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-swc-deep text-sm font-bold text-white" aria-hidden="true">
          {initials(account) || "?"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.95rem] font-semibold text-swc-ink">{account.name || account.email}</p>
          {account.name && <p className="truncate text-[0.84rem] text-swc-ink-3">{account.email}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={onContinue}
        disabled={busy}
        className="swc-btn swc-btn--green mt-4 w-full gap-3 disabled:cursor-progress"
      >
        {busy ? <IconSpinner className="h-5 w-5 animate-spin text-white/90" /> : <Fingerprint className="h-6 w-6" aria-hidden="true" />}
        {busy ? "Waiting for your fingerprint or face…" : "Continue with fingerprint or face"}
      </button>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[0.84rem]">
        <button type="button" onClick={onUseAnother} className="min-h-[40px] rounded font-semibold text-swc-label underline underline-offset-4 hover:text-swc-ink">
          Use another account
        </button>
        <button
          type="button"
          onClick={() => forgetPasskeyAccount(account.email)}
          className="min-h-[40px] rounded text-swc-ink-2 underline underline-offset-4 hover:text-swc-ink"
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
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={busy || disabled}
        className="swc-btn swc-btn--outline w-full gap-3 disabled:cursor-progress"
      >
        {busy ? (
          <IconSpinner className="h-5 w-5 animate-spin text-swc-label" />
        ) : (
          <Fingerprint className="h-6 w-6 text-swc-label" aria-hidden="true" />
        )}
        {busy ? "Waiting for your fingerprint or face…" : "Sign in with fingerprint or face"}
      </button>
      <p className="mt-2 text-center text-[0.84rem] text-swc-ink-3">This account has a passkey. No password needed.</p>
    </div>
  );
}
