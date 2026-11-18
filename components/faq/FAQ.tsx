"use client";

import { Fragment, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Link2, Plus, Search, X } from "lucide-react";
import { Button, CtaBand, PageHero, cx } from "@/components/swcl/ui";

type FAQAudience = "STUDENT" | "INSTRUCTOR" | "BOTH";
type AudienceFilter = "ALL" | "STUDENT" | "INSTRUCTOR";

export interface FAQItem {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  order: number;
  is_published?: boolean;
  audience?: FAQAudience;
  keywords?: string[];
  escalation_route?: string;
  related_article_ids?: string[];
}

export interface FAQCategory {
  id: string;
  name: string;
  order: number;
  items: FAQItem[];
}

const AUDIENCES: { value: AudienceFilter; label: string }[] = [
  { value: "ALL", label: "Everyone" },
  { value: "STUDENT", label: "Learners" },
  { value: "INSTRUCTOR", label: "Instructors" },
];

/** Category names carry an audience suffix in the admin, e.g. "Payments (Student)". */
const cleanName = (name: string) => name.replace(/\s*\((Student|Instructor|Both)\)\s*$/i, "");

const matchesAudience = (item: FAQItem, audience: AudienceFilter) =>
  audience === "ALL" || !item.audience || item.audience === audience || item.audience === "BOTH";

function highlight(text: string, query: string) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>,
  );
}

const subscribeHash = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};

/** Pill toggle used by the audience and topic filters. Pressed state is shown by fill and a bold label. */
const pill =
  "inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-md border border-swc-line bg-swc-card px-4 text-[0.9rem] text-swc-ink transition-colors hover:border-swc-mid aria-pressed:border-swc-deep aria-pressed:bg-swc-deep aria-pressed:font-bold aria-pressed:text-white";

const textButton =
  "inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 py-1.5 font-[inherit] text-[0.9rem] font-semibold text-swc-label underline underline-offset-4";

