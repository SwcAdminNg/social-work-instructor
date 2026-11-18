import {
  Compass,
  ExternalLink,
  GitBranch,
  Globe2,
  HeartHandshake,
  Layers,
  MessagesSquare,
  ShieldCheck,
  Target,
  Users,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { Button, CtaBand, Eyebrow, IconTile, PageHero, SectionIntro } from "@/components/swcl/ui";
import { photos } from "@/lib/photos";
import { contextCheckedOn, frameworks, practiceSettings } from "@/lib/nigeriaContext";

const REASONS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Globe2,
    title: "Reach people far beyond one room",
    text: "Learning on Socialworknigeria.org is online, so your course can reach practitioners in every state, and in the diaspora, without anyone travelling.",
  },
  {
    icon: Compass,
    title: "Teach from your own context",
    text: "Use the cases, places and pressures you know. Learners want teaching that sounds like the work they actually do.",
  },
  {
    icon: Wand2,
    title: "A studio that does the heavy lifting",
    text: "Video streaming, document hosting, interactive packages and help drafting quiz questions are all built in. You focus on the teaching.",
  },
  {
    icon: ShieldCheck,
    title: "Reviewers who make it better",
    text: "Academic, quality and course-lead reviewers read your course before it goes live and leave comments where they matter.",
  },
  {
    icon: MessagesSquare,
    title: "Colleagues to think with",
    text: "Community rooms connect you with other instructors for second opinions, ideas and shared resources.",
  },
  {
    icon: GitBranch,
    title: "Work that keeps improving",
    text: "Published courses carry version numbers. Update a lesson when the law or the evidence changes, and the update is reviewed too.",
  },
];

const PRINCIPLES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Target,
    title: "Start from a real situation",
    text: "Open with a decision a practitioner actually faces, then bring in the knowledge that helps them make it.",
  },
  {
    icon: Layers,
    title: "Say what learners will be able to do",
    text: "Clear outcomes help learners choose your course and help reviewers see that it delivers.",
  },
  {
    icon: HeartHandshake,
    title: "Protect the people in your examples",
    text: "Anonymise cases, change identifying details and describe people with the dignity you would want for your own family.",
  },
  {
    icon: Users,
    title: "Check understanding often",
    text: "Short quizzes and reflective essays turn reading into practice and show learners where they stand.",
  },
];

const pad = (n: number) => String(n).padStart(2, "0");

export default function WhyTeach() {
  return (
    <>
      <PageHero
        id="why-heading"
        eyebrow="Why teach with us"
        title="Your experience can change someone’s practice"
        lead="Social workers across Nigeria are asking for learning that reflects their reality. You already have it. We give you the tools, the reviewers and the learners."
        image={photos.lectureMic}
        position="40% 35%"
      >
        <Button href="/register">Express Interest</Button>
        <Button href="/how-it-works" variant="outline-light">
          How It Works
        </Button>
      </PageHero>

      {/* Reasons */}
      <section aria-labelledby="reasons-heading" className="swc-section bg-swc-white">
        <div className="swc-wrap">
          <SectionIntro
            id="reasons-heading"
            align="center"
            eyebrow="What you get"
            title="Six reasons instructors join"
            intro="Whether you lecture full time or teach alongside a caseload, the platform is built around your time."
          />
          <ul className="m-0 mt-14 grid list-none gap-6 p-0 min-[701px]:grid-cols-2 min-[1001px]:grid-cols-3">
            {REASONS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="swc-card swc-card--accent flex flex-col p-7">
                <IconTile>
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </IconTile>
                <h3 className="swc-h4 mt-6">{title}</h3>
                <p className="m-0 mt-3 text-[0.95rem] text-swc-ink-2">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Statement and frameworks */}
      <section aria-labelledby="frameworks-heading" className="swc-section bg-swc-mint">
        <div className="swc-wrap">
          <div className="swc-dark rounded-lg bg-swc-deep p-8 text-white md:p-12">
            <Eyebrow>The profession is growing</Eyebrow>
            <p className="m-0 mt-5 max-w-[920px] text-[clamp(1.25rem,2.2vw,1.75rem)] font-bold leading-snug">
              Every practitioner who learns to assess risk more carefully, listen more closely or challenge an injustice
              more confidently carries that into hundreds of conversations. Teaching one course is how you multiply your
              practice.
            </p>
            <p className="swc-lead mt-5 max-w-[680px]">
              Nigeria now has a law to regulate professional social work, including the quality of training. Good courses
              help the profession meet that standard.
            </p>
          </div>

          <div className="mt-16 grid items-start gap-10 min-[1001px]:grid-cols-[0.85fr_1.15fr] min-[1001px]:gap-16">
            <div className="min-[1001px]:sticky min-[1001px]:top-28">
              <SectionIntro
                id="frameworks-heading"
                eyebrow="Law and policy"
                title="Frameworks your learners need to know"
                intro="If you can explain how these work in day-to-day practice, there is a course in it."
              />
            </div>
            <div>
              <ol className="m-0 grid list-none gap-4 p-0">
                {frameworks.map((item) => (
                  <li key={item.name} className="swc-card grid gap-x-6 gap-y-3 p-6 min-[701px]:grid-cols-[4.5rem_1fr]">
                    <span className="swc-num self-start">{item.year}</span>
                    <div>
                      <h3 className="swc-h4">{item.name}</h3>
                      <p className="m-0 mt-2 text-[0.92rem] text-swc-ink-2">{item.text}</p>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-swc-label underline underline-offset-4"
                      >
                        Source: {item.source}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="m-0 mt-5 text-[0.82rem] text-swc-ink-3">
                Dates checked against the linked sources, {contextCheckedOn}.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fields of practice */}
      <section aria-labelledby="fields-heading" className="swc-section bg-swc-paper">
        <div className="swc-wrap">
          <SectionIntro
            id="fields-heading"
            eyebrow="What you could teach"
            title="Courses from every field of practice"
            intro="We welcome instructors from across the profession. If you work in one of these settings, learners want to hear from you."
          />
          <ul className="m-0 mt-12 grid list-none gap-5 p-0 min-[701px]:grid-cols-2 min-[1001px]:grid-cols-4">
            {practiceSettings.map((setting, i) => (
              <li key={setting.name} className="swc-card p-6">
                <span className="swc-num swc-num--soft">{pad(i + 1)}</span>
                <h3 className="swc-h4 mt-5">{setting.name}</h3>
                <p className="m-0 mt-2 text-[0.92rem] text-swc-ink-2">{setting.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Principles */}
      <section aria-labelledby="principles-heading" className="swc-section bg-swc-white">
        <div className="swc-wrap grid items-start gap-10 min-[1001px]:grid-cols-[0.9fr_1.1fr] min-[1001px]:gap-14">
          <SectionIntro
            id="principles-heading"
            eyebrow="What makes a strong course"
            title="Four habits of good teaching"
          />
          <ul className="m-0 grid list-none gap-5 p-0 min-[701px]:grid-cols-2">
            {PRINCIPLES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="swc-card p-7">
                <IconTile>
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </IconTile>
                <h3 className="swc-h4 mt-5">{title}</h3>
                <p className="m-0 mt-2 text-[0.92rem] text-swc-ink-2">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand
        id="why-closing-heading"
        title="Bring your practice to the platform."
        body="Tell us about yourself and attach your CV. We will read it and reply by email with the next step."
        primary={{ href: "/register", label: "Express Interest" }}
        secondary={{ href: "/contact", label: "Contact Us" }}
      />
    </>
  );
}
