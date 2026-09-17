"use client";

import { useState } from "react";
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

type SetupStep =
  | { name: "form" }
  | { name: "two-factor"; challengeToken: string };

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [finalizeError, setFinalizeError] = useState("");

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

    if (!token) {
      setError("This setup link is missing its token. Please use the link from your approval email.");
      return;
    }
    if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
      setError("Username must be 3-30 characters and can only use lowercase letters, numbers, dots, and underscores.");
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError("Password must be between 8 and 128 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/proxy/instructor-applications/complete-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          username,
          password,
          confirm_password: confirmPassword,
        }),
      });
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

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FloatingInput
          id="username"
          label="Username"
          type="text"
          value={username}
          onChange={(value) =>
            setUsername(value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))
          }
          icon={<IconUser />}
          autoComplete="username"
          required
        />

        <FloatingInput
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={setPassword}
          icon={<IconLock />}
          autoComplete="new-password"
          required
          suffix={
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
            />
          }
        />

        <FloatingInput
          id="confirmPassword"
          label="Confirm password"
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={setConfirmPassword}
          icon={<IconLock />}
          autoComplete="new-password"
          required
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
