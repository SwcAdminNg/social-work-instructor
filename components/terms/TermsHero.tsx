"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function TermsHero() {
  return (
    <div className="relative w-full h-[40vh] md:h-[50vh] min-h-[300px] lg:min-h-[400px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop")',
        }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 z-10 bg-black/60 dark:bg-black/70" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-4xl mx-auto mt-12 lg:mt-0">
        <nav className="flex items-center text-sm text-gray-400 mb-4 tracking-wide font-medium">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-500" />
          <span className="text-gray-200">Terms of Service</span>
        </nav>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg">
          Terms of Service
        </h1>
        <p className="mt-6 text-sm md:text-base text-[#52b788] bg-[#2D6A4F]/20 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest border border-[#2D6A4F]/30 backdrop-blur-sm">
          Last Updated: 9 July 2026
        </p>
      </div>
    </div>
  );
}
