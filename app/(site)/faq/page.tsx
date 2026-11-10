import type { Metadata } from "next";
import { auth } from "@/auth";
import { fetchApi } from "@/lib/fetchApi";
import FAQ, { type FAQCategory } from "@/components/faq/FAQ";
import { JsonLd, pageJsonLd, pageMetadata } from "@/lib/site";

const title = "Frequently Asked Questions | Social Work Nigeria Instructors";
const description =
  "Answers for instructors on Socialworknigeria.org: applying, building and submitting courses, review, assessments and your account.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/faq" });

export default async function FAQPage() {
  const session = await auth();

  let categories: FAQCategory[] = [];
  let loadFailed = false;
  try {
    const res = await fetchApi("/support/faq", { next: { revalidate: 300 } });
    if (res.ok) {
      const json = await res.json().catch(() => null);
      categories = Array.isArray(json?.data) ? json.data : [];
    } else {
      loadFailed = true;
    }
  } catch {
    loadFailed = true;
  }

  // Published answers meant for instructors, as structured data for search engines.
  const items = categories.flatMap((c) =>
    c.items.filter((i) => i.is_published !== false && i.audience !== "STUDENT"),
  );

  return (
    <>
      <JsonLd
        data={pageJsonLd({
          type: "FAQPage",
          path: "/faq",
          name: title,
          description,
          crumbs: [{ name: "FAQ", path: "/faq" }],
          mainEntity: items.map((i) => ({
            "@type": "Question",
            name: i.question,
            acceptedAnswer: { "@type": "Answer", text: i.answer },
          })),
        })}
      />
      <FAQ categories={categories} isAuthenticated={Boolean(session)} loadFailed={loadFailed} />
    </>
  );
}
