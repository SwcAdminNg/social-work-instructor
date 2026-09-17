"use client";

import { FileText, Book, Shield, HeartHandshake, Download, ExternalLink, Video } from "lucide-react";

export function ResourcesList() {
  const resources = [
    {
      title: "National Social Work Guidelines",
      description: "Comprehensive standards and protocols for social work practice in Nigeria, aligned with global best practices.",
      icon: <FileText className="w-8 h-8 text-[#2D6A4F]" />,
      type: "PDF Document",
      size: "2.4 MB",
    },
    {
      title: "Child Safeguarding Toolkit",
      description: "Practical tools and checklists for identifying, assessing, and reporting child protection concerns.",
      icon: <Shield className="w-8 h-8 text-amber-600" />,
      type: "Toolkit",
      size: "1.8 MB",
    },
    {
      title: "Ethics & Professional Conduct Manual",
      description: "A deep dive into ethical dilemmas, decision-making frameworks, and professional boundaries.",
      icon: <Book className="w-8 h-8 text-blue-600" />,
      type: "Manual",
      size: "3.1 MB",
    },
    {
      title: "Mental Health Referral Directory",
      description: "An updated registry of certified mental health practitioners and facilities across major Nigerian cities.",
      icon: <HeartHandshake className="w-8 h-8 text-rose-600" />,
      type: "Directory",
      size: "845 KB",
    },
    {
      title: "Practice Reflection Templates",
      description: "Printable templates for supervised practice, self-reflection, and continuous professional development logging.",
      icon: <FileText className="w-8 h-8 text-[#2D6A4F]" />,
      type: "Templates",
      size: "1.2 MB",
    },
    {
      title: "Ethics in Practice Webinar",
      description: "Recorded session discussing complex safeguarding cases and navigating local legal frameworks.",
      icon: <Video className="w-8 h-8 text-purple-600" />,
      type: "Video",
      size: "45 mins",
    },
  ];

  return (
    <section className="py-20 md:py-32 px-6 bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
            Curated Practice Materials
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            Explore our library of free, peer-reviewed resources designed to enhance your daily practice and ensure ethical compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {resources.map((resource, idx) => (
            <div 
              key={idx}
              className="group bg-white dark:bg-[#141414] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {resource.icon}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {resource.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed mb-8 flex-1">
                {resource.description}
              </p>
              
              <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {resource.type}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-300">
                    {resource.size}
                  </span>
                </div>
                
                <button
                  aria-label={resource.type === "Video" ? `Watch ${resource.title}` : `Download ${resource.title}`}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 text-[#2D6A4F] dark:text-[#52b788] group-hover:bg-[#2D6A4F] group-hover:text-white transition-colors duration-300"
                >
                  {resource.type === "Video" ? (
                    <ExternalLink aria-hidden="true" className="w-5 h-5" />
                  ) : (
                    <Download aria-hidden="true" className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
