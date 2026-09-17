import { Metadata } from "next";
import { auth } from "@/auth";
import { publicFetchApi } from "@/lib/fetchApi";
import { FAQHero } from "@/components/faq/FAQHero";
import { FAQContent } from "@/components/faq/FAQContent";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Social Work Nigeria",
  description:
    "Find answers to common questions about our courses, mentorship, and certification.",
};

export default async function FAQPage() {
  const session = await auth();

  let categories = [];
  try {
    const res = await publicFetchApi("/support/faq", {
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      categories = json?.data || [];
    }
  } catch {
    categories = [];
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <FAQHero />
      <FAQContent categories={categories} isAuthenticated={!!session} />
    </div>
  );
}
