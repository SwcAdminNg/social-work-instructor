import { CalendarDays } from "lucide-react";
import PageHero from "@/components/site/PageHero";

export function TermsHero() {
  return (
    <PageHero
      id="terms-heading"
      eyebrow="Legal"
      title="Terms of *Service*"
      lead="The terms that apply when you use the Social Work Consultancy Ltd learning platform."
      compact
    >
      <span className="sw-chip bg-white/10 text-white backdrop-blur">
        <CalendarDays size={14} className="text-gold-light" aria-hidden="true" />
        Last updated: 9 July 2026
      </span>
    </PageHero>
  );
}
