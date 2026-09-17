import * as Icons from "lucide-react";
import Link from "next/link";

interface Catalog {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
  description: string;
  total_courses: number;
}

function DynamicIcon({ name }: { name: string }) {
  // Try to find the exact icon from lucide-react, fallback to BookOpen if not found
  const IconComponent = (Icons as any)[name] || Icons.BookOpen;
  return <IconComponent className="w-7 h-7 text-[#2D6A4F]" strokeWidth={1.8} />;
}

export default function CourseCategories({
  catalogs = [],
}: {
  catalogs?: Catalog[];
}) {
  return (
    <section
      className="relative overflow-hidden bg-[#f0f5f2] dark:bg-[#0d1210] py-20 px-6"
      aria-labelledby="categories-heading"
      id="courses"
    >
      {/* Decorative circle — top right (mirrors WhyChooseUs bottom-left circle) */}
      <div
        className="absolute -top-16 -right-16 w-72 h-72 rounded-full border border-[#2D6A4F]/20 dark:border-[#2D6A4F]/15 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -top-6 -right-6 w-48 h-48 rounded-full border border-[#2D6A4F]/10 dark:border-[#2D6A4F]/10 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#2D6A4F] mb-3">
            What We Offer
          </p>
          <h2
            id="categories-heading"
            className="text-[2rem] sm:text-[2.4rem] font-extrabold leading-[1.2] text-gray-900 dark:text-gray-50 tracking-tight mb-4"
          >
            Explore Our Course Categories
          </h2>
          <p className="text-[0.95rem] text-gray-500 dark:text-gray-400 leading-relaxed">
            From safeguarding to digital tools, mental health to policy advocacy
            — find courses that match your professional development needs.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {catalogs.map((cat) => (
            <Link
              key={cat.id}
              href={`/courses?catalog=${cat.slug}`}
              className="group relative flex flex-col gap-4 bg-white dark:bg-[#111a14] border border-gray-200/80 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-[#2D6A4F]/40 dark:hover:border-[#2D6A4F]/50 transition-all duration-200 no-underline"
              aria-labelledby={`${cat.id}-title`}
            >
              {/* Icon */}
              <div className="w-14 h-14 flex items-center justify-center bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20 rounded-xl flex-shrink-0 group-hover:bg-[#2D6A4F]/15 dark:group-hover:bg-[#2D6A4F]/30 transition-colors duration-200">
                <DynamicIcon name={cat.icon_name} />
              </div>

              {/* Text */}
              <div className="flex flex-col gap-2 flex-1">
                <h3
                  id={`${cat.id}-title`}
                  className="text-[1rem] font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-snug group-hover:text-[#2D6A4F] dark:group-hover:text-[#52b788] transition-colors duration-150"
                >
                  {cat.name}
                </h3>
                <p className="text-[0.875rem] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
                  {cat.description}
                </p>
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs font-semibold text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20 px-2.5 py-1 rounded-full">
                  {cat.total_courses === 1 ? "1 course" : `${cat.total_courses} courses`}
                </span>
                {/* Arrow */}
                <span
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-[#2D6A4F] transition-colors duration-200"
                  aria-hidden="true"
                >
                  <Icons.ChevronRight
                    className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors duration-200"
                    strokeWidth={2}
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-6 py-[0.7rem] bg-[#2D6A4F] text-white text-[0.95rem] font-semibold rounded-full no-underline shadow-md shadow-green-900/20 hover:bg-[#1e4d38] hover:-translate-y-0.5 transition-all duration-150"
          >
            Browse All Courses
            <Icons.ChevronRight className="w-4 h-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
