"use client";

import { forwardRef, useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, Check, CheckCircle2, Info, Loader2, ShieldAlert } from "lucide-react";
import { cx } from "@/components/swcl/ui";

// `category` is the API's contact category for each enquiry type.
export const TOPICS = [
  { value: "apply", label: "Becoming an Instructor", category: "other" },
  { value: "course", label: "Building or Reviewing a Course", category: "courses" },
  { value: "account", label: "Instructor Account Support", category: "account_support" },
  { value: "partnership", label: "Partnership or Organisational Enquiry", category: "partnership" },
  { value: "other", label: "Other", category: "other" },
] as const;

export type TopicValue = (typeof TOPICS)[number]["value"];

/** Event other parts of the page dispatch to pre-select a topic. */
export const TOPIC_EVENT = "swcl:contact-topic";

const SUPPORT_EMAIL = "support@socialworknigeria.org";
const MESSAGE_MAX = 2000;
const MESSAGE_MIN = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Values = { fullName: string; email: string; topic: TopicValue | ""; phone: string; message: string };
type Field = keyof Values;
type Errors = Partial<Record<Field, string>>;
type Status = "idle" | "sending" | "failed" | "limited" | "sent";

const EMPTY: Values = { fullName: "", email: "", topic: "", phone: "", message: "" };

const FIELD_ORDER: Field[] = ["fullName", "email", "topic", "phone", "message"];
const FIELD_LABELS: Record<Field, string> = {
  fullName: "Full name",
  email: "Email address",
  topic: "Enquiry type",
  phone: "Telephone number",
  message: "Message",
};

function validate(values: Values): Errors {
  const errors: Errors = {};
  const name = values.fullName.trim();
  if (!name) errors.fullName = "Enter your full name so we know who to reply to.";
  else if (name.length > 200) errors.fullName = "Keep your name under 200 characters.";

  const email = values.email.trim();
  if (!email) errors.email = "Enter your email address so we can reply.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address so we can reply.";

  if (!values.topic) errors.topic = "Choose the topic that best matches your enquiry.";

  const phone = values.phone.trim();
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
      errors.phone = "Enter a phone number with country code, for example +234 803 447 1063, or leave it blank.";
    }
  }

  const message = values.message.trim();
  if (!message) errors.message = "Tell us what you need help with.";
  else if (message.length < MESSAGE_MIN) errors.message = `Add a little more detail (at least ${MESSAGE_MIN} characters).`;
  else if (message.length > MESSAGE_MAX) errors.message = `Keep your message under ${MESSAGE_MAX} characters.`;

  return errors;
}

function isTopic(value: string | undefined): value is TopicValue {
  return TOPICS.some((topic) => topic.value === value);
}

/* ── Local field pieces (SWCL styling) ── */

const join = (...ids: (string | false | null | undefined)[]) => ids.filter(Boolean).join(" ") || undefined;

/** Error text: icon plus an "Error:" prefix, so it never relies on colour alone. */
const errorText = "mt-2 flex items-start gap-1.5 text-[0.88rem] font-semibold text-[#a3261a] dark:text-[#ffb4a6]";
const invalidInput = "border-2 border-[#a3261a] dark:border-[#ffb4a6]";

function FieldLabel({ htmlFor, label, required, optional }: { htmlFor: string; label: string; required?: boolean; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="swc-label-text">
      {label}
      {required && (
        <span className="ml-0.5 text-swc-label" aria-hidden="true">
          *
        </span>
      )}
      {optional && <span className="font-normal text-swc-ink-3"> (optional)</span>}
    </label>
  );
}

function Below({ id, error, hint }: { id: string; error?: string; hint?: ReactNode }) {
  return (
    <>
      {hint && !error && (
        <p id={`${id}-hint`} className="m-0 mt-2 text-[0.85rem] text-swc-ink-3">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={errorText}>
          <AlertCircle className="mt-[2px] h-4 w-4 flex-none" aria-hidden="true" />
          <span>
            <span className="sr-only">Error: </span>
            {error}
          </span>
        </p>
      )}
    </>
  );
}

