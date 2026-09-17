"use client";

import { useState, useRef, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ShieldCheck, Smartphone, Mail, Copy, Check, ArrowLeft, TriangleAlert } from "lucide-react";
import { OtpInput } from "./shared/OtpInput";
import { IconSpinner } from "./shared/icons";

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
      <div className="mb-8">
        <div className="w-11 h-11 rounded-xl bg-[#2D6A4F]/10 dark:bg-[#52b788]/10 flex items-center justify-center mb-4">
          <ShieldCheck className="w-5 h-5 text-[#2D6A4F] dark:text-[#52b788]" />
        </div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-[1.5rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2 outline-none"
        >
          {step === "choice" ? title : "Enter verification code"}
        </h1>
        <p className="text-[0.87rem] text-gray-500 dark:text-gray-400">
          {step === "choice"
            ? description
            : step === "totp"
              ? "Scan the QR code with your authenticator app, then enter the 6-digit code it shows."
              : "We sent a 6-digit code to your email address."}
        </p>
      </div>

      {error && (
        <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {step === "choice" && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={loading || currentMethod === "TOTP"}
            onClick={() => selectMethod("TOTP")}
            className="group flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-white/10 hover:border-[#2D6A4F] dark:hover:border-[#52b788] bg-white dark:bg-white/5 text-left transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-white/10"
          >
            <div className="w-10 h-10 rounded-lg bg-[#2D6A4F]/10 dark:bg-[#52b788]/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-[#2D6A4F] dark:text-[#52b788]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[0.9rem] font-bold text-gray-900 dark:text-white">
                Authenticator app{" "}
                {currentMethod === "TOTP" ? (
                  <span className="ml-1 text-[0.65rem] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Current method
                  </span>
                ) : (
                  <span className="ml-1 text-[0.65rem] font-bold uppercase tracking-wide text-[#2D6A4F] dark:text-[#52b788]">
                    Recommended
                  </span>
                )}
              </p>
              <p className="text-[0.8rem] text-gray-500 dark:text-gray-400">
                Use Google Authenticator, Microsoft Authenticator, or similar.
              </p>
            </div>
            {loading ? <IconSpinner className="w-4 h-4 text-gray-400 flex-shrink-0" /> : null}
          </button>

          <button
            type="button"
            disabled={loading || currentMethod === "EMAIL"}
            onClick={() => selectMethod("EMAIL")}
            className="group flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-white/10 hover:border-[#2D6A4F] dark:hover:border-[#52b788] bg-white dark:bg-white/5 text-left transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-white/10"
          >
            <div className="w-10 h-10 rounded-lg bg-[#2D6A4F]/10 dark:bg-[#52b788]/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-[#2D6A4F] dark:text-[#52b788]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[0.9rem] font-bold text-gray-900 dark:text-white">
                Email code
                {currentMethod === "EMAIL" && (
                  <span className="ml-1 text-[0.65rem] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Current method
                  </span>
                )}
              </p>
              <p className="text-[0.8rem] text-gray-500 dark:text-gray-400">
                Get a 6-digit code by email each time you sign in.
              </p>
            </div>
          </button>
        </div>
      )}

      {step === "totp" && (
        <div>
          {totpQrDataUri && (
            <div className="flex justify-center mb-5">
              <div className="p-3 rounded-2xl bg-white border border-gray-200 dark:border-white/10">
                <img src={totpQrDataUri} alt="Scan this QR code with your authenticator app" width={176} height={176} />
              </div>
            </div>
          )}

          <div className="mb-5">
            <p className="text-[0.75rem] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Can&apos;t scan? Enter this key manually
            </p>
            <button
              type="button"
              onClick={copySecret}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-[#2D6A4F] dark:hover:border-[#52b788] transition-colors duration-150"
            >
              <span className="font-mono text-[0.8rem] text-gray-800 dark:text-gray-200 break-all text-left">
                {totpSecret}
              </span>
              {copied ? (
                <Check className="w-4 h-4 text-[#2D6A4F] dark:text-[#52b788] flex-shrink-0" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400 flex-shrink-0" />
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
            <p className="mt-3 flex items-center justify-center gap-2 text-[0.8rem] text-gray-500 dark:text-gray-400">
              <IconSpinner className="w-3.5 h-3.5" /> Verifying…
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setStep("choice");
              setError("");
              setCode("");
            }}
            className="mt-5 flex items-center gap-1.5 text-[0.83rem] font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-150"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Choose a different method
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
            <p className="mt-3 flex items-center justify-center gap-2 text-[0.8rem] text-gray-500 dark:text-gray-400">
              <IconSpinner className="w-3.5 h-3.5" /> Verifying…
            </p>
          )}

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setStep("choice");
                setError("");
                setCode("");
              }}
              className="flex items-center gap-1.5 text-[0.83rem] font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-150"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Choose a different method
            </button>

            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={resendEmail}
              className="text-[0.83rem] font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:text-[#1e4d38] dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </button>
          </div>
        </div>
      )}

      {step === "choice" && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-6 flex items-center gap-1.5 text-[0.83rem] font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-150"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      )}

      <Dialog.Root open={!!pendingMethod} onOpenChange={(open) => !open && setPendingMethod(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-sm translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212] p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <TriangleAlert className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-[1.05rem] font-bold text-gray-900 dark:text-white">
                  Switch to {pendingMethod === "TOTP" ? "authenticator app" : "email code"}?
                </Dialog.Title>
                <Dialog.Description className="mt-1.5 text-[0.83rem] text-gray-500 dark:text-gray-400 leading-relaxed">
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
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
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
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2D6A4F] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] shadow-sm"
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
