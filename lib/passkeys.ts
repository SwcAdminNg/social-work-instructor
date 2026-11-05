"use client";

import {
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration,
  WebAuthnAbortService,
} from "@simplewebauthn/browser";

export type Passkey = {
  id: string;
  name: string;
  created_at: string;
  last_used_at?: string | null;
  provider?: string | null;
  synced?: boolean;
  created_user_agent?: string | null;
};

type Envelope<T> = { data?: T; message?: string };

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy/auth/passkeys${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const json = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok) {
    const fallback = res.status === 404 ? "Passkey sign-in is not available yet. Please use your password." : "Something went wrong. Please try again.";
    throw new PasskeyError(res.status === 404 ? fallback : json.message || fallback, res.status);
  }
  return json.data as T;
}

export class PasskeyError extends Error {
  constructor(message: string, readonly status?: number, readonly cancelled = false) {
    super(message);
  }
}

/** Turns browser WebAuthn errors into plain messages; cancelling is not an error. */
function explain(error: unknown, kind: "add" | "sign-in"): PasskeyError {
  if (error instanceof PasskeyError) return error;
  const name = (error as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "AbortError") {
    return new PasskeyError(kind === "add" ? "Passkey setup was cancelled." : "Passkey sign-in was cancelled.", undefined, true);
  }
  if (name === "InvalidStateError") {
    return new PasskeyError("This device already has a passkey for your account.");
  }
  if (name === "SecurityError") {
    return new PasskeyError("Passkeys are not available on this address. Use the main website address.");
  }
  return new PasskeyError(kind === "add" ? "We could not add this passkey. Please try again." : "We could not sign you in with a passkey. Please try again.");
}

export const passkeysSupported = () => typeof window !== "undefined" && browserSupportsWebAuthn();
export const autofillSupported = () => browserSupportsWebAuthnAutofill().catch(() => false);
/** True when this device has a built-in fingerprint, face or screen-lock authenticator. */
export const deviceUnlockAvailable = () => platformAuthenticatorIsAvailable().catch(() => false);
export const cancelPasskeyCeremony = () => WebAuthnAbortService.cancelCeremony();

export const listPasskeys = () => call<Passkey[]>("");
export const renamePasskey = (id: string, name: string) => call<Passkey>(`/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
export const removePasskey = (id: string) => call<{ id: string }>(`/${id}`, { method: "DELETE" });

export async function addPasskey(name?: string): Promise<Passkey> {
  try {
    const { options, challenge_token } = await call<{ options: never; challenge_token: string }>("/register/options", {
      method: "POST",
      body: "{}",
    });
    const credential = await startRegistration(options);
    return await call<Passkey>("/register/verify", {
      method: "POST",
      body: JSON.stringify({ challenge_token, credential, name }),
    });
  } catch (error) {
    throw explain(error, "add");
  }
}

/**
 * Signs in with a passkey and returns the session data to finalise with
 * next-auth. With `autofill`, the browser offers passkeys in the username
 * field's suggestions instead of opening a dialog straight away.
 */
export async function signInWithPasskey({
  identifier,
  keepLoggedIn = false,
  autofill = false,
}: { identifier?: string; keepLoggedIn?: boolean; autofill?: boolean } = {}): Promise<unknown> {
  try {
    const { options, challenge_token } = await call<{ options: never; challenge_token: string }>("/login/options", {
      method: "POST",
      body: JSON.stringify({ identifier: identifier || undefined }),
    });
    const credential = await startAuthentication(options, autofill);
    const session = await call<unknown>("/login/verify", {
      method: "POST",
      body: JSON.stringify({ challenge_token, credential, keep_logged_in: keepLoggedIn }),
    });
    // Remember the account on this device so next time sign-in can offer it directly.
    rememberFromSession(session);
    return session;
  } catch (error) {
    throw explain(error, "sign-in");
  }
}

// -- remembering which accounts use passkeys on this device -------------------
//
// After someone adds a passkey here or signs in with one, this browser remembers
// the account (never the passkey itself). The sign-in page uses it to offer
// "Continue as ..." with a fingerprint straight away, and to show the passkey
// option only to people who can actually use it.

export type RememberedAccount = { email: string; username?: string | null; name?: string | null; lastUsed: number };

const ACCOUNTS_KEY = "swcl:passkey-accounts";
const CHANGE_EVENT = "swcl:passkey-accounts-changed";
const EMPTY: RememberedAccount[] = [];
let cachedRaw: string | null = null;
let cachedAccounts: RememberedAccount[] = EMPTY;

function readAccounts(): RememberedAccount[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(ACCOUNTS_KEY);
  if (raw === cachedRaw) return cachedAccounts;
  cachedRaw = raw;
  try {
    const parsed = JSON.parse(raw || "[]");
    cachedAccounts = Array.isArray(parsed) ? parsed.filter((a) => a && typeof a.email === "string") : EMPTY;
  } catch {
    cachedAccounts = EMPTY;
  }
  return cachedAccounts;
}

function writeAccounts(accounts: RememberedAccount[]) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, 5)));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const same = (a: string | null | undefined, b: string | null | undefined) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/** Snapshot accessor for useSyncExternalStore; the newest account comes first. */
export const getRememberedAccounts = readAccounts;
export const getServerRememberedAccounts = () => EMPTY;
export function subscribeRememberedAccounts(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function findRememberedAccount(identifier: string, accounts = readAccounts()) {
  return accounts.find((a) => same(a.email, identifier) || same(a.username, identifier)) ?? null;
}

export function rememberPasskeyAccount(account: { email?: string | null; username?: string | null; name?: string | null }) {
  if (typeof window === "undefined" || !account.email) return;
  const rest = readAccounts().filter((a) => !same(a.email, account.email));
  writeAccounts([{ email: account.email, username: account.username ?? null, name: account.name ?? null, lastUsed: Date.now() }, ...rest]);
}

export function forgetPasskeyAccount(emailOrUsername?: string | null) {
  if (typeof window === "undefined" || !emailOrUsername) return;
  writeAccounts(readAccounts().filter((a) => !same(a.email, emailOrUsername) && !same(a.username, emailOrUsername)));
}

/** Remembers the account from a passkey sign-in response. */
export function rememberFromSession(session: unknown) {
  const user = (session as { user?: { email?: string; username?: string; first_name?: string; last_name?: string } })?.user;
  if (!user?.email) return;
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || null;
  rememberPasskeyAccount({ email: user.email, username: user.username, name });
}

/** Asks the API whether an email or username has a passkey for this site. Never throws. */
export async function checkPasskeyAvailable(identifier: string, signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch("/api/proxy/auth/passkeys/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
      signal,
    });
    if (!res.ok) return false;
    const json = await res.json().catch(() => null);
    return Boolean(json?.data?.available);
  } catch {
    return false;
  }
}
