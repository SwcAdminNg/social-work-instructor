"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthPageShell } from "./shared/AuthPageShell";
import { AuthDivider, AuthHeading, AuthMessage, authButton, authLink } from "./shared/AuthUI";
import { FloatingInput } from "./shared/FloatingInput";
import { PasswordToggle } from "./shared/PasswordToggle";
import { PasskeyButton, PasskeyContinueCard, usePasskeySignIn } from "./shared/PasskeySignIn";
import { TwoFactorSetup } from "./TwoFactorSetup";
import { TwoFactorVerify } from "./TwoFactorVerify";
import { IconArrowRight, IconCheck, IconLock, IconUser, IconSpinner } from "./shared/icons";

type Step =
  | { name: "credentials" }
  | { name: "setup"; challengeToken: string }
  | { name: "verify"; challengeToken: string; method: "EMAIL" | "TOTP" };

export default function Login({ statsData }: { statsData?: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [step, setStep] = useState<Step>({ name: "credentials" });
  const [finalizeError, setFinalizeError] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const passkey = usePasskeySignIn({
    identifier: email,
    keepLoggedIn,
    onError: (message) => setError(message),
    onSession: async (sessionData) => {
      setError("");
      await finalizeSession(sessionData);
    },
  });

  const finalizeSession = async (sessionData: any) => {
    setFinalizeError("");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        mode: "finalize",
        session: JSON.stringify(sessionData),
      });

      if (res?.error) {
        throw new Error("Failed to sign in. Please try again.");
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
      router.push(callbackUrl);
    } catch (err: any) {
      setFinalizeError(err.message || "Failed to sign in. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    if (!email) {
      setEmailError("Please enter your email or username.");
      emailRef.current?.focus();
      return;
    }
    if (!password) {
      setPasswordError("Please enter your password.");
      passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/proxy/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: email,
          password,
          keep_logged_in: keepLoggedIn,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to sign in. Please check your credentials.");
      }

      const status = data.data?.status;
      const challengeToken = data.data?.challenge?.challenge_token;

      if (status === "two_factor_setup_required" && challengeToken) {
        setStep({ name: "setup", challengeToken });
      } else if (status === "two_factor_verification_required" && challengeToken) {
        setStep({ name: "verify", challengeToken, method: data.data.challenge.method });
      } else if (data.data?.user) {
        // Reserved "success" status: login already completed without a 2FA step.
        await finalizeSession(data.data);
      } else {
        throw new Error("Failed to sign in. Please check your credentials.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step.name === "setup") {
    return (
      <AuthPageShell variant="login" statsData={statsData}>
        {finalizeError && <AuthMessage>{finalizeError}</AuthMessage>}
        <TwoFactorSetup
          api={{ kind: "challenge", challengeToken: step.challengeToken }}
          title="Set up two-factor authentication"
          description="Your account needs 2FA before you can continue. Choose how you'd like to receive codes."
          onBack={() => setStep({ name: "credentials" })}
          onComplete={(sessionData) => finalizeSession(sessionData)}
        />
      </AuthPageShell>
    );
  }

  if (step.name === "verify") {
    return (
      <AuthPageShell variant="login" statsData={statsData}>
        {finalizeError && <AuthMessage>{finalizeError}</AuthMessage>}
        <TwoFactorVerify
          challengeToken={step.challengeToken}
          method={step.method}
          onBack={() => setStep({ name: "credentials" })}
          onComplete={(sessionData) => finalizeSession(sessionData)}
        />
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell variant="login" statsData={statsData}>
      <AuthHeading
        eyebrow="Welcome back"
        title="Sign in to your account"
        intro="Continue to your instructor workspace on Social Work Nigeria."
      />

      {error && <AuthMessage>{error}</AuthMessage>}

      {passkey.continueAccount && (
        <>
          <PasskeyContinueCard
            account={passkey.continueAccount}
            busy={passkey.busy}
            onContinue={() => passkey.start(passkey.continueAccount?.email)}
            onUseAnother={() => emailRef.current?.focus()}
          />
          <AuthDivider className="mb-5">or sign in with your password</AuthDivider>
        </>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FloatingInput
          ref={emailRef}
          id="identifier"
          label="Email or username"
          type="text"
          value={email}
          onChange={(v) => {
            setEmail(v);
            if (emailError) setEmailError("");
          }}
          icon={<IconUser />}
          autoComplete="username webauthn"
          required
          error={emailError}
        />

        <FloatingInput
          ref={passwordRef}
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(v) => {
            setPassword(v);
            if (passwordError) setPasswordError("");
          }}
          icon={<IconLock />}
          autoComplete="current-password"
          required
          capsLockWarning
          error={passwordError}
          suffix={
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="group flex cursor-pointer select-none items-center gap-2">
            <button
              type="button"
              role="checkbox"
              aria-checked={keepLoggedIn}
              aria-label="Keep me logged in"
              onClick={() => setKeepLoggedIn((v) => !v)}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded"
            >
              <span
                aria-hidden="true"
                className={`flex h-[20px] w-[20px] items-center justify-center rounded-[4px] border-2 text-white ${
                  keepLoggedIn
                    ? "border-swc-deep bg-swc-deep dark:border-swc-mid dark:bg-swc-mid"
                    : "border-swc-ink-3 bg-swc-card group-hover:border-swc-label"
                }`}
              >
                {keepLoggedIn && <IconCheck />}
              </span>
            </button>
            <span className="text-[0.9rem] text-swc-ink-2">Keep me logged in</span>
          </label>

          <Link href="/forgot-password" className={`text-[0.9rem] ${authLink}`}>
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={loading} className={`${authButton} mt-1`}>
          {loading ? (
            <>
              <IconSpinner className="h-4 w-4 text-white/80" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <IconArrowRight />
            </>
          )}
        </button>
      </form>

      {/* Passkey: only when this account can use one */}
      {passkey.availableForTyped && !passkey.continueAccount && (
        <>
          <AuthDivider>or</AuthDivider>
          <PasskeyButton busy={passkey.busy} disabled={loading} onClick={() => passkey.start(email)} />
        </>
      )}

      <p className="mt-7 text-center text-[0.92rem] text-swc-ink-2">
        Don&apos;t have an account?{" "}
        <Link href="/register" className={authLink}>
          Create an account
        </Link>
      </p>

      <p className="mt-6 border-t border-swc-line pt-5 text-center text-[0.8rem] leading-relaxed text-swc-ink-3">
        By signing in, you agree to our{" "}
        <Link href="/terms-of-service" className={authLink}>
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className={authLink}>
          Privacy Policy
        </Link>
        .
      </p>
    </AuthPageShell>
  );
}
