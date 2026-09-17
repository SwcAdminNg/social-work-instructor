"use client";

import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Inline styles for custom animations to avoid touching tailwind config */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-reverse {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: float-reverse 7s ease-in-out infinite;
        }
      `,
        }}
      />

      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-white dark:bg-[#0a0a0a] overflow-hidden relative selection:bg-[#2D6A4F]/30">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/5 blur-[100px] animate-float" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#F4A261]/10 dark:bg-[#F4A261]/5 blur-[120px] animate-float-reverse" />
          <div
            className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-emerald-500/10 dark:bg-emerald-900/10 blur-[80px] animate-pulse"
            style={{ animationDuration: "4s" }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-3xl mx-auto">
          {/* Animated Icon */}
          <div
            className={`mb-8 relative transition-all duration-1000 transform ${mounted ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
          >
            <div
              className="absolute inset-0 flex items-center justify-center animate-ping opacity-20"
              style={{ animationDuration: "3s" }}
            >
              <Compass className="w-32 h-32 text-[#2D6A4F] dark:text-[#52b788]" />
            </div>
            <Compass className="w-24 h-24 text-[#2D6A4F] dark:text-[#52b788] relative z-10 animate-float" />
          </div>

          {/* 404 Text */}
          <h1
            className={`text-[8rem] md:text-[12rem] font-extrabold tracking-tighter leading-none mb-2 bg-clip-text text-transparent bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-600 drop-shadow-sm transition-all duration-700 delay-100 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}
          >
            404
          </h1>

          {/* Message */}
          <div
            className={`space-y-4 mb-10 transition-all duration-700 delay-300 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Looks like you've wandered off the path.
            </h2>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
              The page you're looking for doesn't exist or has been moved. Let's
              get you back to your workspace.
            </p>
          </div>

          {/* Button */}
          <div
            className={`transition-all duration-700 delay-500 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}
          >
            <Link
              href="/"
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#2D6A4F] dark:bg-[#52b788] text-white font-bold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[#2D6A4F]/25 dark:hover:shadow-[#52b788]/25 active:scale-[0.98]"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 dark:bg-black/10 group-hover:translate-x-full transition-transform duration-700 ease-out -translate-x-full" />
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
