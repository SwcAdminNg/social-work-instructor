"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Info, Mail, Phone, ShieldAlert, UserRound } from "lucide-react";
import { ChoiceGroup, FormAlert, FormNote, FormSuccess, RequiredNote, SpamTrap, SubmitButton, TextArea, TextField } from "@/components/site/form";

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
  const checked = validate(values);
  const isValid = (field: Field) => Boolean(values[field].trim()) && !checked[field];

  if (status === "sent") {
    return (
      <FormSuccess
        ref={successRef}
        title="Thank you. Your message has been received."
        body="We will reply to the email address you provided."
        reference={reference}
        againLabel="Send another message"
        onAgain={() => setStatus("idle")}
      />
    );
  }

  return (
    <form ref={formRef} className="swf-form mt-7" onSubmit={handleSubmit} noValidate aria-describedby={id("required-note")}>
      <RequiredNote id={id("required-note")} />

      {errorList.length > 0 && (
        <FormAlert
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
        </FormAlert>
      )}

      {status === "limited" && (
        <FormAlert ref={failureRef} title="You have sent several messages in a short time.">
          <p>
            Please wait a few minutes and try again, or email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Your answers are still below.
          </p>
        </FormAlert>
      )}

      {status === "failed" && (
        <FormAlert ref={failureRef} title="We could not send your message.">
          <p>
            Please try again or email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Your answers are still
            below.
          </p>
        </FormAlert>
      )}

      <div className="swf-row">
        <TextField
          id={id("fullName")}
          name="name"
          label="Full name"
          icon={<UserRound size={19} />}
          autoComplete="name"
          required
          value={values.fullName}
          onChange={(value) => update("fullName", value)}
          onBlur={() => revalidateOnBlur("fullName")}
          error={errors.fullName}
          valid={isValid("fullName")}
          disabled={sending}
        />
        <TextField
          id={id("email")}
          name="email"
          type="email"
          label="Email address"
          icon={<Mail size={19} />}
          autoComplete="email"
          required
          hint="We will send our reply here."
          value={values.email}
          onChange={(value) => update("email", value)}
          onBlur={() => revalidateOnBlur("email")}
          error={errors.email}
          valid={isValid("email")}
          disabled={sending}
        />
      </div>

      <ChoiceGroup
        id={id("topic")}
        name="topic"
        legend="Enquiry type"
        required
        options={TOPICS.map((topic) => ({ value: topic.value, label: topic.label }))}
        value={values.topic ? [values.topic] : []}
        onToggle={(value) => update("topic", value)}
        error={errors.topic}
        disabled={sending}
      />

      {values.topic === "account" && (
        <FormNote id={id("account-tip")} icon={<ShieldAlert size={18} aria-hidden="true" />}>
          Describe the issue and the email you sign in with. Never send passwords, payment-card details or
          confidential case records.
        </FormNote>
      )}

      <TextField
        id={id("phone")}
        name="phone"
        type="tel"
        label="Telephone number"
        icon={<Phone size={19} />}
        autoComplete="tel"
        optional
        hint="Include your country code if you are outside Nigeria."
        value={values.phone}
        onChange={(value) => update("phone", value)}
        onBlur={() => revalidateOnBlur("phone")}
        error={errors.phone}
        valid={isValid("phone")}
        disabled={sending}
      />

      <TextArea
        ref={messageRef}
        id={id("message")}
        name="message"
        label="Message"
        required
        maxLength={MESSAGE_MAX}
        placeholder="Tell us what you need help with."
        describedBy={[id("message-privacy"), values.topic === "account" ? id("account-tip") : ""].filter(Boolean).join(" ")}
        value={values.message}
        onChange={(value) => update("message", value)}
        onBlur={() => revalidateOnBlur("message")}
        error={errors.message}
        disabled={sending}
      />
      <FormNote id={id("message-privacy")} icon={<Info size={18} aria-hidden="true" />}>
        Please do not include confidential case information or personal details about people you support.
      </FormNote>

      <SpamTrap />

      <div className="swf-foot">
        <p>
          We use these details only to respond to your enquiry. Read our <Link href="/privacy-policy">Privacy Policy</Link>.
        </p>
        <SubmitButton sending={sending}>Send Message</SubmitButton>
        <p className="text-center" role="status" aria-live="polite">
          {sending ? "Sending your message, please wait." : "We will reply using the email address you provide."}
        </p>
      </div>
    </form>
  );
}
