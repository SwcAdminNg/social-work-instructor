"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AuthPageShell } from "./shared/AuthPageShell";
import { AuthHeading, AuthMessage, authButton, authLink } from "./shared/AuthUI";
import { PasswordChecklist, PASSWORD_MIN } from "./shared/PasswordChecklist";
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
    if (password.length < PASSWORD_MIN) {
      setPasswordError(`Use at least ${PASSWORD_MIN} characters.`);
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
        <AuthHeading
          icon={<CheckCircle2 className="h-5 w-5" />}
          eyebrow="All set"
          title="Password reset"
          headingRef={doneHeadingRef}
          intro="Your password has been changed successfully. You can now sign in with your new password."
        />

        <Link href="/login" className={authButton}>
          Continue to sign in
          <IconArrowRight />
        </Link>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell variant="reset-password" statsData={statsData}>
      <AuthHeading
        eyebrow="Set new password"
        title="Reset your password"
        intro="Your new password must be different from previously used passwords."
      />

      {error && <AuthMessage>{error}</AuthMessage>}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
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
          capsLockWarning
          describedById={password ? "reset-password-rules" : undefined}
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
          capsLockWarning
          error={confirmPasswordError}
          suffix={
            <PasswordToggle
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((v) => !v)}
            />
          }
        />
        {password && <PasswordChecklist id="reset-password-rules" password={password} confirm={confirmPassword} />}

        <button type="submit" disabled={loading} className={`${authButton} mt-1`}>
          {loading ? (
            <>
              <IconSpinner className="h-4 w-4 text-white/80" />
              Resetting…
            </>
          ) : (
            <>
              Reset password
              <IconArrowRight />
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-[0.92rem]">
        <Link href="/login" className={authLink}>
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
          <IconSpinner className="h-6 w-6 animate-spin text-swc-label" />
        </div>
      </AuthPageShell>
    }>
      <ResetPasswordForm statsData={statsData} />
    </Suspense>
  );
}
