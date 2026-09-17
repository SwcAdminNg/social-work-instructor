"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function ResourcesHero() {
  return (
    <div className="relative w-full h-[50vh] md:h-[60vh] min-h-[400px] lg:min-h-[500px] xl:min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop")',
        }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 z-10 bg-black/50 dark:bg-black/60" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-4xl mx-auto mt-12 lg:mt-0">
        <nav className="flex items-center text-sm text-gray-200 mb-4 tracking-wide font-medium">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <span className="text-white">Resources</span>
        </nav>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight drop-shadow-lg">
          Knowledge Hub
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-200 max-w-2xl font-medium drop-shadow-md">
          Access essential toolkits, guidelines, and practice materials designed
          to support social workers across the Global South.
        </p>
      </div>
    </div>
  );
}
