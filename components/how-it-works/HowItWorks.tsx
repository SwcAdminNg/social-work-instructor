import {
  Bell,
  BookOpenCheck,
  CalendarClock,
  ClipboardList,
  Eye,
  FileUp,
  Fingerprint,
  GripVertical,
  HeartPulse,
  KeyRound,
  Mail,
  MessageSquareText,
  PenLine,
  Send,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react";
import PageHero from "@/components/site/PageHero";
import { Btn, Contours, Eyebrow, Photo, SectionHead, TextLink, cx, type Vars } from "@/components/site/ui";
import { BLOCKS, ClosingCall } from "@/components/home/Home";
import { photos, type Photo as PhotoData } from "@/lib/photos";

const JOINING: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: FileUp,
    title: "Send your application",
    text: "Your name, email, phone number and CV (PDF, DOC or DOCX). There is no fee to apply.",
  },
  {
    icon: Mail,
    title: "We review it",
    text: "Our team reads your application and replies by email with the next step.",
  },
  {
    icon: KeyRound,
    title: "Finish setting up",
    text: "If you are approved, the email includes a secure link to set up your instructor account.",
  },
  {
    icon: Fingerprint,
    title: "Secure your sign-in",
    text: "Two-factor sign-in by email or an authenticator app keeps your courses safe. You can add fingerprint or face sign-in too.",
  },
  {
    icon: UserRoundCog,
    title: "Complete your profile",
    text: "Add a photo and your details, and keep your professional documents in one place.",
  },
];

const WIZARD = [
  { title: "The basics", text: "Title, summary, category and the level it is for: new to the topic, some practice experience, or experienced practitioners." },
  { title: "Learning design", text: "What learners will be able to do, what they need beforehand and what is included." },
  { title: "Pricing and access", text: "Free or paid, self-paced or open between set dates, and whether it awards a certificate." },
  { title: "Review and create", text: "Check everything, create the course, then add your first module and lessons." },
];

const STUDIO: { icon: LucideIcon; title: string; text: string; photo: PhotoData; position?: string }[] = [
  {
    icon: GripVertical,
    title: "Arrange modules and lessons",
    text: "Drag sections and items into the order that tells the story best. Mark lessons as free previews so people can try before they enrol.",
    photo: photos.coursePlanning,
    position: "45% 30%",
  },
  {
    icon: ClipboardList,
    title: "Build assessments",
    text: "Write quizzes by hand or ask AI to draft questions from your material, then edit every one. Set a pass mark and group quizzes together.",
    photo: photos.whiteboardLaptop,
    position: "70% 40%",
  },
  {
    icon: HeartPulse,
    title: "Check the course health",
    text: "A health panel points out what is missing, such as a lesson without content, before a reviewer has to.",
    photo: photos.tabletHijab,
    position: "50% 30%",
  },
  {
    icon: Eye,
    title: "Preview as a learner",
    text: "Open any lesson exactly as a learner will see it, on a large screen or a phone.",
    photo: photos.laptopSmile,
    position: "50% 30%",
  },
];

const TEACHING: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: PenLine, title: "Mark essays", text: "Read submitted essays, give a mark and written feedback, and see what is waiting at a glance." },
  { icon: CalendarClock, title: "Run live sessions", text: "Schedule sessions inside your course so learners can join you at a set time." },
  { icon: MessageSquareText, title: "Talk with colleagues", text: "Community rooms for instructors, with replies, attachments and who is online." },
  { icon: Bell, title: "Stay in the loop", text: "Notifications tell you when a review decision lands or new work needs marking." },
];

