import { ResourceRead, formatResourceCategory, getResourceCta } from "@/lib/resources";
import { FileText, Link2, Lock, PlayCircle, Unlock } from "lucide-react";
import Link from "next/link";

export function ResourceCard({ resource }: { resource: ResourceRead }) {
  const href = `/resources/${resource.slug || resource.id}`;
  const isLocked = resource.can_access === false;

  return (
    <article className="group flex min-h-[340px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#95d5b2] hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
      <Link href={href} className="relative block aspect-[16/9] overflow-hidden bg-[#e7f6ee] dark:bg-slate-900">
        {resource.thumbnail_url ? (
          <img
            src={resource.thumbnail_url}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#2D6A4F] dark:text-[#b7e4c7]">
            {getResourceIcon(resource.category)}
          </div>
        )}
        {isLocked && (
          <span className="absolute right-3 top-3 inline-flex h-9 items-center gap-2 rounded-md bg-slate-950/80 px-3 text-xs font-extrabold text-white backdrop-blur">
            <Lock className="h-4 w-4" />
            Locked
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[#e7f6ee] px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-wide text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
            {formatResourceCategory(resource.category)}
          </span>
          {resource.visibility && (
            <span className="rounded-md border border-slate-200 px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {formatVisibility(resource.visibility)}
            </span>
          )}
        </div>

        <h2 className="line-clamp-2 text-xl font-extrabold leading-6 text-slate-950 dark:text-white">
          <Link href={href}>{resource.name}</Link>
        </h2>
        {resource.description && (
          <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
            {resource.description}
          </p>
        )}

        <div className="mt-auto pt-6">
          <Link
            href={href}
            className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-extrabold transition ${
              isLocked
                ? "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                : "bg-[#2D6A4F] text-white shadow-sm shadow-[#2D6A4F]/20 hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
            }`}
          >
            {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            {getResourceCta(resource)}
          </Link>
        </div>
      </div>
    </article>
  );
}

function getResourceIcon(category?: string) {
  if (category === "VIDEOS_AND_WEBINARS") return <PlayCircle className="h-14 w-14" />;
  if (category === "USEFUL_LINKS") return <Link2 className="h-14 w-14" />;
  return <FileText className="h-14 w-14" />;
}

function formatVisibility(visibility: string) {
  if (visibility === "PUBLIC") return "Public";
  if (visibility === "LOGGED_IN") return "Account";
  if (visibility === "COURSE_ENROLLED") return "Enrolled";
  return visibility;
}
