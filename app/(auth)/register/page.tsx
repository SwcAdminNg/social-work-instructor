import { Suspense } from "react";
import InstructorApplication from "@/components/instructor/InstructorApplication";

export const metadata = {
  title: "Become an Instructor | Social Work Nigeria",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <InstructorApplication />
    </Suspense>
  );
}
