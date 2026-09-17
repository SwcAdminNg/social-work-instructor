import { AboutHero } from "@/components/about/AboutHero";
import { AboutIntro } from "@/components/about/AboutIntro";
import { AboutWhy } from "@/components/about/AboutWhy";

export const metadata = {
  title: "About Us | Social Work Nigeria",
  description: "Learn more about Social Work Nigeria and our mission.",
};

export default function AboutUsPage() {
  return (
    <div className="w-full bg-white dark:bg-gray-950 flex flex-col">
      <AboutHero />
      <AboutIntro />
      <AboutWhy />
    </div>
  );
}
