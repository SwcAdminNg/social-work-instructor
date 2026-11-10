import type { Metadata } from "next";
import Contact from "@/components/contact/Contact";
import { JsonLd, pageJsonLd, pageMetadata } from "@/lib/site";

const title = "Contact Us | Social Work Nigeria Instructors";
const description =
  "Ask Social Work Consultancy Ltd about becoming an instructor, building or reviewing a course, or your instructor account. We reply by email.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/contact" });

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // ?topic=apply (or course, account, partnership, other) pre-selects the enquiry type.
  const { topic } = await searchParams;
  return (
    <>
      <JsonLd data={pageJsonLd({ type: "ContactPage", path: "/contact", name: title, description, crumbs: [{ name: "Contact Us", path: "/contact" }] })} />
      <Contact initialTopic={typeof topic === "string" ? topic : undefined} />
    </>
  );
}
