import type { Metadata } from "next";
import { PrivacyHero } from "@/components/privacy/PrivacyHero";
import { PrivacyContent } from "@/components/privacy/PrivacyContent";
import { JsonLd, pageJsonLd, pageMetadata } from "@/lib/site";

const title = "Privacy Policy | Social Work Nigeria Instructors";
const description =
  "Privacy Policy, Terms of Use and Safeguarding Statement for Social Work Consultancy Ltd.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/privacy-policy" });

export default function PrivacyPolicyPage() {
  return (
    <>
      <JsonLd data={pageJsonLd({ path: "/privacy-policy", name: title, description, crumbs: [{ name: "Privacy Policy", path: "/privacy-policy" }] })} />
      <PrivacyHero />
      <PrivacyContent />
    </>
  );
}
