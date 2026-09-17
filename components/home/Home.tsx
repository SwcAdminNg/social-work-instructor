import CTABanner from "./CTABanner";
import Hero from "./Hero";
import LearningTransform from "./LearningTransform";
import WhyChooseUs from "./WhyChooseUs";

export default function Home() {
  return (
    <>
      <Hero />
      <WhyChooseUs />
      <LearningTransform />
      <CTABanner statsData={null} />
    </>
  );
}