export default function FAQ({
  categories,
  isAuthenticated,
  loadFailed,
}: {
  categories: FAQCategory[];
  isAuthenticated: boolean;
  loadFailed: boolean;
}) {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<AudienceFilter>("INSTRUCTOR");
  const [topic, setTopic] = useState<string>("ALL");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [closedFromLink, setClosedFromLink] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // A link such as /faq#faq-<id> opens that answer.
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => "");
  const linkedId = !closedFromLink && hash.startsWith("#faq-") ? hash.slice(5) : null;

  const sorted = useMemo(
    () =>
      [...categories]
        .sort((a, b) => a.order - b.order)
        .map((c) => ({ ...c, label: cleanName(c.name), items: [...c.items].sort((a, b) => a.order - b.order) })),
    [categories],
  );
  const byId = useMemo(() => new Map(sorted.flatMap((c) => c.items.map((i) => [i.id, i]))), [sorted]);

  const audienceCategories = sorted
    .map((c) => ({ ...c, items: c.items.filter((i) => matchesAudience(i, audience)) }))
    .filter((c) => c.items.length > 0);
  const activeTopic = audienceCategories.some((c) => c.id === topic) ? topic : "ALL";

  const q = query.trim().toLowerCase();
  const groups = audienceCategories
    .filter((c) => activeTopic === "ALL" || c.id === activeTopic)
    .map((c) => ({
      ...c,
      items: c.items.filter(
        (i) => !q || [i.question, i.answer, c.label, ...(i.keywords || [])].join(" ").toLowerCase().includes(q),
      ),
    }))
    .filter((c) => c.items.length > 0);
  const results = groups.flatMap((c) => c.items);
  const total = sorted.reduce((n, c) => n + c.items.length, 0);

  const isOpen = (id: string) => openIds.has(id) || linkedId === id;
  const setOpen = (id: string, open: boolean) => {
    if (open === isOpen(id)) return;
    if (!open && linkedId === id) {
      setClosedFromLink(true);
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setOpenIds((current) => {
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const openRelated = (id: string) => {
    setAudience("ALL");
    setTopic("ALL");
    setQuery("");
    setOpenIds((current) => new Set(current).add(id));
    requestAnimationFrame(() => {
      const el = document.getElementById(`faq-${id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      el?.querySelector<HTMLElement>("summary")?.focus({ preventScroll: true });
    });
  };
  const copyLink = async (id: string) => {
    const url = `${window.location.origin}/faq#faq-${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    } catch {
      window.location.assign(`#faq-${id}`);
    }
  };
  const allOpen = results.length > 0 && results.every((r) => isOpen(r.id));
  const trimmed = query.trim();

  return (
    <>
      <PageHero
        id="faq-heading"
        eyebrow="Help centre"
        title="Frequently asked questions"
        lead="Answers for instructors: applying, building and submitting courses, reviews, assessments and your account. Search or browse by topic."
        compact
      >
        {total > 0 && (
          <form className="w-full max-w-[560px]" role="search" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="faq-search" className="sr-only">
              Search the FAQs
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-swc-ink-3"
              />
              <input
                id="faq-search"
                type="search"
                className="swc-input pl-12 pr-14 [&::-webkit-search-cancel-button]:hidden"
                placeholder="Search the FAQs"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                enterKeyHint="search"
              />
              {query && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-swc-ink hover:bg-swc-mint"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <X className="h-[18px] w-[18px]" aria-hidden="true" />
                </button>
              )}
            </div>
          </form>
        )}
      </PageHero>

      <section aria-label="Answers" className="swc-section bg-swc-white">
        <div className="swc-wrap">
          {total === 0 ? (
            <div className="swc-card mx-auto max-w-[680px] p-8 text-center md:p-10" role={loadFailed ? "alert" : undefined}>
              <h2 className="swc-h3">
                {loadFailed ? "We could not load the FAQs right now." : "Answers are being added."}
              </h2>
              <p className="m-0 mt-3 text-swc-ink-2">
                {loadFailed
                  ? "Please try again shortly, or send us your question."
                  : "In the meantime, send us your question and we will reply by email."}
              </p>
              <Button href="/contact" variant="green" className="mt-6">
                Send us a message
              </Button>
            </div>
          ) : (
            <div className="grid items-start gap-10 min-[1001px]:grid-cols-[280px_1fr] min-[1001px]:gap-14">
              <aside aria-label="Filter answers" className="flex flex-col gap-8 min-[1001px]:sticky min-[1001px]:top-28">
                <div>
                  <p className="swc-eyebrow" aria-hidden="true">
                    Show answers for
                  </p>
                  <div role="group" aria-label="Show answers for" className="mt-3 flex flex-wrap gap-2">
                    {AUDIENCES.map((a) => (
                      <button
                        key={a.value}
                        type="button"
                        className={pill}
                        aria-pressed={audience === a.value}
                        onClick={() => setAudience(a.value)}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {audienceCategories.length > 1 && (
                  <div>
                    <p className="swc-eyebrow" aria-hidden="true">
                      Topics
                    </p>
                    <ul aria-label="Topics" className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0 min-[1001px]:flex-col">
                      <li>
                        <button
                          type="button"
                          className={cx(pill, "w-full")}
                          aria-pressed={activeTopic === "ALL"}
                          onClick={() => setTopic("ALL")}
                        >
                          All topics
                        </button>
                      </li>
                      {audienceCategories.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            className={cx(pill, "w-full justify-between text-left")}
                            aria-pressed={activeTopic === c.id}
                            onClick={() => setTopic(c.id)}
                          >
                            <span>{c.label}</span>
                            <span className="text-[0.8rem] tabular-nums opacity-75">{c.items.length}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </aside>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p role="status" aria-live="polite" className="m-0 text-[0.92rem] text-swc-ink-3">
                    {results.length} {results.length === 1 ? "answer" : "answers"}
                    {q && <> matching “{trimmed}”</>}
                  </p>
                  {results.length > 1 && (
                    <button
                      type="button"
                      className={textButton}
                      onClick={() => setOpenIds(allOpen ? new Set() : new Set(results.map((r) => r.id)))}
                    >
                      {allOpen ? "Collapse all" : "Expand all"}
                    </button>
                  )}
                </div>

                {results.length === 0 ? (
                  <div className="swc-card mt-6 p-8">
                    <h2 className="swc-h4">No answers match your search.</h2>
                    <p className="m-0 mt-2 text-swc-ink-2">
                      Try another word, choose a different topic, or send us your question.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="swc-btn swc-btn--green"
                        onClick={() => {
                          setQuery("");
                          setTopic("ALL");
                          setAudience("ALL");
                        }}
                      >
                        Clear search
                      </button>
                      <Button href="/contact" variant="outline">
                        Ask a question
                      </Button>
                    </div>
                  </div>
                ) : (
                  groups.map((group) => (
                    <div key={group.id} className="mt-10 first:mt-6">
                      <h2 className="swc-h4 mb-3">{group.label}</h2>
                      <div className="swc-faq [&_mark]:rounded-sm [&_mark]:bg-swc-gold-light [&_mark]:text-swc-forest">
                        {group.items.map((item) => {
                          const related = (item.related_article_ids || [])
                            .map((id) => byId.get(id))
                            .filter(Boolean) as FAQItem[];
                          return (
                            <details
                              key={item.id}
                              id={`faq-${item.id}`}
                              open={isOpen(item.id)}
                              onToggle={(e) => setOpen(item.id, e.currentTarget.open)}
                            >
                              <summary>
                                <span>{highlight(item.question, trimmed)}</span>
                                <Plus aria-hidden="true" className="swc-faq-icon h-5 w-5" strokeWidth={2.2} />
                              </summary>
                              <div className="swc-faq-body">
                                <p className="m-0 whitespace-pre-line [overflow-wrap:anywhere]">
                                  {highlight(item.answer, trimmed)}
                                </p>
                                {related.length > 0 && (
                                  <div className="mt-5">
                                    <p className="m-0 text-[0.85rem] font-bold text-swc-ink">Related answers</p>
                                    <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
                                      {related.map((r) => (
                                        <li key={r.id}>
                                          <button type="button" className={cx(textButton, "text-left")} onClick={() => openRelated(r.id)}>
                                            {r.question}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                                  <button type="button" className={textButton} onClick={() => copyLink(item.id)}>
                                    <Link2 className="h-[15px] w-[15px]" aria-hidden="true" />
                                    Copy link to this answer
                                  </button>
                                  <span className="text-[0.85rem] text-swc-ink-3" aria-live="polite">
                                    {copiedId === item.id ? "Link copied" : ""}
                                  </span>
                                  {item.escalation_route && (
                                    <Link
                                      href="/contact?topic=account"
                                      className="ml-auto text-[0.9rem] font-semibold text-swc-label underline underline-offset-4"
                                    >
                                      Still need help? Contact support
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <CtaBand
        id="still-heading"
        title="Still have a question?"
        body="Send us a message and we will reply by email. If you are thinking of teaching with us, expressing interest takes a few minutes."
        primary={isAuthenticated ? { href: "/dashboard", label: "Go to your dashboard" } : { href: "/register", label: "Express Interest" }}
        secondary={{ href: "/contact", label: "Contact Us" }}
      />
    </>
  );
}
