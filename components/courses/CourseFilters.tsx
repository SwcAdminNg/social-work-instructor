"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Search, SlidersHorizontal, ChevronDown, Check } from "lucide-react";
import { SearchableDropdown } from "./SearchableDropdown";

const CATEGORY_LABELS: Record<string, string> = {
  DEVELOPMENT: "Development",
  BUSINESS: "Business",
  FINANCE_ACCOUNTING: "Finance & Accounting",
  IT_SOFTWARE: "IT & Software",
  OFFICE_PRODUCTIVITY: "Office Productivity",
  PERSONAL_DEVELOPMENT: "Personal Development",
  DESIGN: "Design",
  MARKETING: "Marketing",
  HEALTH_FITNESS: "Health & Fitness",
  MUSIC: "Music",
  TEACHING_ACADEMICS: "Teaching & Academics",
  PHOTOGRAPHY_VIDEO: "Photography & Video",
  LIFESTYLE: "Lifestyle",
  LANGUAGE: "Language",
};

interface Catalog {
  id: string;
  name: string;
  slug: string;
  total_courses: number;
}

export function CourseFilters({ catalogs = [] }: { catalogs?: Catalog[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentCatalog = searchParams.get("catalog") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentLevel = searchParams.get("level") || "";
  const currentIsFree = searchParams.get("is_free") || "";

  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [showFilters, setShowFilters] = useState(false);
  const [isFullyOpen, setIsFullyOpen] = useState(false);

  const handleToggleFilters = () => {
    if (showFilters) {
      setShowFilters(false);
      setIsFullyOpen(false);
    } else {
      setShowFilters(true);
      setTimeout(() => setIsFullyOpen(true), 400);
    }
  };

  useEffect(() => {
    setSearchTerm(currentSearch);
  }, [currentSearch]);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      // Reset to page 1 on filter change
      params.set("page", "1");
      return params.toString();
    },
    [searchParams],
  );

  const updateFilter = (name: string, value: string) => {
    router.push(pathname + "?" + createQueryString(name, value));
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== currentSearch) {
        router.push(pathname + "?" + createQueryString("search", searchTerm));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, currentSearch, pathname, createQueryString, router]);

  const catalogOptions = catalogs.map((c) => ({
    value: c.slug,
    label: c.name,
    count: c.total_courses,
  }));

  const categoryOptions = Object.entries(CATEGORY_LABELS).map(
    ([value, label]) => ({ value, label }),
  );

  const levelOptions = [
    { value: "BEGINNER", label: "Beginner" },
    { value: "INTERMEDIATE", label: "Intermediate" },
    { value: "ADVANCED", label: "Advanced" },
  ];

  const priceOptions = [
    { value: "true", label: "Free" },
    { value: "false", label: "Premium" },
  ];

  const activeFiltersCount = [
    currentCatalog,
    currentCategory,
    currentLevel,
    currentIsFree,
  ].filter(Boolean).length;

  return (
    <div className="w-full mb-10 flex flex-col items-end relative z-50">
      {/* Default Collapsed State: Single Icon Button */}
      {!showFilters && (
        <button
          onClick={handleToggleFilters}
          className="flex items-center gap-3 px-6 py-3.5 bg-white dark:bg-[#111a14] border border-gray-200 dark:border-gray-800 rounded-full shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-gray-700 dark:text-gray-200 font-medium"
        >
          <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span>Search & Filters</span>

          {activeFiltersCount > 0 && (
            <span className="flex items-center justify-center min-w-[22px] h-[22px] bg-[#2D6A4F] text-white rounded-full text-xs font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
      )}

      {/* Expanded State: The full filter component */}
      <div
        className={`grid transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] w-full origin-top-right ${
          showFilters
            ? "grid-rows-[1fr] opacity-100 scale-100"
            : "grid-rows-[0fr] opacity-0 scale-95"
        }`}
      >
        <div className={isFullyOpen ? "overflow-visible" : "overflow-hidden"}>
          <div className="bg-white dark:bg-[#111a14] border border-gray-200 dark:border-gray-800 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col gap-5 mt-2 relative">
            {/* Header & Close Button */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#2D6A4F]/20 dark:text-[#52b788] rounded-lg">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Advanced Filters
                </h3>
              </div>

              <button
                onClick={handleToggleFilters}
                aria-label="Close filters"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full">
              {/* Search */}
              <div className="relative w-full lg:w-auto lg:flex-1 min-w-[280px]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  autoComplete="off"

                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-[#0a0f0c] border border-gray-200 dark:border-gray-800 rounded-2xl text-[0.95rem] focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] dark:text-gray-100 transition-all outline-none"
                />
              </div>

              {/* Catalog */}
              <div className="w-full sm:w-auto flex-1 sm:flex-none">
                <SearchableDropdown
                  options={catalogOptions}
                  value={currentCatalog}
                  onChange={(val) => updateFilter("catalog", val)}
                  placeholder="Catalogs"
                  searchPlaceholder="Search catalogs..."
                />
              </div>

              {/* Category */}
              <div className="w-full sm:w-auto flex-1 sm:flex-none">
                <SearchableDropdown
                  options={categoryOptions}
                  value={currentCategory}
                  onChange={(val) => updateFilter("category", val)}
                  placeholder="Categories"
                  searchPlaceholder="Search categories..."
                />
              </div>

              {/* Level */}
              <div className="w-full sm:w-auto flex-1 sm:flex-none">
                <SearchableDropdown
                  options={levelOptions}
                  value={currentLevel}
                  onChange={(val) => updateFilter("level", val)}
                  placeholder="Levels"
                  showSearch={false}
                />
              </div>

              {/* Price */}
              <div className="w-full sm:w-auto flex-1 sm:flex-none">
                <SearchableDropdown
                  options={priceOptions}
                  value={currentIsFree}
                  onChange={(val) => updateFilter("is_free", val)}
                  placeholder="Prices"
                  showSearch={false}
                />
              </div>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => router.push(pathname)}
                  className="w-full sm:w-auto px-4 py-3.5 text-[0.95rem] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors flex-shrink-0"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
