"use client";

import { CheckCircle2 } from "lucide-react";

export function MentorshipProcess() {
  const whoCanJoin = [
    "Social work students in Nigeria and across Africa",
    "Early-career professionals seeking guidance",
    "Individuals preparing for postgraduate or international study",
    "Alumni of our training or CPD programmes",
  ];

  const howItWorks = [
    {
      title: "Submit an Expression of Interest",
      desc: "Please fill out a simple form indicating your interests, goals, and availability to make it easy for you to start your mentorship journey.",
    },
    {
      title: "Get Matched",
      desc: "We will match you with a mentor based on your needs and area of interest.",
    },
    {
      title: "Start Your Journey",
      desc: "Meet virtually (or in-person where possible) for structured sessions and ongoing support.",
    },
  ];

  return (
    <section className="py-20 md:py-32 px-6 bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gray-50/50 dark:bg-gray-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gray-50/50 dark:bg-gray-900/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-24">
        {/* Who Can Join */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
              Who Can Join?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 font-medium">
              Our mentorship programme is open to:
            </p>
            <ul className="space-y-4">
              {whoCanJoin.map((item, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span className="text-gray-800 dark:text-gray-200 font-medium text-lg leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2 hidden lg:flex justify-end">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 bg-[#2D6A4F]/10 dark:bg-[#52b788]/10 rounded-3xl translate-x-4 translate-y-4" />
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                alt="Diverse group of students and professionals"
                className="relative z-10 w-full rounded-3xl object-cover shadow-2xl h-[400px]"
              />
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="flex flex-col lg:flex-row-reverse items-start lg:items-center justify-between gap-12 pt-12 border-t border-gray-100 dark:border-gray-800">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-10 tracking-tight">
              How It Works
            </h2>
            <div className="space-y-8">
              {howItWorks.map((step, idx) => (
                <div key={idx} className="flex gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 group-hover:bg-[#2D6A4F] group-hover:text-white transition-colors shrink-0 text-lg">
                      {idx + 1}
                    </div>
                    {idx !== howItWorks.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-100 dark:bg-gray-800 mt-4 group-hover:bg-[#2D6A4F]/30 transition-colors" />
                    )}
                  </div>
                  <div className="pb-8">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                      {step.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg leading-relaxed font-medium">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-1/2 hidden lg:flex justify-start relative">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 bg-[#2D6A4F]/10 dark:bg-[#52b788]/10 rounded-3xl -translate-x-4 translate-y-4" />
              <img
                src="https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?q=80&w=1974&auto=format&fit=crop"
                alt="Mentorship session"
                className="relative z-10 w-full rounded-3xl object-cover shadow-2xl h-[400px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
