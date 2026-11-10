import { Suspense } from "react";
import InstructorCompleteSetup from "@/components/instructor/InstructorCompleteSetup";
import { siteFonts } from "@/lib/fonts";

export const metadata = {
  title: "Complete Instructor Setup | Social Work Nigeria",
  robots: { index: false, follow: false },
};

export default function CompleteSetupPage() {
  return (
    <div className={`${siteFonts} sw`}>
      <Suspense fallback={null}>
        <InstructorCompleteSetup />
      </Suspense>
    </div>
  );
}
