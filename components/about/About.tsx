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
import { Button, CtaBand, Eyebrow, IconTile, PageHero, SectionIntro } from "@/components/swcl/ui";
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

const externalLink = "inline-flex items-center gap-1.5 font-semibold underline underline-offset-4";

export default function About() {
  return (
    <>
      <PageHero
        id="about-heading"
        eyebrow="About us"
        title="Learning built by practitioners, for practitioners"
        lead={
          <>
            <p className="m-0">
              Social Work Consultancy Ltd supports ethical, skilled and culturally relevant social work practice in
              Nigeria and across the Global South.
            </p>
            <p className="m-0 mt-3">
              This is our instructor platform: the place where the courses on Socialworknigeria.org are written, reviewed
              and taught.
            </p>
          </>
        }
        image={photos.practitioner}
        position="66% 40%"
      >
        <Button href="/register">Express Interest</Button>
        <Button href="/contact" variant="outline-light">
          Contact Us
        </Button>
      </PageHero>

      {/* Platform and purpose */}
      <section aria-labelledby="platform-heading" className="swc-section bg-swc-white">
        <div className="swc-wrap grid gap-x-16 gap-y-14 min-[1001px]:grid-cols-2">
          <div>
            <Eyebrow>Two sides of one platform</Eyebrow>
            <h2 id="platform-heading" className="swc-h2 mt-4">
              Where courses are made
            </h2>
            <div className="swc-prose mt-6 text-[1.0625rem]">
              <p>
                Learners find courses, mentorship and resources on Socialworknigeria.org, the e-learning platform of
                Social Work Consultancy Ltd. Those courses are built here, by instructors, in a studio designed for
                practice-led teaching.
              </p>
              <p>
                Instructors plan their courses, upload lessons, write assessments, respond to reviewers and mark
                learners’ work, all from one account. For the wider work of Social Work Consultancy Ltd, visit{" "}
                <a
                  href="https://socialwork-consultancy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-swc-label underline underline-offset-4"
                >
                  socialwork-consultancy.com
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                .
              </p>
            </div>
          </div>
          <div>
            <Eyebrow>Our purpose</Eyebrow>
            <h2 className="swc-h2 mt-4">Why we do this</h2>
            <div className="swc-prose mt-6 text-[1.0625rem]">
              <p>
                People working with children, families and communities need opportunities to deepen their knowledge,
                reflect on difficult decisions and develop their practice, often where formal training and supervision
                are hard to reach.
              </p>
              <p>
                The fastest way to close that gap is to let experienced people teach. Our role is to give them good
                tools, careful review and learners who are ready to listen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The profession */}
      <section aria-labelledby="profession-heading" className="swc-section bg-swc-mint">
        <div className="swc-wrap">
          <div className="swc-dark rounded-lg bg-swc-deep p-8 text-white md:p-12">
            <Eyebrow>The profession</Eyebrow>
            <h2 id="profession-heading" className="swc-h3 mt-4 max-w-[760px] text-white">
              The courses on our platform are grounded in the internationally agreed definition and ethical principles of
              social work.
            </h2>
            <blockquote className="m-0 mt-8 max-w-[920px] border-l-4 border-swc-gold pl-6">
              <p className="m-0 text-[clamp(1.15rem,2vw,1.5rem)] font-bold leading-snug">
                Social work is a practice-based profession that promotes social change, cohesion and the empowerment of
                people. Social justice, human rights, collective responsibility and respect for diversities sit at its
                centre, informed by indigenous knowledges as well as theory.
              </p>
            </blockquote>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[0.92rem] text-swc-gold-light">
              <a href={globalDefinitionUrl} target="_blank" rel="noopener noreferrer" className={externalLink}>
                Read the global definition (IFSW and IASSW, 2014)
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a href={ethicalPrinciplesUrl} target="_blank" rel="noopener noreferrer" className={externalLink}>
                Statement of ethical principles (2018)
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Who teaches */}
      <section aria-labelledby="instructors-heading" className="swc-section bg-swc-paper">
        <div className="swc-wrap">
          <SectionIntro id="instructors-heading" eyebrow="Our instructors" title="Who teaches with us" />
          <ul className="m-0 mt-12 grid list-none gap-5 p-0 min-[701px]:grid-cols-2 min-[1001px]:grid-cols-4">
            {INSTRUCTORS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="swc-card swc-card--accent flex flex-col p-7">
                <IconTile>
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </IconTile>
                <h3 className="swc-h4 mt-6">{title}</h3>
                <p className="m-0 mt-3 text-[0.95rem] text-swc-ink-2">{text}</p>
              </li>
            ))}
          </ul>
          <p className="swc-card m-0 mt-8 flex max-w-[760px] items-start gap-3 p-5 text-[0.92rem] text-swc-ink-2">
            <Info className="mt-0.5 h-[18px] w-[18px] flex-none text-swc-label" aria-hidden="true" />
            <span>
              Every course states its intended audience and entry requirements. Training on the platform does not, in
              itself, confer professional registration or authorise practice beyond a learner’s role.
            </span>
          </p>
        </div>
      </section>

      {/* Values */}
      <section aria-labelledby="values-heading" className="swc-section bg-swc-white">
        <div className="swc-wrap">
          <SectionIntro id="values-heading" align="center" eyebrow="What guides every course" title="Our values" />
          <ul className="m-0 mt-12 grid list-none gap-5 p-0 min-[701px]:grid-cols-2">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="swc-card flex items-start gap-5 p-7">
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

      <CtaBand
        id="about-cta-heading"
        title="Teach with us."
        body="If you have practice worth passing on, we would like to hear from you."
        primary={{ href: "/register", label: "Express Interest" }}
        secondary={{ href: "/contact", label: "Contact Us" }}
      />

      {/* Photo credits */}
      <section id="photo-credits" aria-labelledby="credits-heading" className="bg-swc-paper py-16 md:py-20">
        <div className="swc-wrap">
          <div className="max-w-[680px]">
            <Eyebrow>Photo credits</Eyebrow>
            <h2 id="credits-heading" className="swc-h3 mt-4">
              The photographers behind this site
            </h2>
            <p className="m-0 mt-3 text-[0.95rem] text-swc-ink-2">
              These photographs are shared by their makers on Unsplash. They are used to show everyday life, teaching and
              learning; the people pictured are not our instructors, learners or people who use social work services.
            </p>
          </div>
          <ul className="m-0 mt-8 grid list-none grid-cols-2 gap-x-4 gap-y-5 p-0 min-[701px]:grid-cols-3 min-[1001px]:grid-cols-5">
            {CREDITS.map((photo) => (
              <li key={photo.ref}>
                <a
                  href={photoCreditUrl(photo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 text-swc-ink no-underline"
                >
                  <span className="relative h-12 w-12 flex-none overflow-hidden rounded-lg border border-swc-line">
                    <Image src={photo.src} alt="" fill sizes="96px" className="object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold group-hover:underline">{photo.by}</span>
                    <span className="block truncate text-xs text-swc-ink-3">{photo.place ?? "Unsplash"}</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
