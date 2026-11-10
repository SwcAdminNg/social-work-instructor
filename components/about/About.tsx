import Image from "next/image";
import {
  BookOpenCheck,
  Briefcase,
  Earth,
  ExternalLink,
  GraduationCap,
  Info,
  Lightbulb,
  Scale,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import PageHero from "@/components/site/PageHero";
import { Btn, Contours, Eyebrow, Heading, Photo, SectionHead, type Vars } from "@/components/site/ui";
import { ClosingCall } from "@/components/home/Home";
import { photoCreditUrl, photos } from "@/lib/photos";
import { ethicalPrinciplesUrl, globalDefinitionUrl } from "@/lib/nigeriaContext";

const INSTRUCTORS = [
  {
    icon: Briefcase,
    title: "Experienced practitioners",
    text: "Social workers with years in child protection, health, community or justice settings.",
  },
  {
    icon: GraduationCap,
    title: "Lecturers and trainers",
    text: "Academics and trainers who want their teaching to reach practitioners beyond the classroom.",
  },
  {
    icon: BookOpenCheck,
    title: "Supervisors and managers",
    text: "People who develop others every day and can teach the judgement that comes with responsibility.",
  },
  {
    icon: Stethoscope,
    title: "Allied professionals",
    text: "Specialists in health, law, education and psychology whose knowledge social workers rely on.",
  },
];

const VALUES = [
  {
    icon: Scale,
    title: "Human rights and social justice",
    text: "Respecting dignity, recognising inequality and promoting fair and inclusive practice.",
  },
  {
    icon: ShieldCheck,
    title: "Safeguarding and accountability",
    text: "Keeping people’s safety and wellbeing central while promoting responsible professional judgement.",
  },
  {
    icon: Earth,
    title: "Cultural relevance",
    text: "Connecting learning to the realities of Nigeria and the wider communities our learners serve.",
  },
  {
    icon: Lightbulb,
    title: "Evidence and reflection",
    text: "Encouraging learners to examine assumptions, draw on relevant knowledge, and learn from experience.",
  },
];

const CREDITS = Object.values(photos);

export default function About() {
  return (
    <div>
      <PageHero
        id="about-heading"
        eyebrow="About us"
        title="Learning built by *practitioners,* for practitioners"
        lead="Social Work Consultancy Ltd supports ethical, skilled and culturally relevant social work practice in Nigeria and across the Global South."
        body="This is our instructor platform: the place where the courses on Socialworknigeria.org are written, reviewed and taught."
        photo={photos.practitioner}
        position="66% 40%"
      >
        <Btn href="/register" variant="gold">Apply to Teach</Btn>
        <Btn href="/contact" variant="ghost">Contact Us</Btn>
      </PageHero>

      {/* Platform and purpose */}
      <section className="sw-sheet bg-paper pb-28 pt-20 md:pb-40 md:pt-32" aria-label="Our platform and purpose">
        <div className="sw-wrap">
          <div className="grid gap-x-16 gap-y-14 lg:grid-cols-2">
            <div>
              <div data-reveal>
                <Eyebrow className="text-accent">Two sides of one platform</Eyebrow>
              </div>
              <Heading text="Where courses are *made*" className="sw-display m-0 mt-5 text-[clamp(2rem,3.8vw,3.2rem)] text-ink" />
              <div data-reveal className="mt-6 space-y-4 text-[1.05rem] leading-relaxed text-ink-2">
                <p className="m-0">
                  Learners find courses, mentorship and resources on Socialworknigeria.org, the e-learning platform of
                  Social Work Consultancy Ltd. Those courses are built here, by instructors, in a studio designed for
                  practice-led teaching.
                </p>
                <p className="m-0">
                  Instructors plan their courses, upload lessons, write assessments, respond to reviewers and mark
                  learners’ work, all from one account. For the wider work of Social Work Consultancy Ltd, visit{" "}
                  <a
                    href="https://socialwork-consultancy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-accent underline underline-offset-4"
                  >
                    socialwork-consultancy.com
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  .
                </p>
              </div>
            </div>
            <div>
              <div data-reveal>
                <Eyebrow className="text-accent">Our purpose</Eyebrow>
              </div>
              <Heading text="Why we *do this*" className="sw-display m-0 mt-5 text-[clamp(2rem,3.8vw,3.2rem)] text-ink" />
              <div data-reveal className="mt-6 space-y-4 text-[1.05rem] leading-relaxed text-ink-2">
                <p className="m-0">
                  People working with children, families and communities need opportunities to deepen their knowledge,
                  reflect on difficult decisions and develop their practice, often where formal training and supervision
                  are hard to reach.
                </p>
                <p className="m-0">
                  The fastest way to close that gap is to let experienced people teach. Our role is to give them good
                  tools, careful review and learners who are ready to listen.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 grid gap-4 md:mt-24 md:grid-cols-[1.5fr_1fr] md:gap-6">
            <div data-reveal="clip">
              <Photo frame={1.33}
                photo={photos.ijebuGathering}
                sizes="(min-width: 768px) 60vw, 92vw"
                className="aspect-[4/3] w-full rounded-[32px] md:aspect-auto md:h-full md:min-h-[420px] md:rounded-[44px]"
              />
            </div>
            <div data-reveal="clip" style={{ "--d": "0.12s" } as Vars}>
              <Photo frame={0.8}
                photo={photos.listening}
                sizes="(min-width: 768px) 38vw, 92vw"
                position="55% 40%"
                className="aspect-[4/5] w-full rounded-[32px] md:rounded-[44px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The profession */}
      <section
        aria-labelledby="profession-heading"
        data-progress="view"
        className="sw-sheet sw-on-dark sw-grain overflow-hidden bg-forest pb-28 pt-20 md:pb-40 md:pt-32"
      >
        <Contours className="text-leaf" />
        <div className="sw-wrap relative grid gap-x-14 gap-y-10 lg:grid-cols-[0.36fr_1fr]">
          <div data-reveal>
            <Eyebrow className="text-gold-light">The profession</Eyebrow>
            <p className="m-0 mt-5 max-w-xs text-[0.98rem] leading-relaxed text-white/65">
              The courses on our platform are grounded in the internationally agreed definition and ethical principles of
              social work.
            </p>
          </div>
          <div>
            <Heading
              id="profession-heading"
              scrub
              accent="text-gold-light"
              text="Social work is a practice-based profession that promotes social change, cohesion and the empowerment of people. *Social justice, human rights, collective responsibility and respect for diversities* sit at its centre, informed by indigenous knowledges as well as theory."
              className="sw-display m-0 text-[clamp(1.6rem,3.3vw,2.9rem)] leading-[1.1] text-[#fffdf4]"
            />
            <div data-reveal className="mt-9 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <a href={globalDefinitionUrl} target="_blank" rel="noopener noreferrer" className="sw-link text-gold-light">
                Read the global definition (IFSW and IASSW, 2014)
                <ExternalLink size={14} aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a href={ethicalPrinciplesUrl} target="_blank" rel="noopener noreferrer" className="sw-link text-gold-light">
                Statement of ethical principles (2018)
                <ExternalLink size={14} aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Who teaches */}
      <section className="sw-sheet bg-paper-2 pb-28 pt-20 md:pb-40 md:pt-28" aria-labelledby="instructors-heading">
        <div className="sw-wrap">
          <SectionHead id="instructors-heading" eyebrow="Our instructors" title="Who *teaches* with us" />
          <ul className="m-0 mt-12 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {INSTRUCTORS.map(({ icon: Icon, title, text }, index) => (
              <li
                key={title}
                data-reveal
                style={{ "--d": `${index * 0.08}s` } as Vars}
                className="sw-card-hover flex flex-col rounded-[28px] border border-line bg-card p-7"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-mint text-accent">
                  <Icon size={26} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="sw-em mt-8 text-3xl text-clay-ink" aria-hidden="true">0{index + 1}</span>
                <h3 className="sw-title m-0 mt-2 text-[1.35rem] text-ink">{title}</h3>
                <p className="m-0 mt-3 text-[0.98rem] leading-relaxed text-ink-2">{text}</p>
              </li>
            ))}
          </ul>
          <p data-reveal className="m-0 mt-8 flex max-w-3xl items-start gap-3 rounded-2xl bg-card/70 p-5 text-[0.95rem] leading-relaxed text-ink-2">
            <Info size={18} className="mt-0.5 flex-none text-gold-ink" aria-hidden="true" />
            <span>
              Every course states its intended audience and entry requirements. Training on the platform does not, in
              itself, confer professional registration or authorise practice beyond a learner’s role.
            </span>
          </p>
        </div>
      </section>

      {/* Values */}
      <section
        aria-labelledby="values-heading"
        data-progress="view"
        className="sw-sheet sw-grain relative overflow-hidden bg-[#b94a28] pb-28 pt-20 text-white md:pb-40 md:pt-28"
      >
        <Contours className="text-white" />
        <div className="sw-wrap relative">
          <div data-reveal>
            <Eyebrow className="text-white [--dot:var(--sw-gold-light)]">What guides every course</Eyebrow>
          </div>
          <Heading
            id="values-heading"
            text="Our *values*"
            accent="text-gold-light"
            className="sw-display m-0 mt-5 text-[clamp(2.2rem,4.8vw,4rem)]"
          />
          <ul className="m-0 mt-12 grid list-none gap-x-10 gap-y-0 border-t border-white/25 p-0 md:grid-cols-2">
            {VALUES.map(({ icon: Icon, title, text }, index) => (
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
        id="about-cta-heading"
        eyebrow="Work with us"
        title="Teach with *us.*"
        lead="If you have practice worth passing on, we would like to hear from you."
        photo={photos.teamMeeting}
        position="50% 35%"
        secondary={{ href: "/contact?topic=partnership", label: "Partner With Us" }}
      />

      {/* Photo credits */}
      <section id="photo-credits" className="scroll-mt-28 bg-paper pb-24 pt-10 md:pb-28" aria-labelledby="credits-heading">
        <div className="sw-wrap">
          <div data-reveal className="max-w-2xl">
            <Eyebrow className="text-accent">Photo credits</Eyebrow>
            <h2 id="credits-heading" className="sw-title m-0 mt-4 text-2xl text-ink">The photographers behind this site</h2>
            <p className="m-0 mt-3 text-[0.95rem] leading-relaxed text-ink-2">
              These photographs are shared by their makers on Unsplash. They are used to show everyday life, teaching
              and learning; the people pictured are not our instructors, learners or people who use social work services.
            </p>
          </div>
          <ul className="m-0 mt-8 grid list-none grid-cols-2 gap-x-4 gap-y-5 p-0 sm:grid-cols-3 lg:grid-cols-5">
            {CREDITS.map((photo) => (
              <li key={photo.ref}>
                <a href={photoCreditUrl(photo)} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 text-ink no-underline">
                  <span className="relative h-12 w-12 flex-none overflow-hidden rounded-xl">
                    <Image src={photo.src} alt="" fill sizes="128px" className="object-cover transition-transform duration-700 ease-sw group-hover:scale-110" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold group-hover:text-accent">{photo.by}</span>
                    <span className="block truncate text-xs text-ink-3">{photo.place ?? "Unsplash"}</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
