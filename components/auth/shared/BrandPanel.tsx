import Image from "next/image";
import Link from "next/link";
import { Contours, Heading, Photo, type Vars } from "@/components/site/ui";
import { photos, type Photo as PhotoData } from "@/lib/photos";

type AuthVariant = "login" | "register" | "forgot-password" | "reset-password";

type HomeStats = { total_number_of_students?: number; number_of_published_courses?: number } | null | undefined;

// `focus` keeps the person in frame when the photo fills a tall panel.
// Wrap a phrase of the title in *asterisks* to set it in the accent serif.
const PANEL: Record<AuthVariant, { photo: PhotoData; focus: string; eyebrow: string; title: string; body: string }> = {
  login: {
    photo: photos.presenting,
    focus: "62% 40%",
    eyebrow: "Instructor sign in",
    title: "Your courses are *waiting.*",
    body: "Pick up your drafts, mark submitted essays and see where each course is in review.",
  },
  register: {
    photo: photos.lectureMic,
    focus: "40% 35%",
    eyebrow: "Become an instructor",
    title: "Teach what you know from *practice.*",
    body: "Apply with your details and CV. If approved, you will receive an email link to set up your instructor account.",
  },
  "forgot-password": {
    photo: photos.writingNotes,
    focus: "50% 35%",
    eyebrow: "Account recovery",
    title: "We will help you get *back in.*",
    body: "Enter the email on your instructor account and we will send you a secure link to choose a new password.",
  },
  "reset-password": {
    photo: photos.tabletHijab,
    focus: "50% 25%",
    eyebrow: "Secure your account",
    title: "Choose a strong *new password.*",
    body: "Use at least 8 characters. A longer passphrase is easier to remember and harder to guess.",
  },
};

export function BrandPanel({ variant = "login", statsData }: { variant?: AuthVariant; statsData?: HomeStats }) {
  const panel = PANEL[variant];
  // Only real figures from the API; nothing is shown when they are unavailable.
  const stats = [
    statsData?.total_number_of_students ? `${statsData.total_number_of_students.toLocaleString()} learners` : null,
    statsData?.number_of_published_courses
      ? `${statsData.number_of_published_courses.toLocaleString()} ${statsData.number_of_published_courses === 1 ? "course" : "courses"}`
      : null,
  ].filter(Boolean) as string[];

  return (
    <aside
      className="sw-on-dark sticky top-0 hidden h-[100dvh] flex-shrink-0 p-3 lg:flex lg:w-[50%] xl:w-[52%]"
      aria-label="About the instructor platform"
    >
      <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-forest" data-progress="view">
        <div className="absolute inset-0" data-reveal="fade">
          <Photo
            photo={panel.photo}
            priority
            parallax={false}
            place={false}
            sizes="(min-width: 1024px) 160vh, 1px"
            position={panel.focus}
            className="h-full w-full"
          />
        </div>
        {/* Shade only behind the logo and the text, so the photo itself stays clear. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-40"
          style={{ background: "linear-gradient(180deg, rgba(4,18,11,0.6), rgba(4,18,11,0))" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[62%]"
          style={{ background: "linear-gradient(0deg, rgba(4,18,11,0.94) 0%, rgba(4,18,11,0.72) 45%, rgba(4,18,11,0) 100%)" }}
        />
        <Contours className="text-leaf opacity-[0.12]" />

        <div className="relative z-10 flex h-full w-full flex-col justify-between p-9 xl:p-12">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="w-fit rounded-md" aria-label="Social Work Consultancy Ltd home">
              <Image src="/images/logo/swc-logo-on-dark.webp" alt="" width={480} height={133} className="h-auto w-[172px]" priority />
            </Link>
            {panel.photo.place && (
              <span className="sw-chip sw-cap bg-night/50 text-white backdrop-blur-md">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold" />
                {panel.photo.place}
              </span>
            )}
          </div>

          <div className="max-w-lg">
            <p data-reveal className="sw-eyebrow m-0 text-gold-light">{panel.eyebrow}</p>
            <Heading
              as="p"
              text={panel.title}
              accent="text-gold-light"
              delay={0.45}
              className="sw-display m-0 mt-5 text-[clamp(2.3rem,3.6vw,3.6rem)] text-[#fffdf4]"
            />
            <p data-reveal style={{ "--d": "0.8s" } as Vars} className="m-0 mt-5 max-w-md text-[1.02rem] leading-relaxed text-white/80">
              {panel.body}
            </p>
            {stats.length > 0 && (
              <ul data-reveal style={{ "--d": "0.9s" } as Vars} className="m-0 mt-7 flex list-none flex-wrap gap-2 p-0" aria-label="Platform at a glance">
                {stats.map((stat) => (
                  <li key={stat} className="sw-chip border border-white/15 bg-white/10 text-white backdrop-blur-sm">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-leaf" />
                    {stat}
                  </li>
                ))}
              </ul>
            )}
            <p className="m-0 mt-8 text-[0.72rem] text-white/50">Photo: {panel.photo.by}, Unsplash</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/** Logo above the form on phones and tablets, in the colour that suits the theme. */
export function MobileBrandLogo() {
  return (
    <div className="mb-8 flex items-center lg:hidden">
      <Link href="/" className="rounded-md" aria-label="Social Work Consultancy Ltd home">
        <Image src="/images/logo/swc-logo-on-light.webp" alt="" width={480} height={133} className="h-auto w-[170px] dark:hidden" priority />
        <Image src="/images/logo/swc-logo-on-dark.webp" alt="" width={480} height={133} className="hidden h-auto w-[170px] dark:block" priority />
      </Link>
    </div>
  );
}
