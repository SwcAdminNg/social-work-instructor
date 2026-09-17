"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AuthPageShell } from "@/components/auth/shared/AuthPageShell";
import { FloatingInput } from "@/components/auth/shared/FloatingInput";
import {
  IconArrowRight,
  IconMail,
  IconPhone,
  IconSpinner,
  IconUser,
} from "@/components/auth/shared/icons";
import { FileText, UploadCloud } from "lucide-react";

type FieldErrors = Partial<Record<"firstName" | "lastName" | "email" | "phone" | "cv", string>>;

function friendlyApplicationError(status: number, message?: string) {
  if (status === 409 && message?.toLowerCase().includes("under review")) {
    return "An application from this email is already under review. Please watch your email for the decision.";
  }
  if (status === 409 && message?.toLowerCase().includes("registered")) {
    return "This email is already registered. Please sign in instead.";
  }
  return message || "Unable to submit your application. Please try again.";
}

export default function InstructorApplication() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof FieldErrors>(field: K, value: string) {
    setFieldErrors((current) => ({ ...current, [field]: value }));
  }

  function clearField<K extends keyof FieldErrors>(field: K) {
    if (!fieldErrors[field]) return;
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    if (!firstName.trim()) {
      setField("firstName", "Please enter your first name.");
      firstNameRef.current?.focus();
      return;
    }
    if (!lastName.trim()) {
      setField("lastName", "Please enter your last name.");
      lastNameRef.current?.focus();
      return;
    }
    if (!email.trim()) {
      setField("email", "Please enter your email address.");
      emailRef.current?.focus();
      return;
    }
    if (!phone.trim()) {
      setField("phone", "Please enter your phone number.");
      phoneRef.current?.focus();
      return;
    }
    if (!cvFile) {
      setField("cv", "Please attach your CV.");
      fileRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/proxy/instructor-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone_number: phone.trim(),
          cv_file_name: cvFile.name,
          cv_content_type: cvFile.type || "application/octet-stream",
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(friendlyApplicationError(res.status, json?.message));
      }

      const uploadUrl = json?.data?.upload_url;
      if (!uploadUrl) {
        throw new Error("The upload URL was missing. Please submit the application again.");
      }

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": cvFile.type || "application/octet-stream" },
        body: cvFile,
      });

      if (!uploadRes.ok) {
        throw new Error("Your application was created, but the CV upload failed. Please submit again so we can generate a fresh upload link.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit your application. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <AuthPageShell variant="register">
        <div className="mb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/10 dark:text-[#52b788]">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#2D6A4F] dark:text-[#52b788]">
            Application submitted
          </p>
          <h1 className="mb-3 text-[1.75rem] font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-[2rem]">
            Thanks for applying
          </h1>
          <p className="text-[0.9rem] leading-6 text-gray-500 dark:text-gray-400">
            Your instructor application and CV have been submitted. Our team will
            review it and email you with the next step. If approved, that email
            will include a setup link for your instructor account.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#2D6A4F] px-5 text-sm font-bold text-white no-underline transition hover:bg-[#1e4d38]"
        >
          Back to sign in
        </Link>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell variant="register">
      <div className="mb-8">
        <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#2D6A4F] dark:text-[#52b788]">
          Become an instructor
        </p>
        <h1 className="mb-2 text-[1.75rem] font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-[2rem]">
          Submit your application
        </h1>
        <p className="text-[0.87rem] leading-6 text-gray-500 dark:text-gray-400">
          Apply with your contact details and CV. If approved, you will receive
          an emailed link to finish setting up your instructor account.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FloatingInput
            ref={firstNameRef}
            id="firstName"
            label="First name"
            type="text"
            value={firstName}
            onChange={(value) => {
              setFirstName(value);
              clearField("firstName");
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
            onChange={(value) => {
              setLastName(value);
              clearField("lastName");
            }}
            icon={<IconUser />}
            autoComplete="family-name"
            required
            error={fieldErrors.lastName}
          />
        </div>

        <FloatingInput
          ref={emailRef}
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(value) => {
            setEmail(value);
            clearField("email");
          }}
          icon={<IconMail />}
          autoComplete="email"
          required
          error={fieldErrors.email}
        />

        <FloatingInput
          ref={phoneRef}
          id="phone"
          label="Phone number"
          type="tel"
          value={phone}
          onChange={(value) => {
            setPhone(value);
            clearField("phone");
          }}
          icon={<IconPhone />}
          autoComplete="tel"
          required
          error={fieldErrors.phone}
        />

        <div>
          <label
            htmlFor="cv"
            className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 transition hover:border-[#2D6A4F] dark:border-white/10 dark:bg-white/5 dark:hover:border-[#52b788]"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/10 dark:text-[#52b788]">
              <FileText className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-gray-900 dark:text-white">
                {cvFile ? cvFile.name : "Attach your CV"}
              </span>
              <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                PDF, DOC, or DOCX. Uploaded directly after application creation.
              </span>
            </span>
          </label>
          <input
            ref={fileRef}
            id="cv"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(event) => {
              setCvFile(event.target.files?.[0] ?? null);
              clearField("cv");
            }}
          />
          {fieldErrors.cv && (
            <p className="mt-1.5 px-1 text-xs font-medium text-red-500">
              {fieldErrors.cv}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="relative mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] text-[0.93rem] font-bold text-white shadow-lg shadow-green-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1e4d38] hover:shadow-green-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {loading ? (
            <>
              <IconSpinner className="h-4 w-4 text-white/80" />
              Submitting...
            </>
          ) : (
            <>
              Submit application
              <IconArrowRight />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-[0.85rem] text-gray-500 dark:text-gray-400">
        Already approved or have an account?{" "}
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
