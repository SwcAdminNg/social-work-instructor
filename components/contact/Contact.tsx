import Link from "next/link";
import { ArrowRight, Clock, HelpCircle, Mail, MapPin, Phone } from "lucide-react";
import { Button, CtaBand, Eyebrow, IconTile, PageHero } from "@/components/swcl/ui";
import { photos } from "@/lib/photos";
import ContactForm from "./ContactForm";
import TopicButton from "./TopicButton";

const linkRow =
  "group flex w-full cursor-pointer items-center justify-between gap-4 border-0 border-b border-swc-line bg-transparent py-4 text-left font-[inherit] text-swc-ink no-underline";

function LinkRowBody({ title, hint }: { title: string; hint: string }) {
  return (
    <>
      <span>
        <span className="block font-semibold group-hover:underline">{title}</span>
        <span className="block text-[0.88rem] text-swc-ink-3">{hint}</span>
      </span>
      <ArrowRight aria-hidden="true" className="h-[18px] w-[18px] flex-none text-swc-label" />
    </>
  );
}

const DETAIL_ICON = "grid h-11 w-11 flex-none place-items-center rounded-lg";

export default function Contact({ initialTopic }: { initialTopic?: string }) {
  return (
    <>
      <PageHero
        id="contact-heading"
        eyebrow="Contact us"
        title="How can we help?"
        lead="Ask about becoming an instructor, building or reviewing a course, your instructor account, or working with Social Work Consultancy Ltd. Choose a topic and tell us how we can help."
        image={photos.pointing}
        position="40% 40%"
        compact
      >
        <Button href="#send-message">Send a Message</Button>
        <Button href="/faq" variant="outline-light">
          Read the FAQ
        </Button>
      </PageHero>

      <section aria-label="Contact details and enquiry form" className="swc-section bg-swc-paper">
        <div className="swc-wrap grid items-start gap-6 min-[1001px]:grid-cols-[5fr_8fr] min-[1001px]:gap-8">
          <div className="grid gap-6 min-[1001px]:sticky min-[1001px]:top-28">
            {/* Contact details */}
            <aside aria-labelledby="details-heading" className="swc-dark rounded-lg bg-swc-deep p-7 text-white md:p-9">
              <Eyebrow>Reach us directly</Eyebrow>
              <h2 id="details-heading" className="swc-h3 mt-4 text-white">
                Contact SWCL
              </h2>
              <ul className="m-0 mt-6 grid list-none gap-4 p-0">
                <li>
                  <a href="mailto:support@socialworknigeria.org" className="group flex items-center gap-4 text-white no-underline">
                    <span className={`${DETAIL_ICON} bg-swc-gold text-swc-forest`}>
                      <Mail className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.75rem] font-bold uppercase tracking-[0.12em] text-white/70">Email</span>
                      <span className="block break-words group-hover:underline">support@socialworknigeria.org</span>
                    </span>
                  </a>
                </li>
                <li>
                  <a href="tel:+2348034471063" className="group flex items-center gap-4 text-white no-underline">
                    <span className={`${DETAIL_ICON} bg-swc-gold text-swc-forest`}>
                      <Phone className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-[0.75rem] font-bold uppercase tracking-[0.12em] text-white/70">Phone</span>
                      <span className="block group-hover:underline">+234 803 447 1063</span>
                    </span>
                  </a>
                </li>
                <li className="flex items-center gap-4">
                  <span className={`${DETAIL_ICON} bg-white/10 text-swc-gold-light`}>
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[0.75rem] font-bold uppercase tracking-[0.12em] text-white/70">Location</span>
                    <span className="block">Jos, Plateau State, Nigeria</span>
                  </span>
                </li>
                <li className="flex items-center gap-4">
                  <span className={`${DETAIL_ICON} bg-white/10 text-swc-gold-light`}>
                    <Clock className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[0.75rem] font-bold uppercase tracking-[0.12em] text-white/70">Replies</span>
                    <span className="block">By email, to the address you give us</span>
                  </span>
                </li>
              </ul>
            </aside>

            {/* Quick links */}
            <nav aria-labelledby="links-heading" className="swc-card p-7 md:p-9">
              <h2 id="links-heading" className="swc-h4 mb-1">
                Useful links
              </h2>
              <ul className="m-0 list-none p-0 [&>li:last-child>*]:border-b-0">
                <li>
                  <Link href="/register" className={linkRow}>
                    <LinkRowBody title="Express interest" hint="Send your details and CV" />
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className={linkRow}>
                    <LinkRowBody title="How it works" hint="From application to a published course" />
                  </Link>
                </li>
                <li>
                  <TopicButton topic="account" className={linkRow}>
                    <LinkRowBody title="Instructor account support" hint="Start a support message in the form" />
                  </TopicButton>
                </li>
              </ul>
            </nav>
          </div>

          {/* Enquiry form */}
          <section
            id="send-message"
            aria-labelledby="form-heading"
            className="swc-card p-6 shadow-[0_24px_48px_-36px_rgba(14,31,23,0.45)] min-[701px]:p-9 md:p-11"
          >
            <Eyebrow>Enquiry form</Eyebrow>
            <h2 id="form-heading" className="swc-h2 mt-4">
              Send us a message
            </h2>
            <p className="m-0 mt-3 text-swc-ink-2">Choose a topic, tell us what you need and we will reply by email.</p>
            <ContactForm initialTopic={initialTopic} />
          </section>
        </div>
      </section>

      {/* Quick answers */}
      <section aria-labelledby="quick-answers-heading" className="bg-swc-white py-14 md:py-16">
        <div className="swc-wrap">
          <div className="swc-card swc-card--accent flex flex-col gap-6 p-7 md:flex-row md:items-center md:justify-between md:p-10">
            <div className="flex items-center gap-5">
              <IconTile className="flex-none">
                <HelpCircle className="h-5 w-5" strokeWidth={1.8} />
              </IconTile>
              <div>
                <h2 id="quick-answers-heading" className="swc-h3">
                  Looking for a quick answer?
                </h2>
                <p className="m-0 mt-1 text-swc-ink-2">Applying, building courses, reviews and your instructor account.</p>
              </div>
            </div>
            <Button href="/faq" variant="green" className="self-start md:self-auto">
              View our FAQs
            </Button>
          </div>
        </div>
      </section>

      {/* Where we are */}
      <section aria-labelledby="where-heading" className="swc-section bg-swc-mint">
        <div className="swc-wrap grid items-center gap-10 min-[1001px]:grid-cols-2 min-[1001px]:gap-14">
          <div className="swc-dark flex aspect-[3/2] w-full flex-col justify-between rounded-lg bg-swc-deep p-8 text-white md:p-10">
            <span className="inline-flex items-center gap-2 self-start rounded-md bg-white/10 px-3 py-1.5 text-[0.85rem]">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-swc-gold" />
              9.9°N, 8.9°E
            </span>
            <p className="m-0">
              <span className="block text-[clamp(4rem,10vw,7.5rem)] font-bold leading-[0.85] tracking-[-0.03em] text-swc-gold-light">
                Jos
              </span>
              <span className="mt-4 block text-[0.8rem] font-bold uppercase tracking-[0.14em] text-white/75">
                Plateau State, Nigeria
              </span>
            </p>
          </div>
          <div>
            <Eyebrow>Where we are</Eyebrow>
            <h2 id="where-heading" className="swc-h2 mt-4">
              Based in Jos, teaching everywhere
            </h2>
            <p className="swc-lead mt-5 max-w-[560px]">
              Social Work Consultancy Ltd is based in Jos, Plateau State. The platform is online, so you can build and
              teach your course from wherever you practise, in Nigeria and beyond.
            </p>
            <address className="mt-7 not-italic text-swc-ink">
              <span className="block text-[0.75rem] font-bold uppercase tracking-[0.12em] text-swc-ink-3">Address</span>
              <span className="mt-1 block text-[1.05rem]">Flat C3, Okonkwo Estate, Jos, Plateau State.</span>
            </address>
          </div>
        </div>
      </section>

      <CtaBand
        id="contact-closing-heading"
        title="Ready to share your expertise?"
        body="Express your interest in teaching with SWCL, or browse answers to the questions we hear most often."
        primary={{ href: "/register", label: "Express Interest" }}
        secondary={{ href: "/faq", label: "Read the FAQ" }}
      />
    </>
  );
}
