"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Search,
  MessageCircleQuestion,
  ArrowRight,
  Sparkles,
} from "lucide-react";

type FAQAudience = "STUDENT" | "INSTRUCTOR" | "BOTH";
type AudienceFilter = "ALL" | FAQAudience;

interface FAQItem {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  order: number;
  is_published: boolean;
  audience?: FAQAudience;
  keywords?: string[];
  escalation_route?: string;
  related_article_ids?: string[];
}

interface FAQCategory {
  id: string;
  name: string;
  order: number;
  items: FAQItem[];
}

type FAQItemWithCategory = FAQItem & { categoryName: string };

const AUDIENCE_OPTIONS: Array<{
  value: AudienceFilter;
  label: string;
}> = [
  { value: "ALL", label: "Everyone" },
  { value: "STUDENT", label: "Students" },
  { value: "INSTRUCTOR", label: "Instructors" },
];

function matchesAudience(item: FAQItem, audience: AudienceFilter) {
  return (
    audience === "ALL" || item.audience === audience || item.audience === "BOTH"
  );
}

function searchableText(item: FAQItemWithCategory) {
  return [
    item.question,
    item.answer,
    item.categoryName,
    ...(item.keywords || []),
  ]
    .join(" ")
    .toLowerCase();
}

function cleanCategoryName(name: string) {
  return name.replace(/\s*\((Student|Instructor|Both)\)\s*$/i, "");
}

function displayCategoryName(name: string, audience: AudienceFilter) {
  if (audience === "ALL") {
    return name.replace(/\s*\(Both\)\s*$/i, "");
  }
  return cleanCategoryName(name);
}

