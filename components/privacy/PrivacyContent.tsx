"use client";

import { ShieldCheck, ScrollText, HeartHandshake, Mail } from "lucide-react";

export function PrivacyContent() {
  const sections = [
    { id: "privacy", title: "Privacy Policy", icon: <ShieldCheck className="w-5 h-5" /> },
    { id: "terms", title: "Terms of Use", icon: <ScrollText className="w-5 h-5" /> },
    { id: "safeguarding", title: "Safeguarding", icon: <HeartHandshake className="w-5 h-5" /> },
    { id: "contact", title: "Contact Us", icon: <Mail className="w-5 h-5" /> },
  ];

  return (
    <section className="py-16 md:py-24 px-6 bg-gray-50 dark:bg-[#060f0a]">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16">
        
        {/* Sticky Sidebar Navigation */}
        <aside className="lg:w-1/4 hidden lg:block">
          <div className="sticky top-32 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">
              Table of Contents
            </h4>
            <nav className="flex flex-col gap-1">
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-[#2D6A4F]/10 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors"
                >
                  <span className="opacity-70">{sec.icon}</span>
                  <span>{sec.title}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:w-3/4 flex flex-col gap-8">
          
          <div id="privacy" className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-sm scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
              <p>We respect your privacy and are committed to protecting your data. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you visit our website or utilise our services.</p>
              <p>We may collect personal information, such as your name, email address, telephone number, and course preferences, to provide services and communicate with you.</p>
              <p>We do not sell your data. Your information is shared solely with third parties essential for course delivery and certification, such as CPD accreditation platforms.</p>
              <p>By using our platform, you agree to the terms outlined in this Privacy Policy.</p>
            </div>
          </div>

          <div id="terms" className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-sm scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500">
                <ScrollText className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Terms of Use</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-6">By accessing our website and e-learning platform, you agree to comply with the following terms of use:</p>
            <ul className="space-y-3 list-none pl-0">
              <ListItem>Use the platform solely for lawful, educational purposes.</ListItem>
              <ListItem>Do not distribute course content without written permission.</ListItem>
              <ListItem>Respect your fellow learners and contribute positively to forums.</ListItem>
              <ListItem>You are responsible for protecting your login credentials.</ListItem>
              <ListItem>A breach of these terms may result in restricted access or removal.</ListItem>
            </ul>
          </div>

          <div id="safeguarding" className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-sm scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Safeguarding Statement</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-6 leading-relaxed">
              Social Work Consultancy Ltd is dedicated to safeguarding and promoting the welfare of all learners and beneficiaries of our training and consultancy services. We acknowledge our responsibility to prevent abuse, uphold the rights of children and vulnerable adults, and foster safe, inclusive learning environments.
            </p>
            <p className="text-gray-900 dark:text-white font-semibold mb-4">Our safeguarding practices include:</p>
            <ul className="space-y-3 list-none pl-0">
              <ListItem>Adhering to national child protection laws and international standards.</ListItem>
              <ListItem>Requiring all staff, instructors, and partners to undergo safeguarding induction.</ListItem>
              <ListItem>Providing clear reporting channels for concerns or disclosures.</ListItem>
              <ListItem>Regularly reviewing and updating safeguarding policies and protocols.</ListItem>
            </ul>
          </div>

          <div id="contact" className="bg-[#2D6A4F] dark:bg-[#141414] border border-transparent dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-lg scroll-mt-32 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-white/5 flex items-center justify-center text-white">
                  <Mail className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-white">Contact Us</h2>
              </div>
              <p className="text-green-50 dark:text-gray-300 font-medium leading-relaxed mb-6">
                For inquiries regarding privacy, data usage, or protection, please reach out to our support team. We take your data seriously and will respond promptly.
              </p>
              <a href="mailto:support@socialworknigeria.org" className="inline-flex items-center gap-2 bg-white text-[#2D6A4F] dark:bg-white/10 dark:text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-white/20 transition-colors shadow-sm">
                <Mail className="w-4 h-4" />
                support@socialworknigeria.org
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
      <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] dark:bg-[#52b788] mt-2.5 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}
