import {
  BadgeCheck,
  Bell,
  CalendarClock,
  ClipboardList,
  Eye,
  FileText,
  FileUp,
  Fingerprint,
  GripVertical,
  HeartPulse,
  KeyRound,
  Link2,
  ListChecks,
  Mail,
  MessageSquareText,
  NotebookPen,
  Package,
  PenLine,
  Radio,
  Send,
  UserRoundCog,
  Video,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Button, CtaBand, Eyebrow, IconTile, PageHero, SectionIntro } from "@/components/swcl/ui";
import { photos } from "@/lib/photos";

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

const STUDIO: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: GripVertical,
    title: "Arrange modules and lessons",
    text: "Drag sections and items into the order that tells the story best. Mark lessons as free previews so people can try before they enrol.",
  },
  {
    icon: ClipboardList,
    title: "Build assessments",
    text: "Write quizzes by hand or ask AI to draft questions from your material, then edit every one. Set a pass mark and group quizzes together.",
  },
  {
    icon: HeartPulse,
    title: "Check the course health",
    text: "A health panel points out what is missing, such as a lesson without content, before a reviewer has to.",
  },
  {
    icon: Eye,
    title: "Preview as a learner",
    text: "Open any lesson exactly as a learner will see it, on a large screen or a phone.",
  },
];

const BLOCKS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Video, title: "Video lessons", text: "Upload recorded teaching; it streams to learners on any connection." },
  { icon: FileText, title: "Documents", text: "Share readings, case files, templates and handouts." },
  { icon: Package, title: "Interactive packages", text: "Bring in SCORM packages you have already built elsewhere." },
  { icon: Link2, title: "Links", text: "Point learners to legislation, reports and trusted reading online." },
  { icon: Radio, title: "Live sessions", text: "Schedule sessions to talk through real practice questions together." },
  { icon: ListChecks, title: "Quizzes", text: "Check understanding, with AI help to draft questions when you want it." },
  { icon: PenLine, title: "Essays", text: "Set written reflections and mark them with feedback in the studio." },
  { icon: NotebookPen, title: "Quiz groups", text: "Combine quizzes into a single, longer assessment." },
];

const REVIEW = [
  { title: "Academic review", text: "Is the content accurate, current and right for the stated level?" },
  { title: "Quality review", text: "Is it clear, accessible and complete, with nothing broken or missing?" },
  { title: "Course-lead review", text: "Does it fit the catalogue and is it ready for learners?" },
  { title: "Published", text: "It goes live as version 1.0. Updates you make later come back through review as a new version." },
];

const TEACHING: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: PenLine, title: "Mark essays", text: "Read submitted essays, give a mark and written feedback, and see what is waiting at a glance." },
  { icon: CalendarClock, title: "Run live sessions", text: "Schedule sessions inside your course so learners can join you at a set time." },
  { icon: MessageSquareText, title: "Talk with colleagues", text: "Community rooms for instructors, with replies, attachments and who is online." },
  { icon: Bell, title: "Stay in the loop", text: "Notifications tell you when a review decision lands or new work needs marking." },
];

const pad = (n: number) => String(n).padStart(2, "0");

