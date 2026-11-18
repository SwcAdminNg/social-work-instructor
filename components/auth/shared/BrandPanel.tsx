import Image from "next/image";
import Link from "next/link";
import { photos, type Photo as PhotoData } from "@/lib/photos";

export type AuthVariant = "login" | "register" | "forgot-password" | "reset-password";

export type HomeStats = { total_number_of_students?: number; number_of_published_courses?: number } | null | undefined;

// `focus` keeps the person in frame when the photo is cropped.
const PANEL: Record<AuthVariant, { photo: PhotoData; focus: string; eyebrow: string; title: string; body: string }> = {
  login: {
    photo: photos.presenting,
    focus: "62% 40%",
    eyebrow: "Instructor sign in",
    title: "Your courses are waiting.",
    body: "Pick up your drafts, mark submitted essays and see where each course is in review.",
  },
  register: {
    photo: photos.lectureMic,
    focus: "40% 35%",
    eyebrow: "Teach with SWCL",
    title: "Share what you know from practice.",
    body: "Apply with your details and CV. If approved, you will receive an email link to set up your instructor account.",
  },
  "forgot-password": {
    photo: photos.writingNotes,
    focus: "50% 35%",
    eyebrow: "Account recovery",
    title: "We will help you get back in.",
    body: "Enter the email on your instructor account and we will send you a secure link to choose a new password.",
  },
  "reset-password": {
    photo: photos.tabletHijab,
    focus: "50% 25%",
    eyebrow: "Secure your account",
    title: "Choose a strong new password.",
    body: "Use at least 8 characters. A longer passphrase is easier to remember and harder to guess.",
  },
};

export function panelFor(variant: AuthVariant) {
  return PANEL[variant];
}

/** Deep green side panel on wide screens, mirroring the Home hero. */
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
      aria-label="About the instructor platform"
      className="swc-dark sticky top-0 hidden h-[100dvh] flex-col bg-swc-hero text-white min-[1001px]:flex"
    >
      <div className="px-12 pb-10 pt-8 xl:px-16">
        <Link href="/" className="inline-block rounded">
          <Image
            src="/images/logo/swc-logo-on-dark.webp"
            alt="Social Work Consultancy Ltd"
            width={480}
            height={133}
            priority
            className="h-auto w-[150px]"
          />
        </Link>
        <p className="swc-eyebrow mt-12">{panel.eyebrow}</p>
        <p className="mt-5 max-w-[520px] text-[clamp(2.25rem,3.4vw,3.25rem)] font-bold leading-[1.06] tracking-[-0.02em] text-white">
          {panel.title}
        </p>
        <p className="swc-lead mt-5 max-w-[480px]">{panel.body}</p>
        {stats.length > 0 && (
          <ul aria-label="Platform at a glance" className="m-0 mt-7 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
            {stats.map((stat) => (
              <li key={stat} className="flex items-center gap-2 text-[0.92rem] font-semibold text-white/90">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-swc-gold" />
                {stat}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="relative mx-12 mb-12 min-h-[220px] flex-1 overflow-hidden rounded-lg xl:mx-16">
        <Image
          src={panel.photo.src}
          alt={panel.photo.alt}
          fill
          priority
          sizes="(min-width: 1001px) 45vw, 1px"
          className="object-cover"
          style={{ objectPosition: panel.focus }}
        />
      </div>
    </aside>
  );
}
