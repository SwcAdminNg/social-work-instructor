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
import PageHero from "@/components/site/PageHero";
import { Btn, Contours, Eyebrow, Heading, Photo, SectionHead, type Vars } from "@/components/site/ui";
import FieldsList, { type Field } from "@/components/home/FieldsList";
import { ClosingCall } from "@/components/home/Home";
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

const FIELD_PHOTOS = [
  { photo: photos.communityTalk },
  { photo: photos.deskConversation },
  { photo: photos.zariaSerene },
  { photo: photos.ijebuGathering },
  { photo: photos.elderSeated },
  { photo: photos.openHands },
  { photo: photos.redRoad },
  { photo: photos.clayHouse },
];

const FIELDS: Field[] = practiceSettings.map((setting, index) => ({
  ...setting,
  image: { src: FIELD_PHOTOS[index].photo.src, alt: FIELD_PHOTOS[index].photo.alt },
}));

export default function WhyTeach() {
  return (
    <div>
      <PageHero
        id="why-heading"
        eyebrow="Why teach with us"
        title="Your experience can *change* someone’s practice"
        lead="Social workers across Nigeria are asking for learning that reflects their reality. You already have it. We give you the tools, the reviewers and the learners."
        photo={photos.lectureMic}
        position="40% 35%"
      >
        <Btn href="/register" variant="gold">Apply to Teach</Btn>
        <Btn href="/how-it-works" variant="ghost">How It Works</Btn>
      </PageHero>

      {/* ── Reasons ── */}
      <section aria-labelledby="reasons-heading" className="sw-sheet bg-paper pb-28 pt-20 md:pb-40 md:pt-28">
        <div className="sw-wrap">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <SectionHead id="reasons-heading" eyebrow="What you get" title="Six reasons instructors *join*" />
            <p data-reveal className="sw-lead m-0 max-w-sm text-ink-2">
              Whether you lecture full time or teach alongside a caseload, the platform is built around your time.
            </p>
          </div>
          <ul className="m-0 mt-12 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3 md:mt-16">
            {REASONS.map(({ icon: Icon, title, text }, index) => (
              <li
                key={title}
                data-reveal
                style={{ "--d": `${(index % 3) * 0.08}s` } as Vars}
                className="sw-card-hover flex flex-col rounded-[28px] border border-line bg-card p-7 md:p-8"
              >
                <div className="flex items-start justify-between">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-mint text-accent">
                    <Icon size={26} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="sw-em text-3xl text-clay-ink" aria-hidden="true">0{index + 1}</span>
                </div>
                <h3 className="sw-title m-0 mt-8 text-[1.4rem] text-ink">{title}</h3>
                <p className="m-0 mt-3 text-[0.98rem] leading-relaxed text-ink-2">{text}</p>
              </li>
            ))}
          </ul>

          <div className="mt-16 grid gap-5 md:mt-24 md:grid-cols-[1.4fr_1fr] md:gap-6">
            <div data-reveal="clip">
              <Photo frame={1.33}
                photo={photos.laptopSmile}
                sizes="(min-width: 768px) 56vw, 92vw"
                position="50% 30%"
                className="aspect-[4/3] w-full rounded-[32px] md:aspect-auto md:h-full md:min-h-[460px] md:rounded-[44px]"
              />
            </div>
            <div data-reveal="clip" style={{ "--d": "0.12s" } as Vars}>
              <Photo frame={0.8}
                photo={photos.tabletHijab}
                sizes="(min-width: 768px) 38vw, 92vw"
                position="50% 30%"
                className="aspect-[4/5] w-full rounded-[32px] md:rounded-[44px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Statement ── */}
      <section
        aria-labelledby="statement-heading"
        data-progress="view"
        className="sw-sheet sw-on-dark sw-grain overflow-hidden bg-forest pb-28 pt-20 md:pb-40 md:pt-32"
      >
        <Contours className="text-leaf" />
        <div className="sw-wrap relative grid gap-x-14 gap-y-10 lg:grid-cols-[0.36fr_1fr]">
          <div data-reveal>
            <Eyebrow className="text-gold-light">The profession is growing</Eyebrow>
            <p className="m-0 mt-5 max-w-xs text-[0.98rem] leading-relaxed text-white/65">
              Nigeria now has a law to regulate professional social work, including the quality of training. Good
              courses help the profession meet that standard.
            </p>
          </div>
          <Heading
            id="statement-heading"
            scrub
            accent="text-gold-light"
            text="Every practitioner who learns to assess risk more carefully, listen more closely or challenge an injustice more confidently *carries that into hundreds of conversations.* Teaching one course is how you multiply your practice."
            className="sw-display m-0 text-[clamp(1.6rem,3.3vw,2.9rem)] leading-[1.1] text-[#fffdf4]"
          />
        </div>

        <div className="sw-wrap relative mt-20 grid gap-x-12 gap-y-10 md:mt-28 lg:grid-cols-[0.42fr_1fr]">
          <div data-reveal className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow className="text-gold-light">Law and policy</Eyebrow>
            <h2 className="sw-display m-0 mt-5 text-[clamp(1.8rem,3vw,2.6rem)] text-[#fffdf4]">
              Frameworks your learners need to <em className="sw-em text-gold-light">know</em>
            </h2>
            <p className="m-0 mt-4 max-w-sm text-[0.98rem] leading-relaxed text-white/65">
              If you can explain how these work in day-to-day practice, there is a course in it.
            </p>
          </div>
          <ol className="m-0 list-none border-t border-white/12 p-0">
            {frameworks.map((item, index) => (
              <li
                key={item.name}
                data-reveal
                style={{ "--d": `${Math.min(index, 4) * 0.06}s` } as Vars}
                className="grid gap-x-8 gap-y-2 border-b border-white/12 py-7 md:grid-cols-[6.5rem_1fr]"
              >
                <span className="sw-em text-[2.6rem] leading-none text-gold-light md:text-[3rem]">{item.year}</span>
                <div>
                  <h3 className="sw-title m-0 text-xl text-[#fffdf4] md:text-[1.4rem]">{item.name}</h3>
                  <p className="m-0 mt-2 max-w-2xl text-[0.98rem] leading-relaxed text-white/70">{item.text}</p>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sw-cap mt-3 inline-flex items-center gap-1.5 text-white/45 no-underline transition-colors hover:text-gold-light"
                  >
                    Source: {item.source}
                    <ExternalLink size={11} aria-hidden="true" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="sw-wrap sw-cap relative m-0 mt-8 text-white/40">Dates checked against the linked sources, {contextCheckedOn}.</p>
      </section>

      {/* ── Fields ── */}
      <section aria-labelledby="fields-heading" className="sw-sheet bg-paper-2 pb-28 pt-20 md:pb-40 md:pt-28">
        <div className="sw-wrap">
          <SectionHead
            id="fields-heading"
            eyebrow="What you could teach"
            title="Courses from every *field* of practice"
            lead="We welcome instructors from across the profession. If you work in one of these settings, learners want to hear from you."
          />
          <div className="mt-12 md:mt-16">
            <FieldsList fields={FIELDS} />
          </div>
        </div>
      </section>

      {/* ── Principles ── */}
      <section
        aria-labelledby="principles-heading"
        data-progress="view"
        className="sw-sheet sw-grain relative overflow-hidden bg-[#b94a28] pb-28 pt-20 text-white md:pb-40 md:pt-28"
      >
        <Contours className="text-white" />
        <div className="sw-wrap relative grid gap-x-14 gap-y-12 lg:grid-cols-[0.8fr_1fr]">
          <div>
            <div data-reveal>
              <Eyebrow className="text-white [--dot:var(--sw-gold-light)]">What makes a strong course</Eyebrow>
            </div>
            <Heading
              id="principles-heading"
              text="Four habits of *good* teaching"
              accent="text-gold-light"
              className="sw-display m-0 mt-5 text-[clamp(2.1rem,4.6vw,3.9rem)]"
            />
            <div data-reveal="scale" className="relative mt-10 w-full max-w-[360px]">
              <Photo frame={0.8}
                photo={photos.speakerMic}
                sizes="(min-width: 1024px) 28vw, 80vw"
                position="50% 30%"
                className="aspect-[4/5] w-full rounded-t-[999px] rounded-b-[36px]"
              />
            </div>
          </div>
          <ul className="m-0 list-none self-center border-t border-white/25 p-0">
            {PRINCIPLES.map(({ icon: Icon, title, text }, index) => (
              <li key={title} data-reveal style={{ "--d": `${index * 0.08}s` } as Vars} className="flex gap-5 border-b border-white/25 py-8">
                <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-white/15 text-gold-light">
                  <Icon size={26} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="sw-title m-0 text-[1.45rem]">{title}</h3>
                  <p className="m-0 mt-2 max-w-md text-[1rem] leading-relaxed text-white/85">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ClosingCall
        id="why-closing-heading"
        eyebrow="Ready when you are"
        title="Bring your practice to the *platform.*"
        lead="Tell us about yourself and attach your CV. We will read it and reply by email with the next step."
        photo={photos.practitioner}
        position="62% 35%"
        secondary={{ href: "/how-it-works", label: "See How It Works" }}
      />
    </div>
  );
}
