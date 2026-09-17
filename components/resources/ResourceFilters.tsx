"use client";

import { RESOURCE_CATEGORIES, formatResourceCategory } from "@/lib/resources";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function ResourceFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";
  const currentSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(currentSearch);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search === currentSearch) return;
      const params = new URLSearchParams(searchParams.toString());
      if (search.trim()) params.set("search", search.trim());
      else params.delete("search");
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [currentSearch, pathname, router, search, searchParams]);

  function setCategory(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category) params.set("category", category);
    else params.delete("category");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function clearFilters() {
    setSearch("");
    router.push(pathname, { scroll: false });
  }

  const hasFilters = Boolean(currentCategory || currentSearch);

  return (
    <div className="mb-10 space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <label htmlFor="resource-search" className="sr-only">
            Search resources
          </label>
          <input
            id="resource-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search policies, templates, recordings..."
            className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#2D6A4F] focus:ring-4 focus:ring-[#2D6A4F]/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      <div className="swcl-sidebar-scroll flex gap-2 overflow-x-auto overscroll-x-contain pb-1">
        <button
          type="button"
          onClick={() => setCategory("")}
          className={`h-10 flex-shrink-0 rounded-md border px-4 text-sm font-extrabold transition ${
            !currentCategory
              ? "border-[#2D6A4F] bg-[#2D6A4F] text-white dark:border-[#52b788] dark:bg-[#52b788] dark:text-[#06130d]"
              : "border-slate-200 bg-white text-slate-600 hover:border-[#95d5b2] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          }`}
        >
          All
        </button>
        {RESOURCE_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setCategory(category)}
            className={`h-10 flex-shrink-0 rounded-md border px-4 text-sm font-extrabold transition ${
              currentCategory === category
                ? "border-[#2D6A4F] bg-[#2D6A4F] text-white dark:border-[#52b788] dark:bg-[#52b788] dark:text-[#06130d]"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#95d5b2] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            }`}
          >
            {formatResourceCategory(category)}
          </button>
        ))}
      </div>
    </div>
  );
}
