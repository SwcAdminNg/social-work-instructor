import { FileText, ShieldCheck, Users } from "lucide-react";
import { Button, CheckList, CtaBand, Eyebrow, FaqList, IconTile, PageHero, SectionIntro, cx } from "@/components/swcl/ui";

/* Approved copy: SWCL Instructor Page Content and Developer Handover v1.0 (14 Nov 2026). */

export const APPLY_HREF = "/register";

const PROPOSITION = [
  { title: "Locally relevant", text: "Rooted in Nigerian practice" },
  { title: "Globally informed", text: "Aligned with credible standards" },
  { title: "Practice focused", text: "Designed for real-world use" },
];

const ROLES = [
  {
    icon: FileText,
    title: "Course Author",
    text: "Develop structured lessons, practice activities, case scenarios, feedback and assessment materials within an agreed course brief.",
    points: ["Educators and subject specialists", "Clear milestones and deliverables", "Editorial and quality review"],
  },
  {
    icon: Users,
    title: "Facilitator",
    text: "Lead webinars, workshops, reflective clinics or moderated discussions using approved course and professional-development material.",
    points: ["Experienced practitioners", "Virtual or blended delivery", "Defined learner-support duties"],
  },
  {
    icon: ShieldCheck,
    title: "Reviewer or Mentor",
    text: "Strengthen the accuracy and relevance of learning, or provide bounded professional guidance through an agreed mentoring role.",
    points: ["Senior specialists and academics", "Independent quality oversight", "Clear boundaries and safeguarding"],
  },
];

const EXPERTISE = [
  "Professional, academic, research or practice knowledge relevant to the proposed topic",
  "Ability to connect evidence and theory with Nigerian or comparable practice contexts",
  "Clear communication and appropriate teaching, facilitation or mentoring skills",
  "Experience suitable for the specific contributor role",
];

const COMMITMENT = [
  "Original, accurate and properly referenced work",
  "Respect for confidentiality, safeguarding and professional boundaries",
  "Inclusive and accessible learning for a varied audience",
  "Capacity to meet agreed milestones and respond constructively to review",
];

export const JOURNEY = [
  { title: "Express interest", text: "Tell us about your experience, proposed topic and preferred contribution." },
  { title: "Agree the brief", text: "Confirm the audience, learning outcomes, workload, deliverables and contractual terms." },
  { title: "Develop the material", text: "Create lessons, scenarios, activities, feedback and assessment content as agreed." },
  { title: "Respond to review", text: "Revise the work following accuracy, relevance, accessibility and learning-design checks." },
  { title: "Support delivery", text: "Facilitate sessions or respond to learner work where this forms part of the role." },
  { title: "Review and improve", text: "Use learner feedback and assessment evidence to identify worthwhile updates." },
];

export const QUALITY = [
  { title: "Ethical and safe", text: "Confidentiality, safeguarding, professional boundaries and responsible use of case material." },
  { title: "Locally relevant", text: "Nigerian systems, legislation, resources, communities and everyday practice conditions." },
  { title: "Evidence informed", text: "Claims, models and recommendations supported by appropriate and current sources." },
  { title: "Accessible", text: "Clear language, inclusive design and materials suitable for different devices and learning needs." },
];

const SWCL_PROVIDES = [
  "Course brief and learning-design guidance",
  "Editorial, accessibility and quality review",
  "Platform setup and learner-access support",
  "Clear approvals, contracts and governance",
];

const INSTRUCTOR_PROVIDES = [
  "Accurate, current and properly referenced content",
  "Respect for ethics, confidentiality and safeguarding",
  "Timely collaboration and response to review",
  "Learning that develops knowledge, skills and judgement",
];

const REQUESTED = [
  "Full name and contact details",
  "Preferred contributor role",
  "Area of expertise",
  "Relevant qualifications and experience",
  "Proposed topic or course idea",
  "Intended learner group",
  "CV or professional profile",
  "Availability and preferred delivery format",
];

const NEXT_STEPS = [
  "SWCL reviews your submission against current learning priorities and role requirements.",
  "Suitable contributors may be invited to a discussion on the audience, scope and approach.",
  "A written brief confirms deliverables, review stages, timescales, and any applicable fee or honourarium.",
  "Development begins only once the relevant agreement and approvals are in place.",
];

