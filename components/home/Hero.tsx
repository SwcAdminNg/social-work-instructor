import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative w-full py-24 md:py-0 md:h-[60vh] min-h-[500px] lg:min-h-[500px] xl:min-h-[600px] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/home/social-works-hero.webp"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-top dark:brightness-[0.8]"
        />
      </div>

      {/* Solid Dark Overlay instead of gradients */}
      <div className="absolute inset-0 z-10 bg-black/50 dark:bg-black/60" />

      {/* Content */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 mt-10 md:mt-0">
        <div className="max-w-[520px]">
          {/* Eyebrow */}
          <p className="text-lg font-bold text-gray-200 mb-2 tracking-tight">
            Instructor Platform
          </p>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white tracking-tight mb-0 drop-shadow-sm">
            For Social Work Instructors{" "}
            <span className="underline decoration-[#52b788] underline-offset-4 decoration-2">
              In Nigeria
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-6 mb-8 text-base md:text-lg text-gray-200 leading-relaxed max-w-[420px]">
            Coordinate your profile and community presence for Social Work
            Nigeria.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/dashboard/community"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-[#2D6A4F] text-white text-base font-bold rounded-full shadow-lg shadow-[#2D6A4F]/20 hover:bg-[#1e4d38] hover:-translate-y-0.5 transition-all duration-200"
            >
              Open Community
            </Link>
            <Link
              href="/about-us"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white/10 text-white text-base font-bold rounded-full border border-white/30 backdrop-blur-sm shadow-sm hover:border-white hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
