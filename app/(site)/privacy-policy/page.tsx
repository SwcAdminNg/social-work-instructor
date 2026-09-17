import { PrivacyHero } from "@/components/privacy/PrivacyHero";
import { PrivacyContent } from "@/components/privacy/PrivacyContent";

export const metadata = {
  title: "Privacy Policy | Social Work Nigeria",
  description: "Privacy Policy, Terms of Use, and Safeguarding Statement for Social Work Consultancy Ltd.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a] flex flex-col">
      <PrivacyHero />
      <PrivacyContent />
    </div>
  );
}
