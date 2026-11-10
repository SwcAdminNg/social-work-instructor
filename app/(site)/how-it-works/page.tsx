import type { Metadata } from "next";
import HowItWorks from "@/components/how-it-works/HowItWorks";
import { JsonLd, pageJsonLd, pageMetadata } from "@/lib/site";

const title = "How It Works | Social Work Nigeria Instructors";
const description =
  "How to become an instructor and publish a course: apply with your CV, set up your account, build in the course studio, pass review and start teaching.";

const steps = ["Send your application", "We review it", "Set up your account", "Build your course", "Submit for review", "Publish and teach"];

export const metadata: Metadata = pageMetadata({ title, description, path: "/how-it-works" });

export default function HowItWorksPage() {
  return (
    <>
      <JsonLd
        data={pageJsonLd({
          path: "/how-it-works",
          name: title,
          description,
          crumbs: [{ name: "How It Works", path: "/how-it-works" }],
          extra: [
            {
              "@type": "HowTo",
              name: "How to become an instructor and publish a course",
              step: steps.map((name, i) => ({ "@type": "HowToStep", position: i + 1, name })),
            },
          ],
        })}
      />
      <HowItWorks />
    </>
  );
}
