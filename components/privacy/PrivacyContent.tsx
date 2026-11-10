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
    <section className="sw-sheet bg-paper px-5 pb-24 pt-16 md:px-10 md:pb-32 md:pt-24">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16">
        
        {/* Sticky Sidebar Navigation */}
        <aside className="lg:w-1/4 hidden lg:block">
          <div className="sticky top-32 bg-card border border-line rounded-[28px] p-6">
            <h4 className="sw-cap m-0 text-ink-3 mb-6">
              Table of Contents
            </h4>
            <nav className="flex flex-col gap-1">
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink-2 no-underline hover:bg-mint hover:text-accent transition-colors"
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
          
          <div data-reveal id="privacy" className="bg-card border border-line rounded-[32px] p-8 md:p-11 scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-mint flex items-center justify-center text-accent">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="sw-title m-0 text-[1.7rem] text-ink">Privacy Policy</h2>
            </div>
            <div className="space-y-4 text-ink-2 leading-relaxed">
              <p>We respect your privacy and are committed to protecting your data. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you visit our website or utilise our services.</p>
              <p>We may collect personal information, such as your name, email address, telephone number, and course preferences, to provide services and communicate with you.</p>
              <p>We do not sell your data. Your information is shared solely with third parties essential for course delivery and certification, such as CPD accreditation platforms.</p>
              <p>By using our platform, you agree to the terms outlined in this Privacy Policy.</p>
            </div>
          </div>

          <div data-reveal id="terms" className="bg-card border border-line rounded-[32px] p-8 md:p-11 scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-mint flex items-center justify-center text-accent">
                <ScrollText className="w-6 h-6" />
              </div>
              <h2 className="sw-title m-0 text-[1.7rem] text-ink">Terms of Use</h2>
            </div>
            <p className="text-ink-2 mb-6">By accessing our website and e-learning platform, you agree to comply with the following terms of use:</p>
            <ul className="space-y-3 list-none pl-0">
              <ListItem>Use the platform solely for lawful, educational purposes.</ListItem>
              <ListItem>Do not distribute course content without written permission.</ListItem>
              <ListItem>Respect your fellow learners and contribute positively to forums.</ListItem>
              <ListItem>You are responsible for protecting your login credentials.</ListItem>
              <ListItem>A breach of these terms may result in restricted access or removal.</ListItem>
            </ul>
          </div>

          <div data-reveal id="safeguarding" className="bg-card border border-line rounded-[32px] p-8 md:p-11 scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-mint flex items-center justify-center text-accent">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h2 className="sw-title m-0 text-[1.7rem] text-ink">Safeguarding Statement</h2>
            </div>
            <p className="text-ink-2 mb-6 leading-relaxed">
              Social Work Consultancy Ltd is dedicated to safeguarding and promoting the welfare of all learners and beneficiaries of our training and consultancy services. We acknowledge our responsibility to prevent abuse, uphold the rights of children and vulnerable adults, and foster safe, inclusive learning environments.
            </p>
            <p className="text-ink font-semibold mb-4">Our safeguarding practices include:</p>
            <ul className="space-y-3 list-none pl-0">
              <ListItem>Adhering to national child protection laws and international standards.</ListItem>
              <ListItem>Requiring all staff, instructors, and partners to undergo safeguarding induction.</ListItem>
              <ListItem>Providing clear reporting channels for concerns or disclosures.</ListItem>
              <ListItem>Regularly reviewing and updating safeguarding policies and protocols.</ListItem>
            </ul>
          </div>

          <div data-reveal id="contact" className="bg-forest rounded-[32px] p-8 md:p-11 scroll-mt-32 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-gold-light">
                  <Mail className="w-6 h-6" />
                </div>
                <h2 className="sw-title m-0 text-[1.7rem] text-white">Contact Us</h2>
              </div>
              <p className="text-white/80 leading-relaxed mb-6">
                For inquiries regarding privacy, data usage, or protection, please reach out to our support team. We take your data seriously and will respond promptly.
              </p>
              <a href="mailto:support@socialworknigeria.org" className="inline-flex items-center gap-2 bg-gold text-[#10231a] px-6 py-3.5 rounded-full font-semibold no-underline hover:bg-gold-light transition-colors">
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
    <li className="flex items-start gap-3 text-ink-2 leading-relaxed">
      <span className="w-1.5 h-1.5 rounded-full bg-clay mt-2.5 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}