export function FAQContent({
  categories,
  isAuthenticated,
}: {
  categories: FAQCategory[];
  isAuthenticated: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | string>(
    "All"
  );
  const [selectedAudience, setSelectedAudience] =
    useState<AudienceFilter>("ALL");
  const [openId, setOpenId] = useState<string | null>(null);

  const allItems = useMemo(
    () =>
      categories.flatMap((cat) =>
        cat.items.map((item) => ({ ...item, categoryName: cat.name }))
      ),
    [categories]
  );

  const visibleCategories = useMemo(() => {
    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) =>
          matchesAudience(item, selectedAudience)
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [categories, selectedAudience]);

  const visibleItems = useMemo(
    () =>
      visibleCategories.flatMap((cat) =>
        cat.items.map((item) => ({ ...item, categoryName: cat.name }))
      ),
    [visibleCategories]
  );

  const articleById = useMemo(() => {
    return new Map(allItems.map((item) => [item.id, item]));
  }, [allItems]);

  const categoryIsVisible =
    selectedCategory === "All" ||
    visibleCategories.some((category) => category.id === selectedCategory);
  const activeCategory = categoryIsVisible ? selectedCategory : "All";

  const filteredFAQs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return visibleItems.filter((faq) => {
      const matchesCategory =
        activeCategory === "All" || faq.category_id === activeCategory;
      const matchesSearch = !query || searchableText(faq).includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm, visibleItems]);

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const updateAudience = (audience: AudienceFilter) => {
    setSelectedAudience(audience);
    setSelectedCategory("All");
    setOpenId(null);
  };

  const openArticle = (id: string) => {
    setSelectedCategory("All");
    setSelectedAudience("ALL");
    setOpenId(id);
    window.requestAnimationFrame(() => {
      document.getElementById(`faq-${id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  const buildSupportHref = (escalationRoute?: string) => {
    const params = new URLSearchParams({ new: "1" });
    if (escalationRoute) {
      params.set("subject", escalationRoute);
      params.set(
        "message",
        `I read the FAQ article for "${escalationRoute}" but still need help.`
      );
    }
    const supportPath = `/dashboard/support-tickets?${params.toString()}`;
    return isAuthenticated
      ? supportPath
      : `/login?callbackUrl=${encodeURIComponent(supportPath)}`;
  };

  return (
    <section className="flex-1 bg-white dark:bg-[#0a0a0a]">
      {/* Search Bar - Overlapping the Hero */}
      <div className="relative z-30 -mt-10 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="relative flex items-center w-full h-16 rounded-2xl bg-white shadow-xl shadow-gray-200/50 border border-gray-100 dark:bg-gray-900 dark:border-gray-800 dark:shadow-none overflow-hidden focus-within:ring-2 focus-within:ring-[#2D6A4F] transition-all">
          <Search className="h-6 w-6 text-gray-400 ml-6 shrink-0" />
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none pl-4 pr-6 text-gray-900 dark:text-white placeholder-gray-400 text-lg w-full"
            placeholder="Search for answers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-24">
        
        {/* Audience Toggle */}
        <div className="flex justify-center mb-16">
          <div className="inline-flex rounded-full bg-gray-100 dark:bg-gray-900 p-1.5 overflow-x-auto max-w-full">
            {AUDIENCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => updateAudience(option.value)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedAudience === option.value
                    ? "bg-white text-[#2D6A4F] shadow-sm dark:bg-gray-800 dark:text-[#52b788]"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-[250px_1fr] items-start">
          
          {/* Categories Navigation */}
          <aside className="lg:sticky lg:top-24">
            <h3 className="hidden lg:block text-xs font-bold uppercase tracking-wider text-gray-400 mb-6">
              Categories
            </h3>
            
            {/* Mobile: Horizontal scrollable pills */}
            <div className="flex overflow-x-auto pb-4 lg:hidden -mx-4 px-4 space-x-2 scrollbar-hide">
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setOpenId(null);
                }}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors border ${
                  activeCategory === "All"
                    ? "bg-[#2D6A4F] border-[#2D6A4F] text-white"
                    : "bg-white border-gray-200 text-gray-600 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300"
                }`}
              >
                All Topics
              </button>
              {visibleCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setOpenId(null);
                  }}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors border ${
                    activeCategory === category.id
                      ? "bg-[#2D6A4F] border-[#2D6A4F] text-white"
                      : "bg-white border-gray-200 text-gray-600 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300"
                  }`}
                >
                  {displayCategoryName(category.name, selectedAudience)}
                </button>
              ))}
            </div>

            {/* Desktop: Vertical list with active left-border indicator */}
            <div className="hidden lg:flex flex-col space-y-2 border-l border-gray-100 dark:border-gray-800">
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setOpenId(null);
                }}
                className={`relative pl-5 py-2 text-sm font-medium text-left transition-colors ${
                  activeCategory === "All"
                    ? "text-[#2D6A4F] dark:text-[#52b788]"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {activeCategory === "All" && (
                  <span className="absolute left-[-1px] top-0 bottom-0 w-0.5 bg-[#2D6A4F] dark:bg-[#52b788] rounded-r-full" />
                )}
                All Topics
              </button>
              {visibleCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setOpenId(null);
                  }}
                  className={`relative pl-5 py-2 text-sm font-medium text-left transition-colors ${
                    activeCategory === category.id
                      ? "text-[#2D6A4F] dark:text-[#52b788]"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {activeCategory === category.id && (
                    <span className="absolute left-[-1px] top-0 bottom-0 w-0.5 bg-[#2D6A4F] dark:bg-[#52b788] rounded-r-full" />
                  )}
                  {displayCategoryName(category.name, selectedAudience)}
                </button>
              ))}
            </div>
          </aside>

          {/* FAQs List */}
          <div className="min-w-0">
            {filteredFAQs.length > 0 ? (
              <div className="flex flex-col border-t border-gray-200 dark:border-gray-800">
                {filteredFAQs.map((faq) => {
                  const isOpen = openId === faq.id;
                  return (
                    <article
                      key={faq.id}
                      id={`faq-${faq.id}`}
                      className="border-b border-gray-200 dark:border-gray-800 last:border-b-0"
                    >
                      <button
                        onClick={() => toggleFAQ(faq.id)}
                        className="flex w-full items-center justify-between py-6 text-left group focus:outline-none"
                      >
                        <span
                          className={`text-lg font-semibold transition-colors pr-8 ${
                            isOpen
                              ? "text-[#2D6A4F] dark:text-[#52b788]"
                              : "text-gray-900 dark:text-gray-100 group-hover:text-[#2D6A4F] dark:group-hover:text-[#52b788]"
                          }`}
                        >
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`flex-shrink-0 h-5 w-5 text-gray-400 transition-transform duration-300 ${
                            isOpen ? "rotate-180 text-[#2D6A4F] dark:text-[#52b788]" : ""
                          }`}
                        />
                      </button>
                      <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="pb-8 pr-4 sm:pr-12 text-base text-gray-600 dark:text-gray-400 leading-relaxed space-y-4">
                            <p>{faq.answer}</p>
                            
                            {/* Related Articles */}
                            {faq.related_article_ids && faq.related_article_ids.length > 0 ? (
                              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800/50">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                                  <Sparkles className="h-4 w-4 text-[#2D6A4F] dark:text-[#52b788]" />
                                  Related Articles
                                </h4>
                                <ul className="space-y-2">
                                  {faq.related_article_ids.map((relatedId) => {
                                    const related = articleById.get(relatedId);
                                    if (!related) return null;
                                    return (
                                      <li key={relatedId}>
                                        <button
                                          onClick={() => openArticle(relatedId)}
                                          className="text-sm text-[#2D6A4F] dark:text-[#52b788] hover:underline text-left"
                                        >
                                          {related.question}
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ) : null}

                            {/* Escalation Route */}
                            {faq.escalation_route ? (
                              <div className="mt-4 pt-4">
                                <Link
                                  href={buildSupportHref(faq.escalation_route)}
                                  className="text-sm font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:underline"
                                >
                                  Still stuck? Contact Support &rarr;
                                </Link>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 px-6 rounded-3xl bg-gray-50 dark:bg-gray-900/50">
                <Search className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No answers found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  {searchTerm
                    ? `We couldn't find any FAQs matching "${searchTerm}". Try adjusting your search term or category.`
                    : "We couldn't load the FAQs right now. Try again shortly."}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("All");
                    }}
                    className="mt-6 text-[#2D6A4F] dark:text-[#52b788] font-semibold hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact Support Banner */}
        <div className="mt-24 rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 sm:p-12 text-center max-w-4xl mx-auto flex flex-col items-center">
          <div className="h-16 w-16 bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/10 dark:text-[#52b788] rounded-full flex items-center justify-center mb-6">
            <MessageCircleQuestion className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Still have questions?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg">
            Can&apos;t find the answer you&apos;re looking for? Open a support ticket and our team will get back to you shortly.
          </p>
          <Link
            href={isAuthenticated ? "/dashboard/support-tickets?new=1" : "/login?callbackUrl=%2Fdashboard%2Fsupport-tickets%3Fnew%3D1"}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2D6A4F] px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#1B4332] hover:shadow-lg dark:hover:bg-[#40916c]"
          >
            Contact Support
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
