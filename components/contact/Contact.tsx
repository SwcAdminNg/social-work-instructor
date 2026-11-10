import Link from "next/link";
import { ArrowUpRight, Clock, HelpCircle, Mail, MapPin, Phone } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import { Btn, Contours, Eyebrow, type Vars } from "@/components/site/ui";
import { photos } from "@/lib/photos";
import ContactForm from "./ContactForm";
import TopicButton from "./TopicButton";

const linkRow =
  "group flex w-full cursor-pointer items-center justify-between gap-4 border-0 border-b border-line bg-transparent py-4 text-left text-ink no-underline last:border-b-0";

function LinkRowBody({ title, hint }: { title: string; hint: string }) {
  return (
    <>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-ink-3">{hint}</span>
      </span>
      <span
        aria-hidden="true"
        className="grid h-10 w-10 flex-none place-items-center rounded-full border border-line text-ink-2 transition-all duration-500 ease-sw group-hover:rotate-45 group-hover:border-gold group-hover:bg-gold group-hover:text-[#10231a]"
      >
        <ArrowUpRight size={17} />
      </span>
    </>
  );
}

export default function Contact({ initialTopic }: { initialTopic?: string }) {
  return (
    <div>
      <PageHero
        id="contact-heading"
        eyebrow="Contact us"
        title="How can we *help?*"
        lead="Ask about becoming an instructor, building or reviewing a course, your instructor account, or working with Social Work Consultancy Ltd. Choose a topic and tell us how we can help."
        photo={photos.pointing}
        position="40% 40%"
        compact
      >
        <Btn href="#send-message" variant="gold">Send a message</Btn>
        <Btn href="/faq" variant="ghost">Read the FAQ</Btn>
      </PageHero>

      <section className="sw-sheet bg-paper pb-24 pt-16 md:pb-32 md:pt-24" aria-label="Contact details and enquiry form">
        <div className="sw-wrap grid items-start gap-6 lg:grid-cols-[5fr_8fr] lg:gap-8">
          <div className="grid gap-6 lg:sticky lg:top-28">
            {/* Contact details */}
            <aside
              aria-labelledby="details-heading"
              data-reveal
              data-progress="view"
              className="sw-on-dark sw-grain relative overflow-hidden rounded-[32px] bg-forest p-7 md:p-9"
            >
              <Contours className="text-leaf" />
              <div className="relative">
                <Eyebrow className="text-gold-light">Reach us directly</Eyebrow>
                <h2 id="details-heading" className="sw-display m-0 mt-4 text-[2rem] text-[#fffdf4]">
                  Contact SWCL
                </h2>
                <ul className="m-0 mt-7 grid list-none gap-2 p-0">
                  <li>
                    <a
                      href="mailto:support@socialworknigeria.org"
                      className="group -mx-3 flex items-center gap-4 rounded-2xl p-3 text-white no-underline transition-colors duration-300 hover:bg-white/[0.07]"
                    >
                      <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-gold text-[#10231a]">
                        <Mail size={20} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="sw-cap block text-white/55">Email</span>
                        <span className="block break-words text-[1.02rem] group-hover:text-gold-light">support@socialworknigeria.org</span>
                      </span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="tel:+2348034471063"
                      className="group -mx-3 flex items-center gap-4 rounded-2xl p-3 text-white no-underline transition-colors duration-300 hover:bg-white/[0.07]"
                    >
                      <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-gold text-[#10231a]">
                        <Phone size={20} aria-hidden="true" />
                      </span>
                      <span>
                        <span className="sw-cap block text-white/55">Phone</span>
                        <span className="block text-[1.02rem] group-hover:text-gold-light">+234 803 447 1063</span>
                      </span>
                    </a>
                  </li>
                  <li className="-mx-3 flex items-center gap-4 p-3">
                    <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-white/10 text-gold-light">
                      <MapPin size={20} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="sw-cap block text-white/55">Location</span>
                      <span className="block text-[1.02rem]">Jos, Plateau State, Nigeria</span>
                    </span>
                  </li>
                  <li className="-mx-3 flex items-center gap-4 p-3">
                    <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-white/10 text-gold-light">
                      <Clock size={20} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="sw-cap block text-white/55">Replies</span>
                      <span className="block text-[1.02rem]">By email, to the address you give us</span>
                    </span>
                  </li>
                </ul>
              </div>
            </aside>

            {/* Quick links */}
            <nav
              aria-labelledby="links-heading"
              data-reveal
              style={{ "--d": "0.1s" } as Vars}
              className="rounded-[32px] border border-line bg-card p-7 md:p-9"
            >
              <h2 id="links-heading" className="sw-title m-0 mb-2 text-xl text-ink">Useful links</h2>
              <ul className="m-0 list-none p-0">
                <li>
                  <Link href="/register" className={linkRow}>
                    <LinkRowBody title="Apply to teach" hint="Send your details and CV" />
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className={linkRow}>
                    <LinkRowBody title="How it works" hint="From application to a published course" />
                  </Link>
                </li>
                <li>
                  <TopicButton topic="account" className={`${linkRow} font-[inherit]`}>
                    <LinkRowBody title="Instructor account support" hint="Start a support message in the form" />
                  </TopicButton>
                </li>
              </ul>
            </nav>
          </div>

          {/* Enquiry form */}
          <section
            aria-labelledby="form-heading"
            id="send-message"
            data-reveal
            style={{ "--d": "0.15s", scrollMarginTop: 110 } as Vars}
            className={`rounded-[32px] border border-line bg-card p-6 shadow-[0_30px_70px_-50px_rgba(14,31,23,0.45)] sm:p-9 md:rounded-[40px] md:p-12`}
          >
            <Eyebrow className="text-accent">Enquiry form</Eyebrow>
            <h2 id="form-heading" className="sw-display m-0 mt-4 text-[clamp(1.9rem,3.2vw,2.7rem)] text-ink">
              Send us a <em className="sw-em text-clay-ink">message</em>
            </h2>
            <p className="m-0 mt-3 text-ink-2">Choose a topic, tell us what you need and we will reply by email.</p>
            <ContactForm initialTopic={initialTopic} />
          </section>
        </div>

        {/* Quick answers */}
        <div className="sw-wrap mt-6 lg:mt-8">
          <div
            data-reveal
            className="relative flex flex-col gap-6 overflow-hidden rounded-[32px] bg-gold p-7 text-[#10231a] md:flex-row md:items-center md:justify-between md:p-10"
          >
            <div className="flex items-center gap-5">
              <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-[#10231a] text-gold-light">
                <HelpCircle size={26} aria-hidden="true" />
              </span>
              <div>
                <h2 id="faq-heading" className="sw-display m-0 text-[clamp(1.5rem,2.6vw,2.1rem)]">Looking for a quick answer?</h2>
                <p className="m-0 mt-1 text-[#10231a]/80">Applying, building courses, reviews and your instructor account.</p>
              </div>
            </div>
            <Btn href="/faq" className="self-start md:self-auto">View our FAQs</Btn>
          </div>
        </div>
      </section>

      {/* Where we are */}
      <section className="sw-sheet bg-paper-2 pb-24 pt-16 md:pb-32 md:pt-24" aria-labelledby="where-heading">
        <div className="sw-wrap grid items-center gap-x-14 gap-y-10 lg:grid-cols-2">
          <div
            data-reveal
            data-progress="view"
            className="sw-on-dark sw-grain relative flex aspect-[3/2] w-full flex-col justify-between overflow-hidden rounded-[32px] bg-forest p-8 md:rounded-[44px] md:p-10"
          >
            <Contours className="text-leaf opacity-25" />
            <span className="sw-chip relative self-start bg-white/10 text-white backdrop-blur">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-gold" />
              9.9°N, 8.9°E
            </span>
            <p className="relative m-0">
              <span className="sw-em block text-[clamp(4.5rem,11vw,9rem)] leading-[0.8] text-gold-light">Jos</span>
              <span className="sw-cap mt-4 block text-white/70">Plateau State, Nigeria</span>
            </p>
          </div>
          <div>
            <div data-reveal>
              <Eyebrow className="text-accent">Where we are</Eyebrow>
            </div>
            <h2 id="where-heading" data-reveal className="sw-display m-0 mt-5 text-[clamp(2rem,3.8vw,3.2rem)] text-ink">
              Based in Jos, teaching <em className="sw-em text-clay-ink">everywhere</em>
            </h2>
            <p data-reveal className="sw-lead m-0 mt-5 max-w-lg text-ink-2">
              Social Work Consultancy Ltd is based in Jos, Plateau State. The platform is online, so you can build and teach
              your course from wherever you practise, in Nigeria and beyond.
            </p>
            <address data-reveal className="mt-7 not-italic text-ink">
              <span className="sw-cap block text-ink-3">Address</span>
              <span className="mt-1 block text-lg">Flat C3, Okonkwo Estate, Jos, Plateau State.</span>
            </address>
          </div>
        </div>
      </section>
    </div>
  );
}
