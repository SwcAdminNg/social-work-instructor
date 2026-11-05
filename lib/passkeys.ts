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
    return await call<unknown>("/login/verify", {
      method: "POST",
      body: JSON.stringify({ challenge_token, credential, keep_logged_in: keepLoggedIn }),
    });
  } catch (error) {
    throw explain(error, "sign-in");
  }
}
