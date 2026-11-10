import type { Metadata } from "next";
import Home from "@/components/home/Home";
import { JsonLd, pageJsonLd, pageMetadata } from "@/lib/site";

const title = "Teach Social Work in Nigeria | Social Work Nigeria Instructors";
const description =
  "Become an instructor with Social Work Consultancy Ltd. Turn your practice experience into reviewed online courses for social workers, students and caregivers across Nigeria.";

export const metadata: Metadata = pageMetadata({ title, description, path: "/" });

export default function HomePage() {
  return (
    <>
      <JsonLd data={pageJsonLd({ path: "/", name: title, description })} />
      <Home />
    </>
  );
}
