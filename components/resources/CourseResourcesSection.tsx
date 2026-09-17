import { ResourceCard } from "@/components/resources/ResourceCard";
import { getCourseResources } from "@/lib/resources";
import Link from "next/link";

export async function CourseResourcesSection({ courseId }: { courseId: string }) {
  const { items, ok } = await getCourseResources(courseId, { pageSize: 3 });

  if (!ok || items.length === 0) return null;

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Resources
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-gray-600 dark:text-gray-400">
            Supplementary templates, readings, and reference material attached to this course.
          </p>
        </div>
        <Link
          href={`/resources?course_id=${courseId}`}
          className="inline-flex h-10 items-center justify-center rounded-md border border-[#b7e4c7] px-4 text-sm font-extrabold text-[#2D6A4F] transition hover:bg-[#f0fbf5] dark:border-[#27433a] dark:text-[#b7e4c7] dark:hover:bg-[#183026]"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </section>
  );
}
