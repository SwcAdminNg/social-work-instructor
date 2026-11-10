import type { Metadata } from "next";
import About from "@/components/about/About";
import { JsonLd, pageJsonLd, pageMetadata } from "@/lib/site";

const title = "About Us | Social Work Nigeria Instructors";
const description =
  "The instructor platform of Social Work Consultancy Ltd, where practice-led social work courses for learners in Nigeria and the Global South are built, reviewed and taught.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/about-us" });

export default function AboutUsPage() {
  return (
    <>
      <JsonLd data={pageJsonLd({ type: "AboutPage", path: "/about-us", name: title, description, crumbs: [{ name: "About Us", path: "/about-us" }] })} />
      <About />
    </>
  );
}
