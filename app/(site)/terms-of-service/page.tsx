import { TermsHero } from "@/components/terms/TermsHero";
import { TermsContent } from "@/components/terms/TermsContent";

export const metadata = {
  title: "Terms of Service | Social Work Nigeria",
  description: "Terms of Service for the Social Work Consultancy Ltd (SWCL) LMS platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a] flex flex-col">
      <TermsHero />
      <TermsContent />
    </div>
  );
}
