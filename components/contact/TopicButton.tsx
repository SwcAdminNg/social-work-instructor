"use client";

import { TOPIC_EVENT, type TopicValue } from "./ContactForm";

/** Chooses an enquiry topic in the form and moves the visitor to it. */
export default function TopicButton({
  topic,
  className,
  children,
}: {
  topic: TopicValue;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent(TOPIC_EVENT, { detail: topic }))}
    >
      {children}
    </button>
  );
}
