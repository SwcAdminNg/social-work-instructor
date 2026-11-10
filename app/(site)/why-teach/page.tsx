import type { Metadata } from "next";
import WhyTeach from "@/components/why-teach/WhyTeach";
import { JsonLd, pageJsonLd, pageMetadata } from "@/lib/site";

const title = "Why Teach With Us | Social Work Nigeria Instructors";
const description =
  "Why social work practitioners, lecturers and specialists teach on Socialworknigeria.org: national reach, a full course studio, careful review and a community of instructors.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/why-teach" });

export default function WhyTeachPage() {
  return (
    <>
      <JsonLd data={pageJsonLd({ path: "/why-teach", name: title, description, crumbs: [{ name: "Why Teach", path: "/why-teach" }] })} />
      <WhyTeach />
    </>
  );
}
