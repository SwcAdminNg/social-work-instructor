import type { Metadata } from "next";
import { TermsHero } from "@/components/terms/TermsHero";
import { TermsContent } from "@/components/terms/TermsContent";
import { JsonLd, pageJsonLd, pageMetadata } from "@/lib/site";

const title = "Terms of Service | Social Work Nigeria Instructors";
const description =
  "Terms of Service for the Social Work Consultancy Ltd (SWCL) learning and instructor platform.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/terms-of-service" });

export default function TermsOfServicePage() {
  return (
    <>
      <JsonLd data={pageJsonLd({ path: "/terms-of-service", name: title, description, crumbs: [{ name: "Terms of Service", path: "/terms-of-service" }] })} />
      <TermsHero />
      <TermsContent />
    </>
  );
}
