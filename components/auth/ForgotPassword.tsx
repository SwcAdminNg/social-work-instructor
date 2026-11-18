"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthPageShell } from "./shared/AuthPageShell";
import { AuthHeading, AuthMessage, authButton, authLink } from "./shared/AuthUI";
import { FloatingInput } from "./shared/FloatingInput";
import { IconArrowRight, IconMail, IconSpinner } from "./shared/icons";

export default function ForgotPassword({ statsData }: { statsData?: any }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const sentHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (sent) sentHeadingRef.current?.focus();
  }, [sent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    if (!email) {
      setEmailError("Please enter your email address.");
      return emailRef.current?.focus();
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setEmailError("Enter a valid email address, like name@example.com.");
      return emailRef.current?.focus();
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to send reset link.");
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthPageShell variant="forgot-password">
        <AuthHeading
          icon={<MailCheck className="h-5 w-5" />}
          eyebrow="Check your inbox"
          title="Reset link sent"
          headingRef={sentHeadingRef}
          intro={
            <p className="m-0">
              We&apos;ve sent a password reset link to <span className="font-semibold text-swc-ink">{email}</span>. Follow the
              link in the email to choose a new password.
            </p>
          }
        />

        <p className="text-center text-[0.92rem] text-swc-ink-2">
          Didn&apos;t get the email?{" "}
          <button type="button" onClick={() => setSent(false)} className={authLink}>
            Try again
          </button>
        </p>

        <p className="mt-6 border-t border-swc-line pt-5 text-center text-[0.92rem]">
          <Link href="/login" className={authLink}>
            Back to sign in
          </Link>
        </p>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell variant="forgot-password" statsData={statsData}>
      <AuthHeading
        eyebrow="Forgot password"
        title="Forgot your password?"
        intro="Enter the email associated with your account and we'll send you a link to reset your password."
      />

      {error && <AuthMessage>{error}</AuthMessage>}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FloatingInput
          ref={emailRef}
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            if (emailError) setEmailError("");
          }}
          icon={<IconMail />}
          autoComplete="email"
          inputMode="email"
          required
          error={emailError}
        />

        <button type="submit" disabled={loading} className={`${authButton} mt-1`}>
          {loading ? (
            <>
              <IconSpinner className="h-4 w-4 text-white/80" />
              Sending link…
            </>
          ) : (
            <>
              Send reset link
              <IconArrowRight />
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-[0.92rem] text-swc-ink-2">
        Remember your password?{" "}
        <Link href="/login" className={authLink}>
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  );
}
