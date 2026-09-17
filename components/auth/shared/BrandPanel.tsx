import Link from "next/link";

type AuthVariant = "login" | "register" | "forgot-password" | "reset-password";

const PANEL_CONFIG: Record<
  AuthVariant,
  {
    image: string;
    quote: string;
    label: string;
  }
> = {
  login: {
    image:
      "https://images.unsplash.com/photo-1560264280-88b68371db39?q=80&w=2070&auto=format&fit=crop",
    quote:
      "Strong communities are built by people who stay connected.",
    label: "Reconnect with your instructor workspace",
  },
  register: {
    image:
      "https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?q=80&w=2069&auto=format&fit=crop",
    quote:
      "Collaborate with other instructors building stronger social work practice across Nigeria.",
    label: "Join the instructor community",
  },
  "forgot-password": {
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop",
    quote:
      "Every setback is a setup for a comeback. We're here to get you back on track.",
    label: "Account recovery",
  },
  "reset-password": {
    image:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop",
    quote:
      "Security and trust are the foundation of every great professional relationship.",
    label: "Secure your account",
  },
};

export function BrandPanel({
  variant = "login",
  statsData,
}: {
  variant?: AuthVariant;
  statsData?: any;
}) {
  const config = PANEL_CONFIG[variant];

  const membersCount = statsData?.total_number_of_students || 120;
  const statesCount = statsData?.number_of_published_courses || 12;

  return (
    <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-shrink-0">
      <img
        src={config.image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.opacity = "0";
        }}
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(145deg, #0d2b1e 0%, #1a4d35 35%, #2D6A4F 65%, #52b788 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#071410]/90 via-[#071410]/40 to-[#071410]/20"
        aria-hidden="true"
      />
      <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">
        <Link
          href="/"
          className="flex items-center no-underline w-fit"
          aria-label="Social Work Nigeria home"
        >
          <img
            src="/images/logo/swc-dark-logo.png"
            alt="Social Work Nigeria Logo"
            width={151}
            height={40}
            className="w-[220px] h-auto object-contain px-2 py-1"
          />
        </Link>
        <div className="max-w-sm">
          <svg
            width="36"
            height="28"
            viewBox="0 0 36 28"
            fill="none"
            aria-hidden="true"
            className="mb-4 opacity-60"
          >
            <path
              d="M0 28V17.6C0 13.013 1.173 9.12 3.52 5.92 5.92 2.72 9.44.853 14.08 0L15.84 3.04C12.8 3.893 10.507 5.387 8.96 7.52 7.413 9.6 6.64 12 6.64 14.72h7.04V28H0zm20.16 0V17.6c0-4.587 1.173-8.48 3.52-11.68C26.08 2.72 29.6.853 34.24 0L36 3.04c-3.04.853-5.333 2.347-6.88 4.48C27.573 9.6 26.8 12 26.8 14.72h7.04V28H20.16z"
              fill="white"
            />
          </svg>

          <p className="text-white/60 text-[0.72rem] uppercase tracking-widest font-bold mb-3">
            {config.label}
          </p>

          <blockquote className="text-white text-[1.15rem] leading-relaxed font-medium mb-5">
            "{config.quote}"
          </blockquote>
          <div className="flex flex-wrap gap-2">
            {[
              `${membersCount.toLocaleString()}+ Members`,
              `${statesCount.toLocaleString()} States`,
              "Live Community",
            ].map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white text-[0.72rem] font-semibold"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#52b788]"
                  aria-hidden="true"
                />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileBrandLogo() {
  return (
    <div className="flex lg:hidden items-center mb-10">
      <Link href="/" aria-label="Social Work Nigeria home">
        <img
          src="/images/logo/swc-dark-logo.png"
          alt="Social Work Nigeria Logo"
          width={151}
          height={40}
          className="w-[200px] h-auto object-contain dark:px-0 dark:py-1"
        />
      </Link>
    </div>
  );
}
