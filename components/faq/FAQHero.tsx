"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function FAQHero() {
  return (
    <section className="relative w-full h-[50vh] md:h-[60vh] min-h-[400px] lg:min-h-[500px] xl:min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop")',
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 z-10 bg-black/60 dark:bg-black/70" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-4xl mx-auto mt-16 lg:mt-0">
        <nav className="flex items-center text-sm text-gray-200 mb-6 tracking-wide font-medium">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <span className="text-white">FAQ</span>
        </nav>

        {/* Eyebrow */}
        <p className="text-lg md:text-xl font-bold text-[#52b788] mb-4 tracking-wider uppercase bg-[#2D6A4F]/20 px-6 py-2 rounded-full border border-[#2D6A4F]/30 backdrop-blur-sm">
          Support & Guidance
        </p>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white tracking-tight drop-shadow-lg mb-6 leading-tight">
          How Can We{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#52b788] to-[#2D6A4F]">
            Help You?
          </span>
        </h1>

        {/* Subtext */}
        <p className="mt-4 text-base md:text-lg lg:text-xl text-gray-300 max-w-2xl font-medium leading-relaxed">
          Find answers to commonly asked questions about our programs,
          mentorship, and CPD accreditation.
        </p>
      </div>
    </section>
  );
}
