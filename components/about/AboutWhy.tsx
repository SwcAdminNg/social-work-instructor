"use client";

import { Star } from "lucide-react";

export function AboutWhy() {
  const points = [
    "We bridge the gap between everyday practice challenges and globally recognised social work principles, ensuring learning is practical, culturally responsive, and safeguarding-focused.",
    "We place strong emphasis on ethics, professional accountability, and human rights, equipping practitioners and organisations to work safely, responsibly, and with confidence.",
    "Learning is delivered in accessible and flexible formats, allowing professionals to engage in development alongside demanding roles and responsibilities.",
    "Beyond structured courses, Social Work Nigeria provides mentorship and reflective practice clinics that support ongoing learning, ethical decision-making, and professional resilience.",
    "By working with both individuals and organisations, we support sustainable improvements in practice quality and safeguarding standards.",
  ];

  return (
    <section className="py-20 md:py-32 px-6 bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Text */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight">
            Why Social Work Nigeria
          </h2>
          <div className="space-y-6 text-lg text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
            <p>
              Social Work Nigeria is a professional learning and capacity-building platform committed to strengthening ethical, skilled, and contextually relevant social work practice across Nigeria and the Global South.
            </p>
            <p>
              Our work is grounded in the realities of practice, supporting individuals and organisations working with children, families, and vulnerable adults in settings where access to formal training, supervision, and continuing professional development is often limited.
            </p>
          </div>
        </div>

        {/* Grid Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 lg:gap-x-16 lg:gap-y-20 max-w-6xl mx-auto">
          {points.map((text, idx) => (
            <div key={idx} className="flex flex-col items-center text-center group">
              <div className="mb-6 transform transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-2">
                <Star 
                  className="w-10 h-10 text-[#2D6A4F] dark:text-[#52b788] fill-[#2D6A4F] dark:fill-[#52b788]" 
                />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed font-medium">
                {text}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
