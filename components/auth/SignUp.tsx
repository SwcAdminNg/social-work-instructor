"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthPageShell } from "./shared/AuthPageShell";
import { FloatingInput } from "./shared/FloatingInput";
import { PasswordToggle } from "./shared/PasswordToggle";
import { TwoFactorSetup } from "./TwoFactorSetup";
import {
  IconArrowRight,
  IconLock,
  IconMail,
  IconPhone,
  IconSpinner,
  IconUser,
} from "./shared/icons";

export default function SignUp({ statsData }: { statsData?: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [finalizeError, setFinalizeError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions when first & last name change
  useEffect(() => {
    if (!firstName || !lastName) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/proxy/username/suggestions?first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.data?.suggestions) {
          setSuggestions(data.data.suggestions);
          // Auto-fill if empty
          if (!username) {
            setUsername(data.data.suggestions[0]);
          }
        }
      } catch (err) {
        // Silently ignore suggestion errors to not block user
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [firstName, lastName]);

  // Check username availability when user types
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(`/api/proxy/username/availability?username=${encodeURIComponent(username)}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.data !== undefined) {
          setUsernameAvailable(data.data.available);
        } else {
          setUsernameAvailable(null);
        }
      } catch (err) {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!firstName) {
      setFieldErrors({ firstName: "Please enter your first name." });
      return firstNameRef.current?.focus();
    }
    if (!lastName) {
      setFieldErrors({ lastName: "Please enter your last name." });
      return lastNameRef.current?.focus();
    }
    if (!username) {
      setFieldErrors({ username: "Please choose a username." });
      return usernameRef.current?.focus();
    }
    if (!email) {
      setFieldErrors({ email: "Please enter your email address." });
      return emailRef.current?.focus();
    }
    // phone is optional
    if (!password) {
      setFieldErrors({ password: "Please enter a password." });
      return passwordRef.current?.focus();
    }
    if (!confirmPassword) {
      setFieldErrors({ confirmPassword: "Please confirm your password." });
      return confirmPasswordRef.current?.focus();
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      confirmPasswordRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          username,
          email,
          phone_number: phone || undefined,
          platform: "NG",
          user_type: "USER",
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to create account.");
      }

      const token = data.data?.challenge?.challenge_token;
      if (!token) {
        throw new Error("Failed to create account.");
      }
      setChallengeToken(token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const finalizeSession = async (sessionData: any) => {
    setFinalizeError("");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        mode: "finalize",
        session: JSON.stringify(sessionData),
      });

      if (res?.error) {
        throw new Error("Account created, but signing you in failed. Please sign in manually.");
      }

      const callbackUrl =
        searchParams.get("callbackUrl") ||
        "/dashboard/settings";
      router.push(callbackUrl);
    } catch (err: any) {
      setFinalizeError(err.message || "Something went wrong. Please try again.");
    }
  };

  if (challengeToken) {
    return (
      <AuthPageShell variant="register" statsData={statsData}>
        {finalizeError && (
          <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
            {finalizeError}
          </div>
        )}
        <TwoFactorSetup
          api={{ kind: "challenge", challengeToken }}
          title="Secure your new account"
          description="Two-factor authentication is required for every account. Choose how you'd like to receive codes."
          onComplete={(sessionData) => finalizeSession(sessionData)}
        />
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell variant="register" statsData={statsData}>
      {/* Heading */}
      <div className="mb-8">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#2D6A4F] dark:text-[#52b788] mb-2">
          Get started
        </p>
        <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
          Create your account
        </h1>
        <p className="text-[0.87rem] text-gray-500 dark:text-gray-400">
          Join the instructor workspace for Social Work Nigeria.
        </p>
      </div>

      {error && (
        <div role="alert" aria-live="assertive" className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* First / Last name */}
        <div className="grid grid-cols-2 gap-3">
          <FloatingInput
            ref={firstNameRef}
            id="firstName"
            label="First name"
            type="text"
            value={firstName}
            onChange={(v) => {
              setFirstName(v);
              if (fieldErrors.firstName) setFieldErrors((prev) => ({ ...prev, firstName: "" }));
            }}
            icon={<IconUser />}
            autoComplete="given-name"
            required
            error={fieldErrors.firstName}
          />
          <FloatingInput
            ref={lastNameRef}
            id="lastName"
            label="Last name"
            type="text"
            value={lastName}
            onChange={(v) => {
              setLastName(v);
              if (fieldErrors.lastName) setFieldErrors((prev) => ({ ...prev, lastName: "" }));
            }}
            icon={<IconUser />}
            autoComplete="family-name"
            required
            error={fieldErrors.lastName}
          />
        </div>

        {/* Username */}
        <div>
          <FloatingInput
            ref={usernameRef}
            id="username"
            label="Username"
            type="text"
            value={username}
            onChange={(v) => {
              setUsername(v);
              if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: "" }));
            }}
            icon={<IconUser />}
            autoComplete="username"
            required
            error={fieldErrors.username}
            suffix={
              checkingUsername ? (
                <IconSpinner className="w-5 h-5 text-gray-400 animate-spin" />
              ) : usernameAvailable === true ? (
                <svg className="w-5 h-5 text-[#2D6A4F] dark:text-[#52b788]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : usernameAvailable === false ? (
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : null
            }
          />
          <span className="sr-only" aria-live="polite">
            {usernameAvailable === true
              ? "Username is available"
              : usernameAvailable === false
                ? "Username is already taken"
                : ""}
          </span>
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 items-center text-[0.8rem]">
              <span className="text-gray-500 dark:text-gray-400">Suggestions:</span>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setUsername(s);
                    usernameRef.current?.focus();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Email */}
        <FloatingInput
          ref={emailRef}
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
          }}
          icon={<IconMail />}
          autoComplete="email"
          required
          error={fieldErrors.email}
        />

        {/* Phone (optional) */}
        <FloatingInput
          ref={phoneRef}
          id="phone"
          label="Phone number (optional)"
          type="tel"
          value={phone}
          onChange={setPhone}
          icon={<IconPhone />}
          autoComplete="tel"
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
            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
          }}
          icon={<IconLock />}
          autoComplete="new-password"
          required
          error={fieldErrors.password}
          suffix={
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          }
        />

        {/* Confirm password */}
        <FloatingInput
          ref={confirmPasswordRef}
          id="confirmPassword"
          label="Confirm password"
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(v) => {
            setConfirmPassword(v);
            if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
          }}
          icon={<IconLock />}
          autoComplete="new-password"
          required
          error={fieldErrors.confirmPassword}
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
              Creating account…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Create account
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

      {/* Login link */}
      <p className="text-center text-[0.85rem] text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:text-[#1e4d38] dark:hover:text-white no-underline transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded"
        >
          Sign in
        </Link>
      </p>

      {/* Footer note */}
      <p className="mt-10 text-center text-[0.72rem] text-gray-500 dark:text-gray-600 leading-relaxed">
        By creating an account, you agree to our{" "}
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
