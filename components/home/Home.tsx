import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Link2,
  ListChecks,
  MessagesSquare,
  NotebookPen,
  Package,
  PenLine,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  UsersRound,
  Video,
} from "lucide-react";
import { Btn, Contours, Eyebrow, Heading, Marquee, Photo, SectionHead, TextLink, cx, type Vars } from "@/components/site/ui";
import { photos, type Photo as PhotoData } from "@/lib/photos";
import { contextCheckedOn, contextStats } from "@/lib/nigeriaContext";

const MARQUEE = [
  "Course design",
  "Safeguarding",
  "Assessment",
  "Reflection",
  "Ethics",
  "Feedback",
  "Supervision",
  "Community",
  "Practice wisdom",
];

const WHO = ["Experienced practitioners", "Lecturers and trainers", "Supervisors and managers", "Specialists in allied fields"];

/** The lesson and assessment types the course studio supports. */
export const BLOCKS = [
  { icon: Video, title: "Video lessons", text: "Upload recorded teaching; it streams to learners on any connection." },
  { icon: FileText, title: "Documents", text: "Share readings, case files, templates and handouts." },
  { icon: Package, title: "Interactive packages", text: "Bring in SCORM packages you have already built elsewhere." },
  { icon: Link2, title: "Links", text: "Point learners to legislation, reports and trusted reading online." },
  { icon: Radio, title: "Live sessions", text: "Schedule sessions to talk through real practice questions together." },
  { icon: ListChecks, title: "Quizzes", text: "Check understanding, with AI help to draft questions when you want it." },
  { icon: PenLine, title: "Essays", text: "Set written reflections and mark them with feedback in the studio." },
  { icon: NotebookPen, title: "Quiz groups", text: "Combine quizzes into a single, longer assessment." },
];

const STEPS = [
  {
    icon: Send,
    title: "Apply",
    text: "Send your details and CV. It takes a few minutes, and our team reads every application.",
    surface: "bg-card text-ink",
    tint: "text-accent",
  },
  {
    icon: UserRoundCheck,
    title: "Set up your account",
    text: "If you are approved, we email you a secure link to choose your password and switch on two-factor sign-in.",
    surface: "bg-deep text-[#f4f1e6]",
    tint: "text-gold-light",
  },
  {
    icon: Sparkles,
    title: "Build your course",
    text: "Add sections, lessons and assessments in the studio. Everything stays private while you work.",
    surface: "bg-gold text-[#10231a]",
    tint: "text-[#10231a]",
  },
  {
    icon: BadgeCheck,
    title: "Submit, review, publish",
    text: "Send it for review when it is ready. Once approved it goes live, and later updates follow the same path.",
    surface: "bg-[#b94a28] text-white",
    tint: "text-white",
  },
];

const LOOKING_FOR = [
  "Experience of social work or allied practice in Nigeria or a comparable setting",
  "Clear, respectful teaching that connects ideas to real decisions",
  "A commitment to ethics, safeguarding and the dignity of the people you describe",
  "Willingness to work with reviewers and improve a course over time",
];

export function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 0c.9 6.5 5.5 11.1 12 12-6.5.9-11.1 5.5-12 12-.9-6.5-5.5-11.1-12-12 6.5-.9 11.1-5.5 12-12Z" />
    </svg>
  );
}

function SpinBadge() {
  return (
    <div className="relative grid h-28 w-28 place-items-center rounded-full bg-gold text-[#10231a] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] md:h-32 md:w-32">
      <svg viewBox="0 0 120 120" className="sw-spin absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <path id="sw-badge-circle" d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0" />
        </defs>
        <text fontSize="11" fontWeight="700" fill="currentColor">
          <textPath href="#sw-badge-circle" textLength="276" lengthAdjust="spacing">
            BUILD • REVIEW • TEACH • GROW •
          </textPath>
        </text>
      </svg>
      <Spark className="h-7 w-7" />
    </div>
  );
}

