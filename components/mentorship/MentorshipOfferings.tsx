"use client";

import { Shuffle, Move, GraduationCap, Radio, BookOpen } from "lucide-react";

export function MentorshipOfferings() {
  const offerings = [
    {
      icon: <Shuffle className="w-8 h-8 text-gray-800 dark:text-gray-200" />,
      title: "One-to-One Mentorship",
      description: "Personalised support from experienced social workers, consultants, and academics who understand your challenges and opportunities. Our tailored sessions aim to empower you and foster your growth."
    },
    {
      icon: <Move className="w-8 h-8 text-gray-800 dark:text-gray-200" />,
      title: "Placement & Academic Support",
      description: "Guidance on preparing for field education, reflective writing, critical analysis, and linking theory to practice is invaluable for students undertaking Practice Learning modules or preparing research assignments."
    },
    {
      icon: <GraduationCap className="w-8 h-8 text-gray-800 dark:text-gray-200" />,
      title: "International Opportunities Advice",
      description: "Thinking of studying or working abroad? Our mentors can advise on UK university applications, scholarships, CPD pathways, and on aligning your goals with global standards in social work."
    },
    {
      icon: <Radio className="w-8 h-8 text-gray-800 dark:text-gray-200" />,
      title: "Professional Networking",
      description: "Join a vibrant community of practitioners and thought leaders through our alumni network, webinars, and events. We foster peer learning and collaboration across disciplines and borders, helping you feel connected and supported."
    },
    {
      icon: <BookOpen className="w-8 h-8 text-gray-800 dark:text-gray-200" />,
      title: "Career Coaching",
      description: "Need help with job applications, CV writing, or interview preparation? Our mentors will support you in identifying your strengths, mapping your career path, and building confidence in your next steps."
    }
  ];

  return (
    <section className="py-20 md:py-32 px-6 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto text-center mb-24">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-8 leading-tight tracking-tight">
          Empowering the Next Generation of Social Work Professionals
        </h2>
        <div className="space-y-6 text-base md:text-lg text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
          <p>
            At Social Work Nigeria, we believe that mentorship is key to developing a skilled, ethical, and confident social services workforce.
          </p>
          <p>
            Our Mentorship Programme is designed to support social work students, recent graduates, and early-career professionals in their personal and professional growth.
          </p>
          <p>
            Whether you're preparing for your first field placement, considering postgraduate study, or seeking career guidance, our mentors are here to walk alongside you, offering insight, encouragement, and practical tools.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <h3 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-16 tracking-tight">
          What We Offer
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {offerings.map((offering, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-10 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="flex flex-col items-center text-center h-full">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-8">
                  {offering.icon}
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 leading-snug">
                  {offering.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed flex-1">
                  {offering.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
