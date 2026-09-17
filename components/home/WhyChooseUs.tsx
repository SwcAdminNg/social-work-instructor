const features = [
  {
    id: "focused-dashboard",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M18 10L4 17l14 7 14-7-14-7z"
          fill="#2D6A4F"
          fillOpacity="0.18"
          stroke="#2D6A4F"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M8 19.5V26c0 0 3.5 3 10 3s10-3 10-3v-6.5"
          stroke="#2D6A4F"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="32"
          y1="17"
          x2="32"
          y2="24"
          stroke="#2D6A4F"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="32" cy="25.5" r="1.5" fill="#2D6A4F" />
      </svg>
    ),
    title: "Focused Dashboard",
    description:
      "A clean instructor dashboard with only the essentials: profile settings and community access.",
  },
  {
    id: "profile-settings",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M18 3l2.47 4.58L26 5.73l-1.03 5.59L30 14.5l-4.53 3.1.53 5.65-5.3-2.05L18 25.5l-2.7-4.3-5.3 2.05.53-5.65L6 14.5l5.03-3.18L10 5.73l5.53 1.85z"
          fill="#2D6A4F"
          fillOpacity="0.18"
          stroke="#2D6A4F"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M13 18l3.5 3.5L23 14"
          stroke="#2D6A4F"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "Profile Settings",
    description:
      "Keep your instructor identity current with editable personal details, username, and profile photo.",
  },
  {
    id: "nigerian-context",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="18"
          cy="18"
          r="10"
          fill="#2D6A4F"
          fillOpacity="0.18"
          stroke="#2D6A4F"
          strokeWidth="1.8"
        />
        <ellipse
          cx="18"
          cy="18"
          rx="4.5"
          ry="10"
          stroke="#2D6A4F"
          strokeWidth="1.8"
          fill="none"
        />
        <line
          x1="8"
          y1="18"
          x2="28"
          y2="18"
          stroke="#2D6A4F"
          strokeWidth="1.8"
        />
      </svg>
    ),
    title: "Locally Relevant, Globally Informed",
    description:
      "A professional workspace grounded in Nigerian social work realities and instructor collaboration.",
  },
  {
    id: "community",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="14"
          cy="12"
          r="4"
          fill="#2D6A4F"
          fillOpacity="0.18"
          stroke="#2D6A4F"
          strokeWidth="1.8"
        />
        <path
          d="M6 28c0-4.418 3.582-8 8-8"
          stroke="#2D6A4F"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle
          cx="24"
          cy="12"
          r="3"
          stroke="#2D6A4F"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M19 28c0-3.866 2.239-7 5-7s5 3.134 5 7"
          stroke="#2D6A4F"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
    title: "Community",
    description:
      "Chat with colleagues in live community rooms with members, presence, replies, and attachments.",
  },
];

export default function WhyChooseUs() {
  return (
    <section
      className="relative overflow-hidden bg-white dark:bg-[#0a0a0a] py-20 px-6"
      aria-labelledby="why-heading"
    >
      {/* Decorative circle — bottom left */}
      <div
        className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full border-2 border-gray-200 dark:border-gray-800 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16 items-start">
        {/* Left — heading block */}
        <div className="lg:sticky lg:top-24">
          <h2
            id="why-heading"
            className="text-[2rem] sm:text-[2.4rem] lg:text-[2.6rem] font-extrabold leading-[1.2] text-gray-900 dark:text-gray-50 tracking-tight mb-5"
          >
            Your Instructor Platform
          </h2>
          <p className="text-[0.95rem] text-gray-500 dark:text-gray-400 leading-relaxed">
            A focused instructor workspace for profile management and
            community collaboration.
          </p>
        </div>

        {/* Right — feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-x-10 sm:gap-y-10">
          {features.map((feature) => (
            <article
              key={feature.id}
              className="flex flex-col gap-3"
              aria-labelledby={`${feature.id}-title`}
            >
              {/* Icon wrapper */}
              <div className="w-12 h-12 flex items-center justify-center bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20 rounded-xl flex-shrink-0">
                {feature.icon}
              </div>
              <h3
                id={`${feature.id}-title`}
                className="text-[1rem] font-bold text-[#2D6A4F] tracking-tight leading-snug"
              >
                {feature.title}
              </h3>
              <p className="text-[0.875rem] text-gray-500 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
