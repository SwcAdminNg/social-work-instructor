"use client";

import { UserCheck, Shield, BookOpen, Scale, CreditCard, Activity, XOctagon } from "lucide-react";

export function TermsContent() {
  const sections = [
    { id: "eligibility", title: "5.1 Eligibility", icon: <UserCheck className="w-5 h-5" /> },
    { id: "account", title: "5.2 Account Responsibilities", icon: <Shield className="w-5 h-5" /> },
    { id: "acceptable", title: "5.3 Acceptable Use", icon: <BookOpen className="w-5 h-5" /> },
    { id: "intellectual", title: "5.4 Intellectual Property", icon: <Scale className="w-5 h-5" /> },
    { id: "payment", title: "5.5 Payment and Refund Policy", icon: <CreditCard className="w-5 h-5" /> },
    { id: "platform", title: "5.6 Platform Availability", icon: <Activity className="w-5 h-5" /> },
    { id: "termination", title: "5.7 Termination of Access", icon: <XOctagon className="w-5 h-5" /> },
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
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-sm leading-relaxed text-gray-700 dark:text-gray-300 font-medium">
            <p className="text-lg text-gray-900 dark:text-white font-semibold">
              The following Terms of Service apply to all registered users of the SWCL LMS platform. By creating an account and accessing the platform, users agree to be bound by these terms in full.
            </p>
          </div>

          <div id="eligibility" className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-sm scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20 flex items-center justify-center text-[#2D6A4F] dark:text-[#52b788]">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">5.1 Eligibility</h2>
            </div>
            <ul className="space-y-3 list-none pl-0">
              <ListItem>The platform is open to individuals aged 18 and above.</ListItem>
              <ListItem>Students must be enrolled in a paid (or code-accessed) course and have a confirmed account before accessing content.</ListItem>
              <ListItem>Lecturers must be formally engaged by SWCL and hold a signed Lecturer Agreement and NDA before accessing the platform.</ListItem>
              <ListItem>SWCL reserves the right to refuse or revoke access to any user found to be in breach of these terms.</ListItem>
            </ul>
          </div>

          <div id="account" className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-sm scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">5.2 Account Responsibilities</h2>
            </div>
            <ul className="space-y-3 list-none pl-0">
              <ListItem>Each user is responsible for maintaining the confidentiality of their login credentials.</ListItem>
              <ListItem>Accounts must not be shared with or transferred to any other individual.</ListItem>
              <ListItem>Users must change their password on first login and update it at regular intervals per the platform’s security settings (30–120 days).</ListItem>
              <ListItem>Users must notify SWCL immediately if they suspect unauthorised access to their account.</ListItem>
              <ListItem>Users must ensure that all information provided during registration is accurate and up to date.</ListItem>
            </ul>
          </div>

          <div id="acceptable" className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-sm scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">5.3 Acceptable Use</h2>
            </div>
            <ul className="space-y-3 list-none pl-0">
              <ListItem>Users must engage with the platform in a respectful, professional, and ethical manner at all times.</ListItem>
              <ListItem>Course content is for personal and professional development only. It must not be reproduced, distributed, or sold without prior written consent from SWCL.</ListItem>
              <ListItem>Users must not attempt to access areas of the platform beyond their assigned access level.</ListItem>
              <ListItem>Any form of harassment, discrimination, or abusive behaviour will result in immediate account suspension.</ListItem>
            </ul>
          </div>

          <div id="intellectual" className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-sm scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Scale className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">5.4 Intellectual Property</h2>
            </div>
            <ul className="space-y-3 list-none pl-0">
              <ListItem>All course materials and content hosted on the SWCL platform are the intellectual property of Social Work Consultancy Ltd, unless otherwise stated in the Lecturer Agreement.</ListItem>
              <ListItem><strong className="text-gray-900 dark:text-white">Content Ownership:</strong> Course materials developed by lecturers for SWCL may either remain the intellectual property of SWCL or be licensed for use by SWCL, depending on the terms agreed in the Lecturer Agreement before course delivery. This must be clearly defined in writing before any course commences.</ListItem>
              <ListItem>Students may download and retain materials for personal reference only and must not share or republish them.</ListItem>
            </ul>
          </div>

          <div id="payment" className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-sm scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">5.5 Payment and Refund Policy</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-6">
              Course fees are non-refundable once access to course content has been granted, except as set out in the SWCL Refund Policy.
            </p>
            <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl p-6 mb-6 border border-gray-100 dark:border-gray-800">
              <ul className="space-y-4 list-none pl-0">
                <ListItem><strong className="text-gray-900 dark:text-white">Full refund:</strong> within 24 hours of payment if no content has been accessed.</ListItem>
                <ListItem><strong className="text-gray-900 dark:text-white">Partial refund (50%):</strong> within 7 working days of payment if less than 25% of course content has been accessed, subject to LMS Administrator review.</ListItem>
                <ListItem><strong className="text-gray-900 dark:text-white">No refund:</strong> after 7 working days, or where 25% or more of content has been accessed, unless SWCL has experienced a proven technical failure.</ListItem>
              </ul>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300 font-medium text-sm leading-relaxed">
              <p>
                <strong className="text-gray-900 dark:text-white">Definition of Technical Failure:</strong> A technical failure is a platform outage, payment error, or system fault caused by SWCL’s infrastructure that prevented the student from accessing content they had paid for. Must be verified by the IT Administrator before a refund is approved on these grounds.
              </p>
              <p>
                Refund requests must be submitted in writing using the SWCL Refund Request Form, available at <a href="https://socialworknigeria.org" className="text-[#2D6A4F] dark:text-[#52b788] hover:underline" target="_blank" rel="noopener noreferrer">socialworknigeria.org</a>.
              </p>
              <p>A Dispute Form is also available for cases where a student wishes to formally challenge a refund decision.</p>
              <p>SWCL reserves the right to modify course fees. Enrolled students will not be affected by price changes mid-course.</p>
            </div>
          </div>

          <div id="platform" className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-sm scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Activity className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">5.6 Platform Availability</h2>
            </div>
            <ul className="space-y-3 list-none pl-0">
              <ListItem>SWCL will endeavour to maintain platform availability at all times but cannot guarantee uninterrupted access due to scheduled maintenance or technical issues.</ListItem>
              <ListItem>Users will be notified in advance of planned maintenance and will receive proactive status updates during any unplanned downtime.</ListItem>
            </ul>
          </div>

          <div id="termination" className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-10 shadow-sm scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <XOctagon className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">5.7 Termination of Access</h2>
            </div>
            <ul className="space-y-3 list-none pl-0">
              <ListItem>SWCL may suspend or terminate a user’s account without prior notice if the user is found to be in breach of these Terms of Service.</ListItem>
              <ListItem>Upon termination, the user will lose access to all course content and progress records.</ListItem>
              <ListItem>Users may request account deletion at any time by contacting the SWCL administration team.</ListItem>
            </ul>
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
