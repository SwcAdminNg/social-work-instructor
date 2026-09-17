"use client";

import { MentorshipHero } from "./MentorshipHero";
import { MentorshipOfferings } from "./MentorshipOfferings";
import { MentorshipProcess } from "./MentorshipProcess";
import { MentorshipForm } from "./MentorshipForm";

export default function Mentorship() {
  return (
    <div className="w-full bg-white dark:bg-gray-950">
      <MentorshipHero />
      <MentorshipOfferings />
      <MentorshipProcess />
      <MentorshipForm />
    </div>
  );
}
