import type { Metadata } from "next";
import { Suspense } from "react";
import InstructorApplication from "@/components/instructor/InstructorApplication";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Apply to Teach | Social Work Nigeria Instructors",
  description:
    "Apply to become an instructor with Social Work Consultancy Ltd. Send your details and CV; if approved, you will receive a link to set up your account.",
  path: "/register",
});

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <InstructorApplication />
    </Suspense>
  );
}