export const FAQS = [
  {
    q: "Who can express interest?",
    a: "Practitioners, educators, researchers, managers, policy professionals and allied specialists may express interest if their expertise is relevant to social work, professional education or related human services.",
  },
  {
    q: "Do I need previous online teaching experience?",
    a: "Not for every role. Selection is based on the needs of the opportunity. SWCL can provide a course framework and learning-design guidance, while the contributor remains responsible for accurate subject knowledge and for the agreed deliverables.",
  },
  {
    q: "Can I propose a new course?",
    a: "Yes. Include the proposed topic, intended learners, the practice need it addresses, and what participants should be able to do after completing it. Proposals are considered alongside SWCL priorities and available resources.",
  },
  {
    q: "Are instructor roles paid?",
    a: "Where a fee or honourarium applies, the amount, payment stages, deliverables and conditions will be confirmed in writing before work begins. Submitting an expression of interest does not create any specific payment.",
  },
  {
    q: "Who owns the learning materials?",
    a: "Copyright, licensing, attribution and permitted reuse will be set out in the relevant contributor agreement. Contributors should not commence commissioned work until those terms have been agreed.",
  },
  {
    q: "Can I contribute from outside Nigeria?",
    a: "Remote contribution may be possible where the role and project permit it. Contributors must still demonstrate that their work is relevant to the intended learners and appropriately reflects Nigerian or comparable practice contexts.",
  },
  {
    q: "How are courses reviewed?",
    a: "Material may be reviewed for subject accuracy, local relevance, ethics, safeguarding, accessibility, learning design, referencing and technical readiness. Publication occurs only after all required revisions and approvals are complete.",
  },
  {
    q: "What happens after I submit my interest?",
    a: "SWCL will assess your information against current opportunities. Suitable applicants may be contacted for further discussion. Submission does not guarantee an interview, appointment or a commissioned assignment.",
  },
];

const pad = (n: number) => String(n).padStart(2, "0");

