"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthPageShell } from "./shared/AuthPageShell";
import { FloatingInput } from "./shared/FloatingInput";
import { PasswordToggle } from "./shared/PasswordToggle";
import { IconArrowRight, IconLock, IconSpinner } from "./shared/icons";

function ResetPasswordForm({ statsData }: { statsData?: any }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const doneHeadingRef = useRef<HTMLHeadingElement>(null);

  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  useEffect(() => {
    if (done) doneHeadingRef.current?.focus();
  }, [done]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (!password) {
      setPasswordError("Please enter a new password.");
      return passwordRef.current?.focus();
    }
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your new password.");
      return confirmPasswordRef.current?.focus();
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setConfirmPasswordError("Passwords do not match.");
      confirmPasswordRef.current?.focus();
      return;
    }

    if (!token) {
      setError("Reset token is missing from the URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          new_password: password,
          confirm_password: confirmPassword
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthPageShell variant="reset-password" statsData={statsData}>
        <div className="mb-8">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#2D6A4F] dark:text-[#52b788] mb-2">
            All set
          </p>
          <h1
            ref={doneHeadingRef}
            tabIndex={-1}
            className="text-[1.75rem] sm:text-[2rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2 outline-none"
          >
            Password reset
          </h1>
          <p className="text-[0.87rem] text-gray-500 dark:text-gray-400">
            Your password has been changed successfully. You can now sign in
            with your new password.
          </p>
        </div>

        <Link
          href="/login"
          className={`
            flex items-center justify-center gap-2 mt-2 w-full h-[52px] rounded-xl font-bold text-[0.93rem] text-white no-underline
            bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68]
            shadow-lg shadow-green-900/20 hover:shadow-green-900/30
            transition-all duration-200 hover:-translate-y-0.5
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2
          `}
        >
          Continue to sign in
          <IconArrowRight />
        </Link>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell variant="reset-password" statsData={statsData}>
      {/* Heading */}
      <div className="mb-8">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#2D6A4F] dark:text-[#52b788] mb-2">
          Set new password
        </p>
        <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
          Reset your password
        </h1>
        <p className="text-[0.87rem] text-gray-500 dark:text-gray-400">
          Your new password must be different from previously used passwords.
        </p>
      </div>

      {error && (
        <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FloatingInput
          ref={passwordRef}
          id="password"
          label="New password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(v) => {
            setPassword(v);
            if (passwordError) setPasswordError("");
          }}
          icon={<IconLock />}
          autoComplete="new-password"
          required
          error={passwordError}
          suffix={
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          }
        />

        <FloatingInput
          ref={confirmPasswordRef}
          id="confirmPassword"
          label="Confirm new password"
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(v) => {
            setConfirmPassword(v);
            if (confirmPasswordError) setConfirmPasswordError("");
          }}
          icon={<IconLock />}
          autoComplete="new-password"
          required
          error={confirmPasswordError}
          suffix={
            <PasswordToggle
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((v) => !v)}
            />
          }
        />

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
              Resetting…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Reset password
              <IconArrowRight />
            </span>
          )}
        </button>
      </form>

      {/* Login link */}
      <p className="mt-6 text-center text-[0.85rem] text-gray-500 dark:text-gray-400">
        <Link
          href="/login"
          className="font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:text-[#1e4d38] dark:hover:text-white no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded"
        >
          Back to sign in
        </Link>
      </p>
    </AuthPageShell>
  );
}

export default function ResetPassword({ statsData }: { statsData?: any }) {
  return (
    <Suspense fallback={
      <AuthPageShell variant="reset-password" statsData={statsData}>
        <div className="flex items-center justify-center p-10">
          <IconSpinner className="w-6 h-6 text-[#2D6A4F] dark:text-[#52b788] animate-spin" />
        </div>
      </AuthPageShell>
    }>
      <ResetPasswordForm statsData={statsData} />
    </Suspense>
  );
}