export default function HowItWorks() {
  return (
    <div>
      <PageHero
        id="how-heading"
        eyebrow="How it works"
        title="From your first idea to a *published* course"
        lead="Everything an instructor does on the platform, in order: joining, building in the studio, review and teaching."
        photo={photos.coursePlanning}
        position="45% 30%"
      >
        <Btn href="/register" variant="gold">Apply to Teach</Btn>
        <Btn href="#studio" variant="ghost">Tour the Studio</Btn>
      </PageHero>

      {/* ── Joining ── */}
      <section aria-labelledby="joining-heading" className="sw-sheet bg-paper pb-28 pt-20 md:pb-40 md:pt-28">
        <div className="sw-wrap grid gap-x-14 gap-y-12 lg:grid-cols-[0.85fr_1fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHead
              id="joining-heading"
              eyebrow="Part one"
              title="Joining as an *instructor*"
              lead="Applying takes a few minutes. Everything after that happens by email and inside your account."
            />
            <div data-reveal="clip" className="mt-10">
              <Photo frame={1.33} photo={photos.writingNotes} sizes="(min-width: 1024px) 40vw, 92vw" position="50% 40%" className="aspect-[4/3] w-full rounded-[32px] md:rounded-[40px]" />
            </div>
          </div>
          <ol className="relative m-0 list-none p-0">
            <span aria-hidden="true" className="absolute bottom-10 left-7 top-10 w-px bg-line" />
            {JOINING.map(({ icon: Icon, title, text }, index) => (
              <li key={title} data-reveal style={{ "--d": `${index * 0.06}s` } as Vars} className="relative flex gap-6 pb-10 last:pb-0">
                <span className="relative z-10 grid h-14 w-14 flex-none place-items-center rounded-full border border-line bg-card text-accent shadow-[0_10px_30px_-18px_rgba(14,31,23,0.5)]">
                  <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div className="pt-1.5">
                  <p className="sw-cap m-0 text-clay-ink">Step {index + 1}</p>
                  <h3 className="sw-title m-0 mt-1.5 text-[1.5rem] text-ink">{title}</h3>
                  <p className="m-0 mt-2 max-w-md text-[1rem] leading-relaxed text-ink-2">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Studio ── */}
      <section id="studio" aria-labelledby="studio-heading" className="sw-sheet scroll-mt-20 bg-paper-2 pb-28 pt-20 md:pb-40 md:pt-28">
        <div className="sw-wrap">
          <SectionHead
            id="studio-heading"
            eyebrow="Part two"
            title="Building in the *studio*"
            lead="A new course starts with four short steps. Then you add the content, in the editor, at your own pace. Nothing is visible to learners while you work."
          />

          <ol className="m-0 mt-12 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4 md:mt-16">
            {WIZARD.map((step, index) => (
              <li
                key={step.title}
                data-reveal
                style={{ "--d": `${index * 0.08}s` } as Vars}
                className={cx(
                  "flex flex-col rounded-[28px] p-7",
                  index === 3 ? "sw-on-dark bg-deep" : "border border-line bg-card",
                )}
              >
                <span className={cx("sw-em text-[3rem] leading-none", index === 3 ? "text-gold-light" : "text-clay-ink")} aria-hidden="true">
                  0{index + 1}
                </span>
                <h3 className={cx("sw-title m-0 mt-6 text-[1.3rem]", index === 3 ? "text-[#fffdf4]" : "text-ink")}>{step.title}</h3>
                <p className={cx("m-0 mt-2 text-[0.96rem] leading-relaxed", index === 3 ? "text-white/75" : "text-ink-2")}>{step.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-20 flex flex-col gap-16 md:mt-28 md:gap-24">
            {STUDIO.map(({ icon: Icon, title, text, photo, position }, index) => (
              <div key={title} className="grid items-center gap-x-14 gap-y-8 lg:grid-cols-2">
                <div data-reveal="clip" className={index % 2 === 1 ? "lg:order-2" : undefined}>
                  <Photo frame={1.25}
                    photo={photo}
                    sizes="(min-width: 1024px) 46vw, 92vw"
                    position={position}
                    className="aspect-[5/4] w-full rounded-[32px] md:rounded-[44px]"
                  />
                </div>
                <div data-reveal>
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gold text-[#10231a]">
                    <Icon size={26} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <h3 className="sw-display m-0 mt-7 text-[clamp(1.9rem,3.4vw,2.9rem)] text-ink">{title}</h3>
                  <p className="sw-lead m-0 mt-4 max-w-lg text-ink-2">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 md:mt-28">
            <div data-reveal>
              <Eyebrow className="text-accent">Lesson and assessment types</Eyebrow>
            </div>
            <ul className="m-0 mt-8 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {BLOCKS.map(({ icon: Icon, title, text }, index) => (
                <li
                  key={title}
                  data-reveal
                  style={{ "--d": `${(index % 4) * 0.06}s` } as Vars}
                  className="sw-card-hover flex flex-col rounded-[24px] border border-line bg-card p-6"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mint text-accent">
                    <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <h4 className="sw-title m-0 mt-4 text-[1.15rem] text-ink">{title}</h4>
                  <p className="m-0 mt-1.5 text-[0.94rem] leading-relaxed text-ink-2">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Review ── */}
      <section
        aria-labelledby="review-heading"
        data-progress="view"
        className="sw-sheet sw-on-dark sw-grain overflow-hidden bg-forest pb-28 pt-20 md:pb-40 md:pt-32"
      >
        <Contours className="text-leaf" />
        <div className="sw-wrap relative grid items-center gap-x-14 gap-y-12 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <SectionHead
              id="review-heading"
              onDark
              eyebrow="Part three"
              title="Review, then *publish*"
              lead="When your course is ready, say what is in it and submit it. Reviewers work through it stage by stage."
            />
            <ol className="m-0 mt-10 list-none border-t border-white/12 p-0">
              {[
                ["Academic review", "Is the content accurate, current and right for the stated level?"],
                ["Quality review", "Is it clear, accessible and complete, with nothing broken or missing?"],
                ["Course-lead review", "Does it fit the catalogue and is it ready for learners?"],
                ["Published", "It goes live as version 1.0. Updates you make later come back through review as a new version."],
              ].map(([title, text], index) => (
                <li key={title} data-reveal style={{ "--d": `${index * 0.06}s` } as Vars} className="grid gap-x-6 gap-y-1 border-b border-white/12 py-6 md:grid-cols-[4rem_1fr]">
                  <span className="sw-em text-[2.4rem] leading-none text-gold-light">{index + 1}</span>
                  <div>
                    <h3 className="sw-title m-0 text-[1.35rem] text-[#fffdf4]">{title}</h3>
                    <p className="m-0 mt-1.5 max-w-xl text-[0.98rem] leading-relaxed text-white/70">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p data-reveal className="m-0 mt-8 flex max-w-xl items-start gap-3 text-[0.95rem] leading-relaxed text-white/70">
              <Send size={18} className="mt-0.5 flex-none text-gold-light" aria-hidden="true" />
              If a reviewer asks for changes, their comments sit beside the lesson they refer to, and you can see exactly
              what changed between versions before you resubmit.
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-[460px]">
            <div data-reveal="clip">
              <Photo frame={0.8} photo={photos.presenting} sizes="(min-width: 1024px) 36vw, 92vw" position="62% 50%" className="aspect-[4/5] w-full rounded-[36px] md:rounded-[44px]" />
            </div>
            <span className="sw-chip absolute -left-3 top-10 bg-gold text-[#10231a] shadow-lg">
              <BookOpenCheck size={14} aria-hidden="true" />
              Approved, version 1.0
            </span>
          </div>
        </div>
      </section>

      {/* ── Teaching ── */}
      <section aria-labelledby="teaching-heading" className="sw-sheet bg-paper pb-28 pt-20 md:pb-40 md:pt-28">
        <div className="sw-wrap grid items-center gap-x-14 gap-y-12 lg:grid-cols-[0.95fr_1fr]">
          <div className="grid grid-cols-2 gap-4 md:gap-5">
            <div data-reveal="clip">
              <Photo frame={0.75} photo={photos.listening} sizes="(min-width: 1024px) 22vw, 46vw" position="55% 40%" className="aspect-[3/4] w-full rounded-[28px]" />
            </div>
            <div data-reveal="clip" style={{ "--d": "0.12s" } as Vars} className="mt-12">
              <Photo frame={0.75} photo={photos.recording} sizes="(min-width: 1024px) 22vw, 46vw" position="50% 35%" className="aspect-[3/4] w-full rounded-[28px]" />
            </div>
          </div>
          <div>
            <SectionHead id="teaching-heading" eyebrow="Part four" title="Teaching once you are *live*" />
            <ul className="m-0 mt-10 grid list-none gap-4 p-0 sm:grid-cols-2">
              {TEACHING.map(({ icon: Icon, title, text }, index) => (
                <li key={title} data-reveal style={{ "--d": `${index * 0.06}s` } as Vars} className="rounded-[24px] border border-line bg-card p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mint text-accent">
                    <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <h3 className="sw-title m-0 mt-4 text-[1.2rem] text-ink">{title}</h3>
                  <p className="m-0 mt-1.5 text-[0.95rem] leading-relaxed text-ink-2">{text}</p>
                </li>
              ))}
            </ul>
            <div data-reveal className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Btn href="/register">Apply to Teach</Btn>
              <TextLink href="/faq" className="text-ink">Questions? Read the FAQ</TextLink>
            </div>
          </div>
        </div>
      </section>

      <ClosingCall
        id="how-closing-heading"
        eyebrow="Your turn"
        title="The first step takes *five minutes.*"
        lead="Send your details and CV today. We will be in touch by email."
        photo={photos.ijebuGathering}
        position="30% 45%"
        secondary={{ href: "/why-teach", label: "Why Teach With Us" }}
      />
    </div>
  );
}
