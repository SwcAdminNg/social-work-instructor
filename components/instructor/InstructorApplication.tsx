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
import { AlertCircle, FileText, UploadCloud } from "lucide-react";
import { AuthHeading, AuthMessage, authButton, authLink } from "@/components/auth/shared/AuthUI";

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
        <AuthHeading
          icon={<UploadCloud className="h-5 w-5" />}
          eyebrow="Application submitted"
          title="Thanks for applying"
          intro="Your instructor application and CV have been submitted. Our team will review it and email you with the next step. If approved, that email will include a setup link for your instructor account."
        />
        <Link href="/login" className={authButton}>
          Back to sign in
        </Link>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell variant="register">
      <AuthHeading
        eyebrow="Become an instructor"
        title="Express interest"
        intro="Apply with your contact details and CV. If approved, you will receive an emailed link to finish setting up your instructor account."
      />

      {error && <AuthMessage>{error}</AuthMessage>}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="grid gap-5 min-[480px]:grid-cols-2 min-[480px]:gap-3">
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
          <span className="swc-label-text" aria-hidden="true">
            CV
          </span>
          <label
            htmlFor="cv"
            className={`flex cursor-pointer items-center gap-3 rounded-md border border-dashed bg-swc-paper p-4 transition-colors hover:border-swc-mid has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:[outline-color:var(--swc-focus)] ${
              fieldErrors.cv ? "border-red-600 dark:border-red-400" : "border-swc-ink-3"
            }`}
          >
            <span aria-hidden="true" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-swc-mint text-swc-label">
              <FileText className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.95rem] font-bold text-swc-ink">
                {cvFile ? cvFile.name : "Attach your CV"}
              </span>
              <span className="mt-1 block text-[0.84rem] text-swc-ink-3">
                PDF, DOC, or DOCX. Uploaded directly after application creation.
              </span>
            </span>
            <input
              ref={fileRef}
              id="cv"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              aria-invalid={!!fieldErrors.cv || undefined}
              aria-describedby={fieldErrors.cv ? "cv-error" : undefined}
              onChange={(event) => {
                setCvFile(event.target.files?.[0] ?? null);
                clearField("cv");
              }}
            />
          </label>
          {fieldErrors.cv && (
            <p id="cv-error" className="mt-1.5 flex items-start gap-1.5 text-[0.86rem] font-medium text-red-700 dark:text-red-300">
              <AlertCircle size={15} className="mt-[2px] flex-none" aria-hidden="true" />
              {fieldErrors.cv}
            </p>
          )}
        </div>

        <button type="submit" disabled={loading} className={`${authButton} mt-1`}>
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

        <p className="m-0 text-[0.84rem] leading-[1.5] text-swc-ink-3">
          Submitting an expression of interest does not guarantee selection or a commission.
        </p>
      </form>

      <p className="mt-7 text-center text-[0.92rem] text-swc-ink-2">
        Already approved or have an account?{" "}
        <Link href="/login" className={authLink}>
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  );
}