export default function InstructorLanding() {
  return (
    <>
      {/* 2 Hero */}
      <PageHero
        id="hero-title"
        eyebrow="Teach with Social Work Consultancy Ltd"
        title="Share your expertise. Strengthen social work practice."
        lead="Help us develop practical, ethical and culturally relevant learning for social workers, students and allied professionals in Nigeria and beyond."
        image={{
          src: "/images/site/presenting-whiteboard.webp",
          alt: "A Nigerian educator leading an interactive workshop for adult practitioners.",
          width: 2560,
          height: 1705,
        }}
        position="60% 50%"
      >
        <Button href={APPLY_HREF}>Express Interest</Button>
        <Button href="#journey" variant="outline-light">
          How It Works
        </Button>
      </PageHero>

      {/* 3 Instructor proposition */}
      <section aria-label="Instructor proposition" className="border-b border-swc-line bg-swc-paper">
        <div className="swc-wrap grid gap-6 py-7 min-[701px]:grid-cols-2 min-[1001px]:grid-cols-[1.5fr_1fr_1fr_1fr] min-[1001px]:gap-0">
          <div className="min-[1001px]:pr-8">
            <p className="m-0 text-[0.95rem] font-bold leading-snug">Professional learning from Social Work Consultancy Ltd</p>
            <p className="m-0 mt-1 text-[0.85rem] text-swc-ink-3">
              Instructor contributions are supported, reviewed and approved before publication.
            </p>
          </div>
          {PROPOSITION.map((item) => (
            <div key={item.title} className="min-[1001px]:border-l min-[1001px]:border-swc-line min-[1001px]:px-8">
              <p className="m-0 text-[0.95rem] font-bold">{item.title}</p>
              <p className="m-0 mt-1 text-[0.85rem] text-swc-ink-3">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4 Ways to contribute */}
      <section aria-labelledby="roles-title" className="swc-section bg-swc-white">
        <div className="swc-wrap">
          <SectionIntro
            id="roles-title"
            align="center"
            eyebrow="Ways to contribute"
            title="Choose the instructor role that fits your expertise"
            intro="Contributors may develop a full course, lead approved learning sessions, review specialist content, or provide structured mentorship. The scope and expectations are agreed before work begins."
          />
          <ul className="m-0 mt-14 grid list-none gap-6 p-0 min-[1001px]:grid-cols-3">
            {ROLES.map(({ icon: Icon, title, text, points }) => (
              <li key={title} className="swc-card swc-card--accent swc-card--lift flex flex-col p-7">
                <IconTile>
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </IconTile>
                <h3 className="swc-h3 mt-6">{title}</h3>
                <p className="m-0 mt-3 text-[0.95rem] text-swc-ink-2">{text}</p>
                <CheckList items={points} className="mt-6" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5 Who we are looking for */}
      <section aria-labelledby="who-title" className="swc-section bg-swc-mint">
        <div className="swc-wrap grid items-start gap-10 min-[1001px]:grid-cols-[0.9fr_1.1fr] min-[1001px]:gap-14">
          <SectionIntro
            id="who-title"
            eyebrow="Who we are looking for"
            title="Expertise that can be translated into useful learning"
            intro="We welcome expressions of interest from practitioners, educators, researchers, managers, policy professionals and allied specialists whose expertise is relevant to social work and human services. Selection is based on the needs of each course or programme."
          />
          <div className="grid gap-5 min-[701px]:grid-cols-2">
            <div className="swc-card p-7">
              <h3 className="swc-h4">Relevant expertise</h3>
              <CheckList items={EXPERTISE} className="mt-5" />
            </div>
            <div className="swc-card p-7">
              <h3 className="swc-h4">Professional commitment</h3>
              <CheckList items={COMMITMENT} className="mt-5" />
            </div>
          </div>
        </div>
      </section>

      {/* 6 Instructor journey */}
      <section id="journey" aria-labelledby="journey-title" className="swc-section bg-swc-paper">
        <div className="swc-wrap grid items-start gap-10 min-[1001px]:grid-cols-[0.85fr_1.15fr] min-[1001px]:gap-16">
          <div className="min-[1001px]:sticky min-[1001px]:top-28">
            <SectionIntro
              id="journey-title"
              eyebrow="The instructor journey"
              title="From expression of interest to course improvement"
              intro="A transparent process helps every contributor understand what is expected, who approves the work, and how the course will be supported after publication."
            />
          </div>
          <ol className="m-0 grid list-none gap-5 p-0 min-[701px]:grid-cols-2">
            {JOURNEY.map((step, i) => (
              <li key={step.title} className="swc-card p-6">
                <span className="swc-num">{pad(i + 1)}</span>
                <h3 className="swc-h4 mt-5">{step.title}</h3>
                <p className="m-0 mt-2 text-[0.92rem] text-swc-ink-2">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 7 Quality standards */}
      <section aria-labelledby="quality-title" className="swc-section bg-swc-white">
        <div className="swc-wrap">
          <SectionIntro
            id="quality-title"
            align="center"
            eyebrow="What every course should demonstrate"
            title="Quality is built into the development process"
            intro="SWCL supports instructors in connecting credible knowledge with Nigerian realities, professional ethics, accessibility and practical decision-making."
          />
          <ul className="m-0 mt-14 grid list-none gap-5 p-0 min-[701px]:grid-cols-2 min-[1001px]:grid-cols-4">
            {QUALITY.map((item, i) => (
              <li key={item.title} className="swc-card p-6">
                <span className="swc-num swc-num--soft">{pad(i + 1)}</span>
                <h3 className="swc-h4 mt-5">{item.title}</h3>
                <p className="m-0 mt-2 text-[0.92rem] text-swc-ink-2">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 8 Working together */}
      <section aria-label="Working together" className="bg-swc-white pb-[92px] max-[700px]:pb-[72px]">
        <div className="swc-wrap grid gap-6 min-[1001px]:grid-cols-2">
          <div className="swc-dark rounded-lg bg-swc-deep p-8 text-white md:p-10">
            <Eyebrow>SWCL provides</Eyebrow>
            <h2 className="swc-h3 mt-4 text-white">A supported development and publication process</h2>
            <CheckList items={SWCL_PROVIDES} tone="dark" divided className="mt-6" />
          </div>
          <div className="rounded-lg border border-swc-line bg-swc-mint p-8 md:p-10">
            <Eyebrow>The instructor provides</Eyebrow>
            <h2 className="swc-h3 mt-4">Credible expertise and professional care</h2>
            <CheckList items={INSTRUCTOR_PROVIDES} divided className="mt-6" />
          </div>
        </div>
      </section>

      {/* 9 Prepare your expression of interest */}
      <section aria-labelledby="prepare-title" className="swc-section bg-swc-paper">
        <div className="swc-wrap grid items-start gap-10 min-[1001px]:grid-cols-2 min-[1001px]:gap-14">
          <div>
            <SectionIntro
              id="prepare-title"
              eyebrow="Prepare your expression of interest"
              title="Help us understand the contribution you can make"
              intro="Provide sufficient information for SWCL to assess the relevance of your expertise and to identify a suitable instructor, author, reviewer or mentoring opportunity. You do not need to submit a completed course at this stage."
            />
            <h3 className="mt-8 mb-0 text-[0.95rem] font-bold">Information requested</h3>
            <ul className="m-0 mt-4 grid list-none gap-x-6 gap-y-3 p-0 min-[701px]:grid-cols-2">
              {REQUESTED.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[0.92rem] text-swc-ink-2">
                  <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-swc-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="swc-card p-7 shadow-[0_24px_48px_-36px_rgba(14,31,23,0.45)] md:p-9">
            <h3 className="swc-h3">What happens next</h3>
            <ol className="m-0 mt-6 flex list-none flex-col gap-5 p-0">
              {NEXT_STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="swc-num swc-num--round flex-none">{i + 1}</span>
                  <p className="m-0 pt-1 text-[0.92rem] text-swc-ink-2">{step}</p>
                </li>
              ))}
            </ol>
            <Button href={APPLY_HREF} className="mt-8 w-full min-[701px]:w-auto">
              Submit Expression of Interest
            </Button>
            <p className="m-0 mt-4 text-[0.82rem] text-swc-ink-3">
              Submitting an expression of interest does not guarantee selection or a commission.
            </p>
          </div>
        </div>
      </section>

      {/* 10 FAQ */}
      <section aria-labelledby="faq-title" className="swc-section bg-swc-white">
        <div className="swc-wrap max-w-[860px]">
          <SectionIntro
            id="faq-title"
            align="center"
            eyebrow="Frequently asked questions"
            title="What prospective contributors need to know"
          />
          <FaqList items={FAQS} className={cx("mt-12")} />
        </div>
      </section>

      {/* 11 Closing call to action */}
      <CtaBand
        title="Bring your experience to professional learning that matters."
        body="Share your area of expertise, preferred role and availability. SWCL will review the information and contact suitable contributors regarding the next stage."
        primary={{ href: APPLY_HREF, label: "Express Interest" }}
        secondary={{ href: "/contact", label: "Contact Us" }}
      />
    </>
  );
}