type InputProps = {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email" | "tel";
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  autoComplete?: string;
  required?: boolean;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  disabled?: boolean;
};

function InputField({ id, name, label, type = "text", value, onChange, onBlur, autoComplete, required, optional, hint, error, disabled }: InputProps) {
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} optional={optional} />
      <input
        id={id}
        name={name}
        type={type}
        inputMode={type === "email" ? "email" : type === "tel" ? "tel" : undefined}
        className={cx("swc-input", error && invalidInput)}
        value={value}
        autoComplete={autoComplete}
        autoCapitalize={type === "email" ? "none" : undefined}
        spellCheck={type === "email" ? false : undefined}
        required={required}
        aria-required={required || undefined}
        aria-invalid={!!error || undefined}
        aria-describedby={join(Boolean(hint) && !error && `${id}-hint`, error && `${id}-error`)}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      <Below id={id} error={error} hint={hint} />
    </div>
  );
}

const Alert = forwardRef<HTMLDivElement, { title: ReactNode; titleId?: string; children?: ReactNode }>(function Alert(
  { title, titleId, children },
  ref,
) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby={titleId}
      className="flex items-start gap-3 rounded-lg border-2 border-[#a3261a] bg-swc-card p-5 text-swc-ink dark:border-[#ffb4a6] [&_a]:font-semibold [&_a]:text-swc-label [&_a]:underline [&_ul]:m-0 [&_ul]:mt-2 [&_ul]:pl-5 [&_li]:mt-1 [&_p]:m-0 [&_p]:mt-1.5"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 flex-none text-[#a3261a] dark:text-[#ffb4a6]" aria-hidden="true" />
      <div className="text-[0.92rem] text-swc-ink-2">
        <h3 id={titleId} className="swc-h4 text-swc-ink">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
});

function Note({ id, icon, children }: { id?: string; icon: ReactNode; children: ReactNode }) {
  return (
    <p id={id} className="m-0 flex items-start gap-2.5 rounded-md bg-swc-mint p-3.5 text-[0.88rem] text-swc-ink-2 [&>svg]:mt-[2px] [&>svg]:flex-none [&>svg]:text-swc-label">
      {icon}
      <span>{children}</span>
    </p>
  );
}

