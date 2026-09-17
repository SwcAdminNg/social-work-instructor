import { Suspense } from "react";
import InstructorCompleteSetup from "@/components/instructor/InstructorCompleteSetup";

export const metadata = {
  title: "Complete Instructor Setup | Social Work Nigeria",
};

export default function InstructorCompleteSetupPage() {
  return (
    <Suspense fallback={null}>
      <InstructorCompleteSetup />
    </Suspense>
  );
}
