"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthPageShell } from "@/components/auth/shared/AuthPageShell";
import { FloatingInput } from "@/components/auth/shared/FloatingInput";
import { PasswordToggle } from "@/components/auth/shared/PasswordToggle";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import {
  IconArrowRight,
  IconLock,
  IconSpinner,
  IconUser,
} from "@/components/auth/shared/icons";
import { CheckCircle2, XCircle } from "lucide-react";

type SetupStep =
  | { name: "form" }
  | { name: "two-factor"; challengeToken: string };

type FieldErrors = Partial<
  Record<"username" | "password" | "confirmPassword", string>
>;

function setupError(status: number, message?: string) {
  if (status === 400) {
    return "This setup link has expired or was already used. Please contact support for a new link.";
  }
  if (status === 409) return "Username is already taken.";
  return message || "Unable to complete setup. Please try again.";
}

export default function InstructorCompleteSetup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [step, setStep] = useState<SetupStep>({ name: "form" });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [finalizeError, setFinalizeError] = useState("");
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const usernamePattern = /^[a-z0-9_.]{3,30}$/;

  useEffect(() => {
    if (!username || username.length < 3 || !usernamePattern.test(username)) {
      const timeout = window.setTimeout(() => {
        setUsernameAvailable(null);
        setCheckingUsername(false);
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    const delay = window.setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(
          `/api/proxy/username/availability?username=${encodeURIComponent(username)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok && typeof data?.data?.available === "boolean") {
          setUsernameAvailable(data.data.available);
        } else {
          setUsernameAvailable(null);
        }
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 450);

    return () => window.clearTimeout(delay);
  }, [username]);

  function setFieldError(field: keyof FieldErrors, message: string) {
    setFieldErrors((current) => ({ ...current, [field]: message }));
  }

  function clearFieldError(field: keyof FieldErrors) {
    if (!fieldErrors[field]) return;
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function focusFirstIncomplete() {
    if (!usernamePattern.test(username)) {
      usernameRef.current?.focus();
      return;
    }
    if (!password || password.length < 8 || password.length > 128) {
      passwordRef.current?.focus();
      return;
    }
    if (!confirmPassword || confirmPassword !== password) {
      confirmPasswordRef.current?.focus();
      return;
    }
    usernameRef.current?.focus();
  }

  function validateUsername({ requireAvailability = false } = {}) {
    if (!usernamePattern.test(username)) {
      setFieldError(
        "username",
        "Use 3-30 lowercase letters, numbers, dots, or underscores.",
      );
      usernameRef.current?.focus();
      return false;
    }
    if (usernameAvailable === false) {
      setFieldError("username", "Username is already taken.");
      usernameRef.current?.focus();
      return false;
    }
    if (requireAvailability && checkingUsername) {
      setFieldError("username", "Please wait while we check this username.");
      usernameRef.current?.focus();
      return false;
    }
    clearFieldError("username");
    return true;
  }

  function validatePassword() {
    if (password.length < 8 || password.length > 128) {
      setFieldError("password", "Password must be between 8 and 128 characters.");
      passwordRef.current?.focus();
      return false;
    }
    clearFieldError("password");
    return true;
  }

  function validateConfirmPassword() {
    if (password !== confirmPassword) {
      setFieldError("confirmPassword", "Passwords do not match.");
      confirmPasswordRef.current?.focus();
      return false;
    }
    clearFieldError("confirmPassword");
    return true;
  }

  function validateForm() {
    if (!token) {
      setError(
        "This setup link is missing its token. Please use the link from your approval email.",
      );
      usernameRef.current?.focus();
      return false;
    }
    setError("");
    if (!validateUsername({ requireAvailability: true })) return false;
    if (!validatePassword()) return false;
    if (!validateConfirmPassword()) return false;
    return true;
  }

  function handleFormKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter") return;
    const target = event.target as HTMLElement;
    if (target.tagName !== "INPUT") return;
    event.preventDefault();

    if (target.id === "username") {
      if (validateUsername()) passwordRef.current?.focus();
      return;
    }
    if (target.id === "password") {
      if (validatePassword()) confirmPasswordRef.current?.focus();
      return;
    }
    if (target.id === "confirmPassword") {
      if (validateConfirmPassword()) {
        if (validateForm()) {
          event.currentTarget.requestSubmit();
        } else {
          focusFirstIncomplete();
        }
      }
    }
  }

  async function finalizeSession(sessionData: unknown) {
    setFinalizeError("");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        mode: "finalize",
        session: JSON.stringify(sessionData),
      });

      if (res?.error) {
        throw new Error("Setup complete, but signing you in failed. Please sign in manually.");
      }

      router.push("/dashboard");
    } catch (err) {
      setFinalizeError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch(
        "/api/proxy/instructor-applications/complete-setup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            username,
            password,
            confirm_password: confirmPassword,
          }),
        },
      );
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(setupError(res.status, json?.message));
      }

      const challengeToken = json?.data?.challenge?.challenge_token;
      if (!challengeToken) {
        throw new Error("The setup response did not include a 2FA challenge. Please try again.");
      }

      setStep({ name: "two-factor", challengeToken });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete setup. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step.name === "two-factor") {
    return (
      <AuthPageShell variant="register">
        {finalizeError && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {finalizeError}
          </div>
        )}
        <TwoFactorSetup
          api={{ kind: "challenge", challengeToken: step.challengeToken }}
          title="Secure your instructor account"
          description="Choose a two-factor authentication method to finish signing in."
          onBack={() => setStep({ name: "form" })}
          onComplete={(sessionData) => finalizeSession(sessionData)}
        />
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell variant="register">
      <div className="mb-8">
        <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#2D6A4F] dark:text-[#52b788]">
          Instructor setup
        </p>
        <h1 className="mb-2 text-[1.75rem] font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-[2rem]">
          Finish your account
        </h1>
        <p className="text-[0.87rem] leading-6 text-gray-500 dark:text-gray-400">
          Choose your username and password from the approval link we emailed
          you. You will set up two-factor authentication next.
        </p>
      </div>

      {!token && (
        <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          This page needs the setup token from your approval email.
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        onKeyDown={handleFormKeyDown}
        noValidate
        className="flex flex-col gap-4"
      >
        <FloatingInput
          ref={usernameRef}
          id="username"
          label="Username"
          type="text"
          value={username}
          onChange={(value) => {
            setUsername(value.toLowerCase().replace(/[^a-z0-9_.]/g, ""));
            setUsernameAvailable(null);
            clearFieldError("username");
          }}
          icon={<IconUser />}
          autoComplete="username"
          required
          error={fieldErrors.username}
          suffix={
            checkingUsername ? (
              <IconSpinner className="h-5 w-5 text-gray-400" />
            ) : usernameAvailable === true ? (
              <CheckCircle2 className="h-5 w-5 text-[#2D6A4F] dark:text-[#52b788]" />
            ) : usernameAvailable === false ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : null
          }
        />
        <div className="-mt-2 px-1 text-xs" aria-live="polite">
          {usernameAvailable === true && (
            <span className="font-semibold text-[#2D6A4F] dark:text-[#52b788]">
              Username is available.
            </span>
          )}
          {usernameAvailable === false && (
            <span className="font-semibold text-red-500">
              Username is already taken.
            </span>
          )}
          {usernameAvailable === null && username.length > 0 && (
            <span className="text-gray-500 dark:text-gray-400">
              3-30 lowercase letters, numbers, dots, or underscores.
            </span>
          )}
        </div>

        <FloatingInput
          ref={passwordRef}
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(value) => {
            setPassword(value);
            clearFieldError("password");
            if (confirmPassword) clearFieldError("confirmPassword");
          }}
          icon={<IconLock />}
          autoComplete="new-password"
          required
          error={fieldErrors.password}
          suffix={
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
            />
          }
        />

        <FloatingInput
          ref={confirmPasswordRef}
          id="confirmPassword"
          label="Confirm password"
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(value) => {
            setConfirmPassword(value);
            clearFieldError("confirmPassword");
          }}
          icon={<IconLock />}
          autoComplete="new-password"
          required
          error={fieldErrors.confirmPassword}
          suffix={
            <PasswordToggle
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((current) => !current)}
            />
          }
        />

        <button
          type="submit"
          disabled={loading || !token}
          className="relative mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] text-[0.93rem] font-bold text-white shadow-lg shadow-green-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1e4d38] hover:shadow-green-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading ? (
            <>
              <IconSpinner className="h-4 w-4 text-white/80" />
              Setting up...
            </>
          ) : (
            <>
              Continue
              <IconArrowRight />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-[0.85rem] text-gray-500 dark:text-gray-400">
        Link expired or already used? Contact support for a new one.
      </p>

      <p className="mt-3 text-center text-[0.85rem] text-gray-500 dark:text-gray-400">
        Already finished setup?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#2D6A4F] no-underline transition-colors hover:text-[#1e4d38] dark:text-[#52b788] dark:hover:text-white"
        >
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  );
}
