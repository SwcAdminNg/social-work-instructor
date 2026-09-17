"use client";

import { useState, useRef, useEffect } from "react";
import { ShieldCheck, Smartphone, Mail, ArrowLeft } from "lucide-react";
import { OtpInput } from "./shared/OtpInput";
import { IconSpinner } from "./shared/icons";

export function TwoFactorVerify({
  challengeToken,
  method,
  onComplete,
  onBack,
}: {
  challengeToken: string;
  method: "EMAIL" | "TOTP";
  onComplete: (session: any) => void;
  onBack?: () => void;
}) {
  const [code, setCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const verify = async (submittedCode: string) => {
    setError("");
    setConfirming(true);
    try {
      const res = await fetch("/api/proxy/auth/2fa/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_token: challengeToken, code: submittedCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Invalid or expired code");
      }
      onComplete(data.data);
    } catch (err: any) {
      setError(err.message);
      setCode("");
      setConfirming(false);
    }
  };

  const resend = async () => {
    if (resendCooldown > 0 || resending) return;
    setError("");
    setResending(true);
    try {
      const res = await fetch("/api/proxy/auth/2fa/login/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_token: challengeToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Could not resend code. Please try again.");
      }
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="w-11 h-11 rounded-xl bg-[#2D6A4F]/10 dark:bg-[#52b788]/10 flex items-center justify-center mb-4">
          <ShieldCheck className="w-5 h-5 text-[#2D6A4F] dark:text-[#52b788]" />
        </div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-[1.5rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2 outline-none"
        >
          Two-factor verification
        </h1>
        <p className="text-[0.87rem] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          {method === "TOTP" ? (
            <>
              <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
              Enter the 6-digit code from your authenticator app.
            </>
          ) : (
            <>
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              Enter the 6-digit code we emailed you.
            </>
          )}
        </p>
      </div>

      {error && (
        <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      <OtpInput value={code} onChange={setCode} onComplete={verify} disabled={confirming} autoFocus />

      {confirming && (
        <p className="mt-3 flex items-center justify-center gap-2 text-[0.8rem] text-gray-500 dark:text-gray-400">
          <IconSpinner className="w-3.5 h-3.5" /> Verifying…
        </p>
      )}

      <div className="mt-6 flex items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-[0.83rem] font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-150"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        ) : (
          <span />
        )}

        {method === "EMAIL" && (
          <button
            type="button"
            disabled={resendCooldown > 0 || resending}
            onClick={resend}
            className="text-[0.83rem] font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:text-[#1e4d38] dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
          </button>
        )}
      </div>
    </div>
  );
}
