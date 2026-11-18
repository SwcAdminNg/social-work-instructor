"use client";

import { useState, useRef, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ShieldCheck, Smartphone, Mail, Copy, Check, ArrowLeft, TriangleAlert } from "lucide-react";
import { OtpInput } from "./shared/OtpInput";
import { IconSpinner } from "./shared/icons";
import { AuthHeading, AuthMessage, authLink, authTextButton } from "./shared/AuthUI";

const methodButton =
  "flex items-center gap-4 rounded-lg border border-swc-line bg-swc-card p-4 text-left transition-colors hover:border-swc-mid disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-swc-line";
const methodTile = "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-swc-mint text-swc-label";

type SetupApi =
  | { kind: "challenge"; challengeToken: string }
  | { kind: "authenticated" };

type Method = "TOTP" | "EMAIL";
type Step = "choice" | "totp" | "email";

const ENDPOINTS = {
  challenge: {
    TOTP: {
      start: "/api/proxy/auth/2fa/setup/totp/start",
      confirm: "/api/proxy/auth/2fa/setup/totp/confirm",
    },
    EMAIL: {
      start: "/api/proxy/auth/2fa/setup/email/start",
      confirm: "/api/proxy/auth/2fa/setup/email/confirm",
    },
  },
  authenticated: {
    TOTP: {
      start: "/api/proxy/auth/2fa/totp/start",
      confirm: "/api/proxy/auth/2fa/totp/confirm",
    },
    EMAIL: {
      start: "/api/proxy/auth/2fa/email/start",
      confirm: "/api/proxy/auth/2fa/email/confirm",
    },
  },
};