export default function HowItWorks() {
  return (
    <>
      <PageHero
        id="how-heading"
        eyebrow="How it works"
        title="From your first idea to a published course"
        lead="Everything an instructor does on the platform, in order: joining, building in the studio, review and teaching."
        image={photos.coursePlanning}
        position="45% 30%"
      >
        <Button href="/register">Express Interest</Button>
        <Button href="#studio" variant="outline-light">
          Tour the Studio
        </Button>
      </PageHero>

      {/* Part one: joining */}
      <section id="joining" aria-labelledby="joining-heading" className="swc-section bg-swc-white">
        <div className="swc-wrap grid items-start gap-10 min-[1001px]:grid-cols-[0.85fr_1.15fr] min-[1001px]:gap-16">
          <div className="min-[1001px]:sticky min-[1001px]:top-28">
            <SectionIntro
              id="joining-heading"
              eyebrow="Part one"
              title="Joining as an instructor"
              intro="Applying takes a few minutes. Everything after that happens by email and inside your account."
            />
          </div>
          <ol className="m-0 flex list-none flex-col gap-4 p-0">
            {JOINING.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="swc-card flex items-start gap-5 p-6">
                <IconTile className="flex-none">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </IconTile>
                <div>
                  <p className="m-0 text-[0.8rem] font-bold uppercase tracking-[0.12em] text-swc-label">Step {i + 1}</p>
                  <h3 className="swc-h4 mt-1">{title}</h3>
                  <p className="m-0 mt-2 text-[0.92rem] text-swc-ink-2">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Part two: the studio */}
      <section id="studio" aria-labelledby="studio-heading" className="swc-section bg-swc-paper">
        <div className="swc-wrap">
          <SectionIntro
            id="studio-heading"
            eyebrow="Part two"
            title="Building in the studio"
            intro="A new course starts with four short steps. Then you add the content, in the editor, at your own pace. Nothing is visible to learners while you work."
          />

          <ol aria-label="Creating a course" className="m-0 mt-12 grid list-none gap-5 p-0 min-[701px]:grid-cols-2 min-[1001px]:grid-cols-4">
            {WIZARD.map((step, i) => (
              <li key={step.title} className="swc-card p-6">
                <span className="swc-num">{pad(i + 1)}</span>
                <h3 className="swc-h4 mt-5">{step.title}</h3>
                <p className="m-0 mt-2 text-[0.92rem] text-swc-ink-2">{step.text}</p>
              </li>
            ))}
          </ol>

          <ul aria-label="Studio tools" className="m-0 mt-6 grid list-none gap-5 p-0 min-[701px]:grid-cols-2">
            {STUDIO.map(({ icon: Icon, title, text }) => (
              <li key={title} className="swc-card swc-card--accent flex items-start gap-5 p-7">
                <IconTile className="flex-none">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </IconTile>
                <div>
                  <h3 className="swc-h4">{title}</h3>
                  <p className="m-0 mt-2 text-[0.95rem] text-swc-ink-2">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Lesson and assessment types */}
      <section id="lesson-types" aria-labelledby="blocks-heading" className="swc-section bg-swc-white">
        <div className="swc-wrap">
          <SectionIntro
            id="blocks-heading"
            align="center"
            eyebrow="In the editor"
            title="Lesson and assessment types"
          />
          <ul className="m-0 mt-12 grid list-none gap-5 p-0 min-[701px]:grid-cols-2 min-[1001px]:grid-cols-4">
            {BLOCKS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="swc-card p-6">
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

      {/* Part three: review */}
      <section id="review" aria-labelledby="review-heading" className="swc-section bg-swc-mint">
        <div className="swc-wrap grid items-start gap-10 min-[1001px]:grid-cols-[0.9fr_1.1fr] min-[1001px]:gap-14">
          <div>
            <SectionIntro
              id="review-heading"
              eyebrow="Part three"
              title="Review, then publish"
              intro="When your course is ready, say what is in it and submit it. Reviewers work through it stage by stage."
            />
            <p className="m-0 mt-8 flex max-w-[560px] items-start gap-3 text-[0.95rem] text-swc-ink-2">
              <Send className="mt-1 h-4 w-4 flex-none text-swc-label" aria-hidden="true" />
              If a reviewer asks for changes, their comments sit beside the lesson they refer to, and you can see exactly
              what changed between versions before you resubmit.
            </p>
          </div>
          <div className="swc-dark rounded-lg bg-swc-deep p-8 text-white md:p-10">
            <Eyebrow>Review stages</Eyebrow>
            <ol className="m-0 mt-6 flex list-none flex-col p-0">
              {REVIEW.map((stage, i) => (
                <li key={stage.title} className="flex items-start gap-4 border-b border-white/15 py-4 last:border-b-0">
                  <span className="swc-num swc-num--round flex-none">
                    {i === REVIEW.length - 1 ? <BadgeCheck className="h-4 w-4" aria-hidden="true" /> : i + 1}
                  </span>
                  <div>
                    <h3 className="swc-h4 text-white">{stage.title}</h3>
                    <p className="m-0 mt-1 text-[0.92rem] text-white/80">{stage.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Part four: teaching */}
      <section id="teaching" aria-labelledby="teaching-heading" className="swc-section bg-swc-paper">
        <div className="swc-wrap grid items-start gap-10 min-[1001px]:grid-cols-[0.9fr_1.1fr] min-[1001px]:gap-14">
          <div>
            <SectionIntro id="teaching-heading" eyebrow="Part four" title="Teaching once you are live" />
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Button href="/register">Express Interest</Button>
              <Link href="/faq" className="font-semibold text-swc-label underline underline-offset-4">
                Questions? Read the FAQ
              </Link>
            </div>
          </div>
          <ul className="m-0 grid list-none gap-5 p-0 min-[701px]:grid-cols-2">
            {TEACHING.map(({ icon: Icon, title, text }) => (
              <li key={title} className="swc-card p-6">
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
        id="how-closing-heading"
        title="The first step takes five minutes."
        body="Send your details and CV today. We will be in touch by email."
        primary={{ href: "/register", label: "Express Interest" }}
        secondary={{ href: "/contact", label: "Contact Us" }}
      />
    </>
  );
}
