"use client";

export function AboutIntro() {
  return (
    <section className="py-20 md:py-32 px-6 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
        {/* Image Column */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <div className="relative aspect-[4/5] overflow-hidden shadow-2xl">
            <img
              src="/images/about-us/about-us.webp"
              alt="Social Work Professionals"
              className="w-full h-full object-cover object-center"
            />
            {/* Dark gradient overlay for a premium look */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent mix-blend-multiply" />
          </div>
          {/* Decorative Elements */}
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#2D6A4F] rounded-full -z-10 blur-2xl opacity-40" />
          <div className="absolute -top-6 -left-6 w-32 h-32 bg-amber-500 rounded-full -z-10 blur-2xl opacity-20" />
        </div>

        {/* Text Column */}
        <div className="w-full lg:w-1/2">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight leading-tight">
            About Social Work Nigeria
          </h2>

          <div className="space-y-6 text-lg text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
            <p>
              Social Work Nigeria serves as a professional learning and
              development platform dedicated to enhancing ethical, skilled, and
              culturally relevant social work practice throughout Nigeria and
              the Global South.
            </p>
            <p>
              We offer CPD-accredited courses, mentorship, and hands-on training
              for social workers, students, caregivers, educators, and
              organisations involved with children, families, and vulnerable
              groups.
            </p>
            <p>
              Our work is rooted in social justice, human rights, safeguarding,
              and evidence-based practice, connecting local realities with
              global standards.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
