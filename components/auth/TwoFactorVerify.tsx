"use client";

import { useState, useRef, useEffect } from "react";
import { ShieldCheck, Smartphone, Mail, ArrowLeft } from "lucide-react";
import { OtpInput } from "./shared/OtpInput";
import { IconSpinner } from "./shared/icons";
import { AuthHeading, AuthMessage, authLink, authTextButton } from "./shared/AuthUI";

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
      <AuthHeading
        icon={<ShieldCheck className="h-5 w-5" />}
        title="Two-factor verification"
        headingRef={headingRef}
        intro={
          <p className="m-0 flex items-center gap-1.5">
            {method === "TOTP" ? (
              <>
                <Smartphone aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-swc-label" />
                Enter the 6-digit code from your authenticator app.
              </>
            ) : (
              <>
                <Mail aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-swc-label" />
                Enter the 6-digit code we emailed you.
              </>
            )}
          </p>
        }
      />

      {error && <AuthMessage>{error}</AuthMessage>}

      <OtpInput value={code} onChange={setCode} onComplete={verify} disabled={confirming} autoFocus />

      {confirming && (
        <p role="status" className="mt-3 flex items-center justify-center gap-2 text-[0.86rem] text-swc-ink-3">
          <IconSpinner className="h-3.5 w-3.5" /> Verifying…
        </p>
      )}

      <div className="mt-6 flex items-center justify-between">
        {onBack ? (
          <button type="button" onClick={onBack} className={authTextButton}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back
          </button>
        ) : (
          <span />
        )}

        {method === "EMAIL" && (
          <button
            type="button"
            disabled={resendCooldown > 0 || resending}
            onClick={resend}
            className={`${authLink} text-[0.9rem] disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60`}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
          </button>
        )}
      </div>
    </div>
  );
}