export function TwoFactorSetup({
  api,
  onComplete,
  onBack,
  currentMethod,
  title = "Secure your account",
  description = "Choose how you'd like to receive your sign-in codes.",
}: {
  api: SetupApi;
  onComplete: (result: any) => void;
  onBack?: () => void;
  currentMethod?: Method | null;
  title?: string;
  description?: string;
}) {
  const [step, setStep] = useState<Step>("choice");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const [totpSecret, setTotpSecret] = useState("");
  const [totpQrDataUri, setTotpQrDataUri] = useState("");

  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingMethod, setPendingMethod] = useState<Method | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const body = (extra: Record<string, unknown> = {}) =>
    JSON.stringify(
      api.kind === "challenge" ? { challenge_token: api.challengeToken, ...extra } : extra,
    );

  const startCooldown = () => {
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
  };

  const selectMethod = (method: Method) => {
    if (api.kind === "authenticated") {
      setPendingMethod(method);
      return;
    }
    choose(method);
  };

  const choose = async (method: Method) => {
    setError("");
    setCode("");
    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS[api.kind][method].start, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Something went wrong. Please try again.");
      }

      if (method === "TOTP") {
        setTotpSecret(data.data?.secret || "");
        setTotpQrDataUri(data.data?.qr_code_data_uri || "");
        setStep("totp");
      } else {
        startCooldown();
        setStep("email");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
      const res = await fetch(ENDPOINTS[api.kind].EMAIL.start, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Could not resend code. Please try again.");
      }
      startCooldown();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const confirm = async (method: Method, submittedCode: string) => {
    setError("");
    setConfirming(true);
    try {
      const res = await fetch(ENDPOINTS[api.kind][method].confirm, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body({ code: submittedCode }),
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

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(totpSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can fail silently (e.g. insecure context); no-op.
    }
  };

  return (
    <div>
      <AuthHeading
        icon={<ShieldCheck className="h-5 w-5" />}
        title={step === "choice" ? title : "Enter verification code"}
        headingRef={headingRef}
        intro={
          step === "choice"
            ? description
            : step === "totp"
              ? "Scan the QR code with your authenticator app, then enter the 6-digit code it shows."
              : "We sent a 6-digit code to your email address."
        }
      />

      {error && <AuthMessage>{error}</AuthMessage>}

      {step === "choice" && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={loading || currentMethod === "TOTP"}
            onClick={() => selectMethod("TOTP")}
            className={methodButton}
          >
            <span aria-hidden="true" className={methodTile}>
              <Smartphone className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.95rem] font-bold text-swc-ink">
                Authenticator app{" "}
                {currentMethod === "TOTP" ? (
                  <span className="ml-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-swc-ink-3">
                    Current method
                  </span>
                ) : (
                  <span className="ml-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-swc-label">
                    Recommended
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-[0.86rem] text-swc-ink-2">
                Use Google Authenticator, Microsoft Authenticator, or similar.
              </span>
            </span>
            {loading ? <IconSpinner className="h-4 w-4 flex-shrink-0 text-swc-ink-3" /> : null}
          </button>

          <button
            type="button"
            disabled={loading || currentMethod === "EMAIL"}
            onClick={() => selectMethod("EMAIL")}
            className={methodButton}
          >
            <span aria-hidden="true" className={methodTile}>
              <Mail className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.95rem] font-bold text-swc-ink">
                Email code
                {currentMethod === "EMAIL" && (
                  <span className="ml-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-swc-ink-3">
                    Current method
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-[0.86rem] text-swc-ink-2">
                Get a 6-digit code by email each time you sign in.
              </span>
            </span>
          </button>
        </div>
      )}

      {step === "totp" && (
        <div>
          {totpQrDataUri && (
            <div className="mb-5 flex justify-center">
              <div className="rounded-lg border border-swc-line bg-white p-3">
                <img src={totpQrDataUri} alt="Scan this QR code with your authenticator app" width={176} height={176} />
              </div>
            </div>
          )}

          <div className="mb-5">
            <p className="swc-label-text">Can&apos;t scan? Enter this key manually</p>
            <button
              type="button"
              onClick={copySecret}
              className="flex w-full items-center justify-between gap-2 rounded-md border border-swc-line bg-swc-paper px-4 py-3 transition-colors hover:border-swc-mid"
            >
              <span className="break-all text-left font-mono text-[0.84rem] text-swc-ink">
                {totpSecret}
              </span>
              {copied ? (
                <Check aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-swc-label" />
              ) : (
                <Copy aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-swc-ink-3" />
              )}
            </button>
          </div>

          <OtpInput
            value={code}
            onChange={setCode}
            onComplete={(v) => confirm("TOTP", v)}
            disabled={confirming}
            autoFocus
          />

          {confirming && (
            <p className="mt-3 flex items-center justify-center gap-2 text-[0.86rem] text-swc-ink-3">
              <IconSpinner className="h-3.5 w-3.5" /> Verifying…
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setStep("choice");
              setError("");
              setCode("");
            }}
            className={`${authTextButton} mt-5`}
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Choose a different method
          </button>
        </div>
      )}

      {step === "email" && (
        <div>
          <OtpInput
            value={code}
            onChange={setCode}
            onComplete={(v) => confirm("EMAIL", v)}
            disabled={confirming}
            autoFocus
          />

          {confirming && (
            <p className="mt-3 flex items-center justify-center gap-2 text-[0.86rem] text-swc-ink-3">
              <IconSpinner className="h-3.5 w-3.5" /> Verifying…
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setStep("choice");
                setError("");
                setCode("");
              }}
              className={authTextButton}
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Choose a different method
            </button>

            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={resendEmail}
              className={`${authLink} text-[0.9rem] disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60`}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </button>
          </div>
        </div>
      )}

      {step === "choice" && onBack && (
        <button type="button" onClick={onBack} className={`${authTextButton} mt-6`}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back
        </button>
      )}

      <Dialog.Root open={!!pendingMethod} onOpenChange={(open) => !open && setPendingMethod(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-sm translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-swc-line bg-swc-card p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <div className="flex items-start gap-3">
              <div aria-hidden="true" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/10">
                <TriangleAlert className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-[1.05rem] font-bold text-swc-ink">
                  Switch to {pendingMethod === "TOTP" ? "authenticator app" : "email code"}?
                </Dialog.Title>
                <Dialog.Description className="mt-1.5 text-[0.88rem] leading-relaxed text-swc-ink-2">
                  {pendingMethod === "TOTP"
                    ? "Your current method will stop working for sign-in. You'll need to set up an authenticator app to continue."
                    : "Your current method will stop working for sign-in, including your saved authenticator app. You'll verify with an emailed code from now on."}
                </Dialog.Description>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="swc-btn swc-btn--outline min-h-[44px] px-4"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={() => {
                  const method = pendingMethod;
                  setPendingMethod(null);
                  if (method) choose(method);
                }}
                className="swc-btn swc-btn--green min-h-[44px] px-4"
              >
                Switch method
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
