import type { Metadata } from "next";
import InstructorLanding from "@/components/home/InstructorLanding";
import { JsonLd, pageJsonLd, pageMetadata } from "@/lib/site";

const title = "Teach with SWCL | Instructor opportunities";
const description =
  "Contribute to practical, ethical and culturally relevant professional learning with Social Work Consultancy Ltd.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/" });

export default function HomePage() {
  return (
    <>
      <JsonLd data={pageJsonLd({ path: "/", name: title, description })} />
      <InstructorLanding />
    </>
  );
}