export default function ContactForm({ initialTopic }: { initialTopic?: string }) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const [values, setValues] = useState<Values>({
    ...EMPTY,
    topic: isTopic(initialTopic) ? initialTopic : "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [reference, setReference] = useState<string | null>(null);
  // Bumped on each failed validation so the error summary takes focus once it has rendered.
  const [summaryFocusRequest, setSummaryFocusRequest] = useState(0);

  const summaryRef = useRef<HTMLDivElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Quick links elsewhere on the page can choose a topic for the visitor.
  useEffect(() => {
    const onTopic = (event: Event) => {
      const value = (event as CustomEvent<string>).detail;
      if (!isTopic(value)) return;
      setStatus((current) => (current === "sent" ? "idle" : current));
      setValues((current) => ({ ...current, topic: value }));
      setErrors((current) => ({ ...current, topic: undefined }));
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => messageRef.current?.focus({ preventScroll: true }), 450);
    };
    window.addEventListener(TOPIC_EVENT, onTopic);
    return () => window.removeEventListener(TOPIC_EVENT, onTopic);
  }, []);

  useEffect(() => {
    if (summaryFocusRequest) summaryRef.current?.focus();
  }, [summaryFocusRequest]);

  useEffect(() => {
    if (status === "sent") successRef.current?.focus();
    if (status === "failed" || status === "limited") failureRef.current?.focus();
  }, [status]);

  const update = (field: Field, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    // After a first attempt, errors clear (or update) as the visitor types.
    if (triedSubmit) setErrors((current) => ({ ...current, [field]: validate(next)[field] }));
  };

  const revalidateOnBlur = (field: Field) => {
    if (!triedSubmit && !values[field]) return;
    setErrors((current) => ({ ...current, [field]: validate(values)[field] }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;
    setTriedSubmit(true);

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus("idle");
      setSummaryFocusRequest((n) => n + 1);
      return;
    }

    const form = new FormData(event.currentTarget);
    if (form.get("website")) {
      // Only automated submissions fill the hidden field. Drop them quietly.
      setStatus("sent");
      return;
    }

    setStatus("sending");
    const topic = TOPICS.find((t) => t.value === values.topic) ?? TOPICS[TOPICS.length - 1];
    try {
      const res = await fetch("/api/proxy/contact-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: values.fullName.trim(),
          email: values.email.trim(),
          phone_number: values.phone.trim() || undefined,
          subject: topic.label,
          message: values.message.trim(),
          platform: "NG",
          category: topic.category,
          source_page: "/contact",
        }),
      });
      if (res.status === 429) {
        setStatus("limited");
        return;
      }
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      const data = await res.json().catch(() => ({}));
      const ref = data?.data?.reference ?? null;
      setReference(ref ? String(ref) : null);
      setValues(EMPTY);
      setErrors({});
      setTriedSubmit(false);
      setStatus("sent");
    } catch {
      // Keep everything the visitor typed so they can try again.
      setStatus("failed");
    }
  };

  const errorList = FIELD_ORDER.filter((field) => errors[field]);
  const sending = status === "sending";

  if (status === "sent") {
    return (
      <div role="status" className="mt-7 flex flex-col items-start gap-4 rounded-lg bg-swc-mint p-7">
        <CheckCircle2 className="h-9 w-9 text-swc-label" aria-hidden="true" />
        <h3 ref={successRef} tabIndex={-1} className="swc-h3 outline-none">
          Thank you. Your message has been received.
        </h3>
        <p className="m-0 text-swc-ink-2">We will reply to the email address you provided.</p>
        {reference && (
          <p className="m-0 text-[0.92rem] text-swc-ink-2">
            Reference: <strong className="text-swc-ink">{reference}</strong>
          </p>
        )}
        <button type="button" className="swc-btn swc-btn--outline mt-2" onClick={() => setStatus("idle")}>
          Send another message
        </button>
      </div>
    );
  }

  const messageError = errors.message;
  const topicError = errors.topic;

  return (
    <form ref={formRef} className="mt-7 flex flex-col gap-6" onSubmit={handleSubmit} noValidate aria-describedby={id("required-note")}>
      <p id={id("required-note")} className="m-0 text-[0.85rem] text-swc-ink-3">
        Fields marked{" "}
        <span className="text-swc-label" aria-hidden="true">
          *
        </span>
        <span className="sr-only">with an asterisk</span> are required.
      </p>

      {errorList.length > 0 && (
        <Alert
          ref={summaryRef}
          titleId={id("summary-title")}
          title={`Please check ${errorList.length === 1 ? "this field" : `these ${errorList.length} fields`}`}
        >
          <ul>
            {errorList.map((field) => (
              <li key={field}>
                <a href={`#${id(field)}`}>{FIELD_LABELS[field]}</a>: {errors[field]}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {status === "limited" && (
        <Alert ref={failureRef} title="You have sent several messages in a short time.">
          <p>
            Please wait a few minutes and try again, or email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Your
            answers are still below.
          </p>
        </Alert>
      )}

      {status === "failed" && (
        <Alert ref={failureRef} title="We could not send your message.">
          <p>
            Please try again or email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Your answers are still
            below.
          </p>
        </Alert>
      )}

      <div className="grid gap-6 min-[701px]:grid-cols-2">
        <InputField
          id={id("fullName")}
          name="name"
          label="Full name"
          autoComplete="name"
          required
          value={values.fullName}
          onChange={(value) => update("fullName", value)}
          onBlur={() => revalidateOnBlur("fullName")}
          error={errors.fullName}
          disabled={sending}
        />
        <InputField
          id={id("email")}
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          required
          hint="We will send our reply here."
          value={values.email}
          onChange={(value) => update("email", value)}
          onBlur={() => revalidateOnBlur("email")}
          error={errors.email}
          disabled={sending}
        />
      </div>

      <fieldset
        className="m-0 min-w-0 border-0 p-0"
        aria-required="true"
        aria-invalid={!!topicError || undefined}
        aria-describedby={topicError ? `${id("topic")}-error` : undefined}
        disabled={sending}
      >
        <legend className="swc-label-text p-0">
          Enquiry type
          <span className="ml-0.5 text-swc-label" aria-hidden="true">
            *
          </span>
        </legend>
        {/* Focusable by script so the error summary can jump here. */}
        <div id={id("topic")} tabIndex={-1} className="mt-1 flex flex-wrap gap-2 outline-none">
          {TOPICS.map((topic) => {
            const checked = values.topic === topic.value;
            return (
              <label key={topic.value} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="topic"
                  value={topic.value}
                  checked={checked}
                  onChange={() => update("topic", topic.value)}
                  className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
                />
                <span
                  className={cx(
                    "inline-flex min-h-[44px] items-center gap-2 rounded-md border px-4 text-[0.9rem] transition-colors peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--swc-focus)]",
                    checked
                      ? "border-swc-deep bg-swc-deep font-bold text-white"
                      : cx("bg-swc-card text-swc-ink hover:border-swc-mid", topicError ? invalidInput : "border-swc-line"),
                  )}
                >
                  {checked && <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />}
                  {topic.label}
                </span>
              </label>
            );
          })}
        </div>
        <Below id={id("topic")} error={topicError} />
      </fieldset>

      {values.topic === "account" && (
        <Note id={id("account-tip")} icon={<ShieldAlert className="h-[18px] w-[18px]" aria-hidden="true" />}>
          Describe the issue and the email you sign in with. Never send passwords, payment-card details or confidential
          case records.
        </Note>
      )}

      <InputField
        id={id("phone")}
        name="phone"
        type="tel"
        label="Telephone number"
        autoComplete="tel"
        optional
        hint="Include your country code if you are outside Nigeria."
        value={values.phone}
        onChange={(value) => update("phone", value)}
        onBlur={() => revalidateOnBlur("phone")}
        error={errors.phone}
        disabled={sending}
      />

      <div>
        <FieldLabel htmlFor={id("message")} label="Message" required />
        <textarea
          ref={messageRef}
          id={id("message")}
          name="message"
          rows={6}
          className={cx("swc-input min-h-[160px] resize-y", messageError && invalidInput)}
          placeholder="Tell us what you need help with."
          maxLength={MESSAGE_MAX}
          value={values.message}
          required
          aria-required="true"
          aria-invalid={!!messageError || undefined}
          aria-describedby={join(
            id("message-count"),
            id("message-privacy"),
            values.topic === "account" && id("account-tip"),
            messageError && `${id("message")}-error`,
          )}
          disabled={sending}
          onChange={(event) => update("message", event.target.value)}
          onBlur={() => revalidateOnBlur("message")}
        />
        <p id={id("message-count")} className="m-0 mt-1.5 text-right text-[0.8rem] tabular-nums text-swc-ink-3">
          {values.message.length}/{MESSAGE_MAX} characters
        </p>
        <Below id={id("message")} error={messageError} />
      </div>
      <Note id={id("message-privacy")} icon={<Info className="h-[18px] w-[18px]" aria-hidden="true" />}>
        Please do not include confidential case information or personal details about people you support.
      </Note>

      {/* Spam trap: real visitors never see or fill this. */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col gap-4 border-t border-swc-line pt-6">
        <p className="m-0 text-[0.88rem] text-swc-ink-3">
          We use these details only to respond to your enquiry. Read our{" "}
          <Link href="/privacy-policy" className="font-semibold text-swc-label underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
        <button type="submit" className="swc-btn swc-btn--gold w-full min-[701px]:w-auto min-[701px]:self-start" disabled={sending} aria-disabled={sending}>
          {sending && <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden="true" />}
          {sending ? "Sending…" : "Send Message"}
        </button>
        <p className="m-0 text-[0.85rem] text-swc-ink-3" role="status" aria-live="polite">
          {sending ? "Sending your message, please wait." : "We will reply using the email address you provide."}
        </p>
      </div>
    </form>
  );
}