export default function Home() {
  return (
    <div>
      {/* ── Hero ── */}
      <section
        aria-labelledby="hero-heading"
        data-progress="view"
        className="sw-on-dark sw-grain relative -mt-[var(--nav-h)] overflow-hidden bg-forest pb-28 pt-[var(--nav-h)] md:pb-36"
      >
        <Contours className="text-leaf" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full bg-brand/40 blur-[150px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-24 h-[420px] w-[420px] rounded-full bg-clay/25 blur-[140px]" />

        <div className="sw-wrap relative grid items-center gap-x-10 gap-y-14 pt-8 md:pt-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div data-reveal>
              <Eyebrow className="text-gold-light">Instructor platform · Social Work Consultancy Ltd</Eyebrow>
            </div>
            <Heading
              as="h1"
              id="hero-heading"
              text="Teach social work *practice* to the people who need it"
              accent="text-gold-light"
              delay={0.55}
              className="sw-display m-0 mt-6 text-[clamp(2.6rem,6.2vw,5.6rem)] text-[#fffdf4]"
            />
            <p data-reveal style={{ "--d": "1s" } as Vars} className="sw-lead m-0 mt-7 max-w-[35rem] text-white/80">
              Turn what you have learned in practice into courses for social workers, students and caregivers across
              Nigeria. Build them in our studio, have them reviewed, and teach with the support of a team.
            </p>
            <div data-reveal style={{ "--d": "1.12s" } as Vars} className="mt-9 flex flex-wrap gap-3">
              <Btn href="/register" variant="gold">Apply to Teach</Btn>
              <Btn href="/how-it-works" variant="ghost">How It Works</Btn>
            </div>
            <ul
              data-reveal
              style={{ "--d": "1.25s" } as Vars}
              className="m-0 mt-10 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-sm text-white/60"
              aria-label="Who teaches with us"
            >
              {WHO.map((who) => (
                <li key={who} className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-clay-light" />
                  {who}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[480px] lg:max-w-none">
            <div data-reveal="clip" style={{ "--d": "0.65s" } as Vars} className="overflow-hidden rounded-[36px] md:rounded-[44px]">
              <Photo frame={0.8}
                photo={photos.presenting}
                priority
                sizes="(min-width: 1024px) 42vw, 92vw"
                position="64% 50%"
                className="aspect-[4/5] w-full"
              >
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-night/55 via-transparent to-transparent" />
                <span className="sw-chip absolute left-4 top-4 bg-white/90 text-[#10231a] backdrop-blur">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay opacity-70 motion-reduce:hidden" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-clay" />
                  </span>
                  Applications open
                </span>
                <span className="sw-chip absolute bottom-4 right-4 bg-night/60 text-white backdrop-blur-md">
                  <ShieldCheck size={14} className="text-gold-light" aria-hidden="true" />
                  Reviewed before it goes live
                </span>
              </Photo>
            </div>
            <div data-reveal="scale" style={{ "--d": "1.05s" } as Vars} className="absolute -bottom-10 -left-4 w-[40%] md:-left-12">
              <div className="sw-float -rotate-6 overflow-hidden rounded-[22px] border-[5px] border-forest shadow-[0_24px_50px_-18px_rgba(0,0,0,0.6)] md:rounded-[28px]">
                <Photo frame={1} photo={photos.lectureMic} parallax={false} place={false} sizes="240px" position="42% 35%" className="aspect-square w-full" />
              </div>
            </div>
            <div data-reveal="scale" style={{ "--d": "1.2s" } as Vars} className="absolute -right-3 -top-8 md:-right-8 md:-top-10">
              <SpinBadge />
            </div>
          </div>
        </div>

        <Marquee className="relative mt-24 text-white/90 md:mt-28" duration={52} gap="2.25rem">
          {MARQUEE.map((word, index) => (
            <span key={word} className="flex items-center gap-9">
              <span
                className={cx(
                  "whitespace-nowrap text-[clamp(1.9rem,4.4vw,3.6rem)] leading-none",
                  index % 3 === 1 ? "sw-em text-gold-light" : "sw-display",
                )}
              >
                {word}
              </span>
              <Spark className="h-4 w-4 text-clay-light" />
            </span>
          ))}
        </Marquee>
      </section>

      {/* ── Why instructors matter ── */}
      <section aria-labelledby="purpose-heading" className="sw-sheet bg-paper pb-28 pt-20 md:pb-40 md:pt-32">
        <div className="sw-wrap">
          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[0.34fr_1fr]">
            <div data-reveal className="lg:pt-3">
              <Eyebrow className="text-accent">Why we need you</Eyebrow>
              <p className="m-0 mt-5 max-w-xs text-[0.98rem] leading-relaxed text-ink-2">
                Socialworknigeria.org is the e-learning platform of Social Work Consultancy Ltd. Its courses are
                written by people who know practice from the inside.
              </p>
            </div>
            <Heading
              id="purpose-heading"
              scrub
              text="The best teaching in social work comes from people who have done the work. *Bring what you have learned in homes, clinics, courts and communities* and turn it into learning that others can use on Monday morning."
              className="sw-display m-0 text-[clamp(1.85rem,4.3vw,3.7rem)] leading-[1.05] text-ink"
            />
          </div>

          <div className="mt-20 grid grid-cols-2 gap-4 md:mt-28 md:grid-cols-12 md:gap-6">
            <CollagePhoto photo={photos.communityTalk} className="col-span-2 md:col-span-5" aspect="aspect-[3/2]" shift={-50} />
            <CollagePhoto photo={photos.listening} className="md:col-span-4 md:mt-28" aspect="aspect-[4/5]" shift={-130} position="55% 40%" />
            <CollagePhoto photo={photos.deskConversation} className="md:col-span-3 md:mt-10" aspect="aspect-[4/5] md:aspect-[3/4]" shift={-80} position="35% 40%" />
            <div className="col-span-2 flex flex-col justify-end md:col-span-3 md:col-start-1 md:pb-10" data-reveal>
              <p className="sw-title m-0 text-2xl text-ink">
                A gathering in Ijebu Ode, a lecture theatre, a one-to-one conversation. Teaching happens in all of them.
              </p>
              <p className="m-0 mt-3 text-sm leading-relaxed text-ink-3">
                Photography from the Unsplash community, much of it by Nigerian photographers.{" "}
                <Link href="/about-us#photo-credits" className="text-accent underline underline-offset-4">
                  See the credits
                </Link>
                .
              </p>
            </div>
            <CollagePhoto photo={photos.ijebuGathering} className="col-span-2 md:col-span-6 md:-mt-10" aspect="aspect-[3/2]" shift={-60} />
            <CollagePhoto photo={photos.library} className="max-md:hidden md:col-span-3 md:-mt-24" aspect="aspect-[3/4]" shift={-150} position="40% 50%" />
          </div>
        </div>
      </section>

      {/* ── The studio ── */}
      <section aria-labelledby="studio-heading" className="sw-sheet bg-paper-2 pb-28 pt-20 md:pb-40 md:pt-28">
        <div className="sw-wrap">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <SectionHead id="studio-heading" eyebrow="The course studio" title="Everything you need to build a *course*" />
            <p data-reveal className="sw-lead m-0 max-w-sm text-ink-2">
              Mix lessons and assessments in any order, then preview the course exactly as a learner will see it.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:mt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <FeaturePhoto photo={photos.recording} chip="Record" title="Teach on video" position="50% 35%" />
              <FeaturePhoto photo={photos.coursePlanning} chip="Plan" title="Shape it with others" position="45% 30%" className="sm:mt-14" />
            </div>
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
              {BLOCKS.map(({ icon: Icon, title, text }, index) => (
                <li
                  key={title}
                  data-reveal
                  style={{ "--d": `${(index % 4) * 0.06}s` } as Vars}
                  className="sw-card-hover flex flex-col rounded-[24px] border border-line bg-card p-5"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mint text-accent">
                    <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <h3 className="sw-title m-0 mt-4 text-[1.15rem] text-ink">{title}</h3>
                  <p className="m-0 mt-1.5 text-[0.94rem] leading-relaxed text-ink-2">{text}</p>
                </li>
              ))}
            </ul>
          </div>
          <div data-reveal className="mt-10">
            <TextLink href="/how-it-works#studio" className="text-ink">See the studio in detail</TextLink>
          </div>
        </div>
      </section>

      {/* ── The Nigerian context ── */}
      <section
        aria-labelledby="context-heading"
        data-progress="view"
        className="sw-sheet sw-on-dark sw-grain overflow-hidden bg-forest pb-28 pt-20 md:pb-40 md:pt-32"
      >
        <Contours className="text-leaf" />
        <div className="sw-wrap relative">
          <SectionHead
            id="context-heading"
            onDark
            eyebrow="Why it matters"
            title="Skilled practitioners are needed *here*"
            lead="Every course you write helps someone respond better to situations like these. These are some of the realities social workers in Nigeria meet every day."
          />

          <ul className="m-0 mt-14 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {contextStats.map((stat, index) => (
              <li
                key={stat.label}
                data-reveal
                style={{ "--d": `${index * 0.1}s` } as Vars}
                className="flex flex-col rounded-[28px] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-sm md:p-7"
              >
                <p className="sw-display m-0 text-[clamp(2.6rem,4.6vw,3.9rem)] text-gold-light">
                  {stat.prefix}
                  <span data-count={stat.value}>{stat.value}</span>
                  <span className="text-[0.55em] tracking-normal">{stat.suffix}</span>
                </p>
                <p className="m-0 mt-4 flex-1 text-[0.98rem] leading-relaxed text-white/80">{stat.label}</p>
                <a
                  href={stat.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sw-cap mt-6 inline-flex items-center gap-1.5 text-white/50 no-underline transition-colors hover:text-gold-light"
                >
                  {stat.source}
                  <ExternalLink size={11} aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="sw-cap m-0 mt-8 text-white/40">Figures checked against the linked sources, {contextCheckedOn}.</p>
        </div>
      </section>

      {/* ── From application to first course ── */}
      <section aria-labelledby="path-heading" className="sw-sheet bg-paper pb-28 pt-20 md:pb-40 md:pt-32">
        <div className="sw-wrap grid gap-x-14 gap-y-12 lg:grid-cols-[0.8fr_1fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHead
              id="path-heading"
              eyebrow="Getting started"
              title="From application to your first *course*"
              lead="Four steps, at a pace that fits around your practice."
            />
            <div data-reveal className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Btn href="/register">Start your application</Btn>
              <TextLink href="/how-it-works" className="text-ink">The full process</TextLink>
            </div>
            <div data-reveal="clip" className="mt-12 max-lg:hidden">
              <Photo frame={1.25} photo={photos.writingNotes} sizes="34vw" position="50% 40%" className="aspect-[5/4] w-full rounded-[32px]" />
            </div>
          </div>
          <ol className="m-0 flex list-none flex-col gap-5 p-0">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className={cx(
                  "sticky overflow-hidden rounded-[32px] border border-line p-7 shadow-[0_-18px_50px_-30px_rgba(4,18,11,0.35)] md:p-10",
                  step.surface,
                )}
                style={{ top: `calc(6rem + ${index * 1.1}rem)` }}
              >
                <div className="flex items-start justify-between gap-6">
                  <span className={cx("grid h-14 w-14 place-items-center rounded-2xl bg-current/10", step.tint)}>
                    <step.icon size={26} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className={cx("sw-em text-[3.4rem] leading-none opacity-80 md:text-[4.4rem]", step.tint)} aria-hidden="true">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="sw-display m-0 mt-10 text-[clamp(1.6rem,2.6vw,2.3rem)] md:mt-16">{step.title}</h3>
                <p className="m-0 mt-3 max-w-md text-[1.02rem] leading-relaxed opacity-80">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Who we are looking for ── */}
      <section aria-labelledby="who-heading" className="sw-sheet bg-mint pb-28 pt-20 md:pb-36 md:pt-28">
        <div className="sw-wrap grid items-center gap-x-14 gap-y-12 lg:grid-cols-[1fr_1fr]">
          <div className="relative" data-reveal="clip">
            <Photo frame={0.8}
              photo={photos.yellowBlazer}
              sizes="(min-width: 1024px) 46vw, 92vw"
              position="50% 25%"
              className="aspect-[4/5] w-full rounded-[36px] md:aspect-square md:rounded-[44px]"
            />
            <span className="sw-chip absolute bottom-5 left-5 bg-white/90 text-[#10231a] backdrop-blur">
              <UsersRound size={14} className="text-clay-ink" aria-hidden="true" />
              No online teaching experience needed
            </span>
          </div>
          <div>
            <SectionHead id="who-heading" eyebrow="Who we look for" title="Practice first, *polish* second" />
            <p data-reveal className="sw-lead m-0 mt-6 max-w-xl text-ink-2">
              We are interested in what you know and how you share it. The studio and our reviewers help with the rest.
            </p>
            <ul className="m-0 mt-8 list-none border-t border-line p-0">
              {LOOKING_FOR.map((item, index) => (
                <li
                  key={item}
                  data-reveal
                  style={{ "--d": `${index * 0.06}s` } as Vars}
                  className="flex gap-4 border-b border-line py-5 text-[1.02rem] leading-relaxed text-ink"
                >
                  <span className="sw-em w-8 flex-none text-2xl leading-none text-clay-ink" aria-hidden="true">0{index + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
            <div data-reveal className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Btn href="/why-teach">Why Teach With Us</Btn>
              <TextLink href="/faq" className="text-ink">Read the FAQ</TextLink>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quality and review ── */}
      <section
        aria-labelledby="quality-heading"
        data-progress="view"
        className="sw-sheet sw-grain relative overflow-hidden bg-[#b94a28] pb-28 pt-20 text-white md:pb-40 md:pt-28"
      >
        <Contours className="text-white" />
        <div className="sw-wrap relative grid items-center gap-x-14 gap-y-12 lg:grid-cols-[1fr_0.62fr]">
          <div>
            <div data-reveal>
              <Eyebrow className="text-white [--dot:var(--sw-gold-light)]">Quality and review</Eyebrow>
            </div>
            <Heading
              id="quality-heading"
              text="You are never teaching *alone*"
              accent="text-gold-light"
              className="sw-display m-0 mt-5 text-[clamp(2.1rem,4.6vw,3.9rem)]"
            />
            <p data-reveal className="sw-lead m-0 mt-7 max-w-2xl text-white/90">
              Nothing reaches learners until it is published. Before then, reviewers read your course stage by stage:
              academic content, quality, then a course lead. Their comments arrive in the studio, next to the lesson
              they are about.
            </p>
            <ul data-reveal className="m-0 mt-9 flex list-none flex-wrap gap-2.5 p-0" aria-label="Review stages">
              {["Academic review", "Quality review", "Course-lead review", "Published as version 1.0"].map((step, index) => (
                <li key={step} className="sw-chip bg-white/15 text-white backdrop-blur-sm">
                  <span className="tabular-nums text-gold-light">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
          <div data-reveal="scale" className="relative mx-auto w-full max-w-[380px]">
            <Photo frame={0.8}
              photo={photos.pointing}
              sizes="(min-width: 1024px) 30vw, 80vw"
              position="38% 40%"
              className="aspect-[4/5] w-full rounded-t-[999px] rounded-b-[36px]"
            />
            <span className="sw-chip absolute -left-3 bottom-10 bg-white text-[#10231a] shadow-lg">
              <ClipboardCheck size={14} className="text-clay-ink" aria-hidden="true" />
              Comments on each lesson
            </span>
          </div>
        </div>
      </section>

      {/* ── Community ── */}
      <section aria-labelledby="community-heading" className="sw-sheet bg-paper pb-28 pt-20 md:pb-36 md:pt-28">
        <div className="sw-wrap grid items-center gap-x-14 gap-y-12 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <div data-reveal>
              <Eyebrow className="text-accent">Instructor community</Eyebrow>
            </div>
            <Heading
              id="community-heading"
              text="Talk it through with *colleagues*"
              className="sw-display m-0 mt-5 text-[clamp(2.1rem,4.4vw,3.7rem)] text-ink"
            />
            <p data-reveal className="sw-lead m-0 mt-6 max-w-xl text-ink-2">
              Community rooms let instructors share ideas, ask for a second opinion and swap resources, with replies,
              attachments and a view of who is online.
            </p>
            <div data-reveal className="mt-9">
              <Btn href="/register">Join as an Instructor</Btn>
            </div>
          </div>
          <div className="relative" data-reveal="clip">
            <Photo frame={1.5} photo={photos.teamMeeting} sizes="(min-width: 1024px) 50vw, 92vw" className="aspect-[3/2] w-full rounded-[36px] md:rounded-[44px]" />
            <span className="sw-chip absolute bottom-5 left-5 bg-white/90 text-[#10231a] backdrop-blur">
              <MessagesSquare size={14} className="text-clay-ink" aria-hidden="true" />
              Rooms for every conversation
            </span>
          </div>
        </div>
      </section>

      {/* ── Closing call ── */}
      <ClosingCall
        id="closing-heading"
        eyebrow="Begin today"
        title="Share what you know. *Shape* what comes next."
        lead="Apply in a few minutes. If you are approved, you can start building your first course the same day."
        photo={photos.speakerMic}
        position="62% 28%"
      />
    </div>
  );
}

/** The full-bleed photo band that ends each public page. */
export function ClosingCall({
  id,
  eyebrow,
  title,
  lead,
  photo,
  position,
  secondary = { href: "/contact?topic=apply", label: "Ask Us a Question" },
}: {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  photo: PhotoData;
  position?: string;
  secondary?: { href: string; label: string };
}) {
  return (
    <section aria-labelledby={id} className="sw-sheet bg-paper px-2.5 pb-10 pt-2.5 sm:px-5 sm:pt-5 md:pb-14">
      <div className="sw-on-dark relative overflow-hidden rounded-[32px] md:rounded-[48px]" data-nav-bg="#0c2a1e">
        <Photo photo={photo} place={false} frame={0.67} sizes="(min-width: 768px) 90vw, 100vw" position={position} className="absolute inset-0 h-full w-full" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-night/95 via-forest/75 to-forest/5" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-night/75 to-transparent md:hidden" />
        <div className="sw-wrap relative flex min-h-[560px] flex-col justify-end py-14 md:min-h-[640px] md:justify-center md:py-24">
          <div className="max-w-2xl">
            <div data-reveal>
              <Eyebrow className="text-gold-light">{eyebrow}</Eyebrow>
            </div>
            <Heading
              id={id}
              text={title}
              accent="text-gold-light"
              className="sw-display m-0 mt-5 text-[clamp(2.4rem,5.6vw,4.9rem)] text-[#fffdf4]"
            />
            <p data-reveal className="sw-lead m-0 mt-6 max-w-lg text-white/80">{lead}</p>
            <div data-reveal className="mt-9 flex flex-wrap gap-3">
              <Btn href="/register" variant="gold">Apply to Teach</Btn>
              <Btn href={secondary.href} variant="ghost">{secondary.label}</Btn>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturePhoto({
  photo,
  chip,
  title,
  position,
  className,
}: {
  photo: PhotoData;
  chip: string;
  title: string;
  position?: string;
  className?: string;
}) {
  return (
    <div data-reveal className={cx("relative overflow-hidden rounded-[32px] bg-forest text-white", className)}>
      <Photo frame={0.8}
        photo={photo}
        place={false}
        sizes="(min-width: 1024px) 26vw, (min-width: 640px) 46vw, 92vw"
        position={position}
        className="aspect-[4/5] w-full"
      >
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/5 to-transparent" />
      </Photo>
      <span className="sw-chip absolute left-5 top-5 bg-white/90 text-[#10231a]">{chip}</span>
      <span aria-hidden="true" className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-gold text-[#10231a]">
        <ArrowUpRight size={19} />
      </span>
      <p className="sw-display absolute inset-x-0 bottom-0 m-0 p-6 text-[clamp(1.6rem,2.4vw,2.1rem)]">{title}</p>
    </div>
  );
}

/** The tallest width ÷ height among aspect-[w/h] classes. */
function frameOf(classes: string) {
  const ratios = [...classes.matchAll(/aspect-\[(\d+)\/(\d+)\]/g)].map((m) => Number(m[1]) / Number(m[2]));
  return ratios.length ? Math.min(...ratios) : undefined;
}

export function CollagePhoto({
  photo,
  className,
  aspect,
  shift,
  position,
}: {
  photo: PhotoData;
  className?: string;
  aspect: string;
  shift: number;
  position?: string;
}) {
  return (
    <div className={className} data-progress="view">
      <div className="sw-drift" style={{ "--shift": `${shift}px` } as Vars}>
        <p className="sw-cap m-0 mb-2.5 flex items-center justify-between gap-3 text-ink-3">
          <span>{photo.place ?? ""}</span>
          <span className="normal-case tracking-normal opacity-80 max-md:hidden">Photo: {photo.by}</span>
        </p>
        <div data-reveal="clip">
          <Photo
            photo={photo}
            place={false}
            frame={frameOf(aspect)}
            sizes="(min-width: 768px) 42vw, 92vw"
            position={position}
            className={cx("w-full rounded-[24px] md:rounded-[30px]", aspect)}
          />
        </div>
      </div>
    </div>
  );
}
