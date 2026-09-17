"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthPageShell } from "./shared/AuthPageShell";
import { FloatingInput } from "./shared/FloatingInput";
import { PasswordToggle } from "./shared/PasswordToggle";
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
        {finalizeError && (
          <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
            {finalizeError}
          </div>
        )}
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
        {finalizeError && (
          <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
            {finalizeError}
          </div>
        )}
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
      {/* Heading */}
      <div className="mb-8">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#2D6A4F] dark:text-[#52b788] mb-2">
          Welcome back
        </p>
        <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
          Sign in to your account
        </h1>
        <p className="text-[0.87rem] text-gray-500 dark:text-gray-400">
          Continue to your instructor workspace on Social Work Nigeria.
        </p>
      </div>

      {error && (
        <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Email or Username */}
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
          autoComplete="username"
          required
          error={emailError}
        />

        {/* Password */}
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
          error={passwordError}
          suffix={
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          }
        />

        {/* Keep me logged in + Forgot password */}
        <div className="flex items-center justify-between pt-0.5">
          {/* Custom checkbox */}
          <label className="flex items-center gap-2 cursor-pointer group select-none">
            <button
              type="button"
              role="checkbox"
              aria-checked={keepLoggedIn}
              aria-label="Keep me logged in"
              onClick={() => setKeepLoggedIn((v) => !v)}
              className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] focus-visible:ring-offset-1"
            >
              <span
                aria-hidden="true"
                className={`
                  w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center
                  transition-all duration-150
                  ${
                    keepLoggedIn
                      ? "bg-[#2D6A4F] border-[#2D6A4F] dark:bg-[#2D6A4F] dark:border-[#2D6A4F]"
                      : "bg-white dark:bg-white/5 border-gray-300 dark:border-white/20 group-hover:border-[#2D6A4F] dark:group-hover:border-[#52b788]"
                  }
                `}
              >
                {keepLoggedIn && <IconCheck />}
              </span>
            </button>
            <span className="text-[0.83rem] text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-150">
              Keep me logged in
            </span>
          </label>

          <Link
            href="/forgot-password"
            className="text-[0.83rem] font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:text-[#1e4d38] dark:hover:text-white no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className={`
            relative mt-2 w-full h-[52px] rounded-xl font-bold text-[0.93rem] text-white
            bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68]
            shadow-lg shadow-green-900/20 hover:shadow-green-900/30
            transition-all duration-200 hover:-translate-y-0.5
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2
            disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0
            overflow-hidden
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2.5">
              <IconSpinner className="w-4 h-4 text-white/80" />
              Signing in…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Sign in
              <IconArrowRight />
            </span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6" aria-hidden="true">
        <div className="flex-1 h-px bg-gray-200 dark:bg-white/8" />
        <span className="text-[0.75rem] text-gray-500 dark:text-gray-600 font-medium">
          or
        </span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-white/8" />
      </div>

      {/* Register link */}
      <p className="text-center text-[0.85rem] text-gray-500 dark:text-gray-400">
        Don't have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:text-[#1e4d38] dark:hover:text-white no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded"
        >
          Create an account
        </Link>
      </p>

      {/* Footer note */}
      <p className="mt-10 text-center text-[0.72rem] text-gray-500 dark:text-gray-600 leading-relaxed">
        By signing in, you agree to our{" "}
        <Link
          href="/terms-of-service"
          className="underline hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-150"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy-policy"
          className="underline hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-150"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </AuthPageShell>
  );
}
