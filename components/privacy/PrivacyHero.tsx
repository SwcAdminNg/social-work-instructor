import { CalendarDays } from "lucide-react";
import PageHero from "@/components/site/PageHero";

export function PrivacyHero() {
  return (
    <PageHero
      id="privacy-heading"
      eyebrow="Legal"
      title="Privacy *Policy*"
      lead="How we collect, use and protect your information, together with our terms of use and safeguarding statement."
      compact
    >
      <span className="sw-chip bg-white/10 text-white backdrop-blur">
        <CalendarDays size={14} className="text-gold-light" aria-hidden="true" />
        Last updated: 9 July 2026
      </span>
    </PageHero>
  );
}
