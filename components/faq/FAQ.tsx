"use client";

import { Fragment, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Link2, MessageCircleQuestion, Plus, Search, X } from "lucide-react";
import PageHero from "@/components/site/PageHero";
import lib from "@/components/resources/library/Library.module.css";
import s from "./FAQ.module.css";
import { photos } from "@/lib/photos";

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

export default function FAQ({ categories, isAuthenticated, loadFailed }: { categories: FAQCategory[]; isAuthenticated: boolean; loadFailed: boolean }) {
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
  const results = audienceCategories
    .filter((c) => activeTopic === "ALL" || c.id === activeTopic)
    .flatMap((c) =>
      c.items
        .filter((i) => !q || [i.question, i.answer, c.label, ...(i.keywords || [])].join(" ").toLowerCase().includes(q))
        .map((i) => ({ ...i, categoryLabel: c.label })),
    );
  const total = sorted.reduce((n, c) => n + c.items.length, 0);

  const isOpen = (id: string) => openIds.has(id) || linkedId === id;
  const toggle = (id: string) => {
    if (linkedId === id) {
      setClosedFromLink(true);
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id) || linkedId === id) next.delete(id);
      else next.add(id);
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
      el?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    });
  };
  const copyLink = async (id: string) => {
    const url = `${window.location.origin}/faq#faq-${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    } catch {
      window.location.hash = `faq-${id}`;
    }
  };
  const allOpen = results.length > 0 && results.every((r) => isOpen(r.id));


  return (
    <>
      <PageHero
        id="faq-heading"
        eyebrow="Help centre"
        title="Frequently asked *questions*"
        lead="Answers for instructors: applying, building and submitting courses, reviews, assessments and your account. Search or browse by topic."
        photo={photos.tabletHijab}
        position="50% 28%"
        compact
      >
        {total > 0 && (
          <form className="w-full max-w-xl" role="search" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="faq-search" className="sr-only">Search the FAQs</label>
            <div className="relative">
              <Search size={20} aria-hidden="true" className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-[#10231a]/60" />
              <input
                id="faq-search"
                type="search"
                className="h-16 w-full rounded-full border-0 bg-white pl-14 pr-16 text-[1.05rem] text-[#10231a] shadow-[0_24px_50px_-24px_rgba(0,0,0,0.6)] outline-none ring-0 transition-shadow duration-300 placeholder:text-[#10231a]/50 focus-visible:ring-4 focus-visible:ring-gold/60 [&::-webkit-search-cancel-button]:hidden"
                placeholder="Search the FAQs"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                enterKeyHint="search"
              />
              {query && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-[#10231a]/[0.07] text-[#10231a] transition-colors hover:bg-[#10231a]/15"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          </form>
        )}
      </PageHero>

      <div className={`${lib.page} ${s.page} sw-sheet`}>
      <div className={`${lib.container} ${s.body}`}>
        {total === 0 ? (
          <div className={lib.state} role={loadFailed ? "alert" : undefined}>
            <h2 style={{ fontSize: "1.3rem" }}>{loadFailed ? "We could not load the FAQs right now." : "Answers are being added."}</h2>
            <p>{loadFailed ? "Please try again shortly, or send us your question." : "In the meantime, send us your question and we will reply by email."}</p>
            <div className={lib.stateActions}>
              <Link href="/contact" className={`${lib.cta} ${lib.ctaPrimary}`}>Send us a message <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
          </div>
        ) : (
          <div className={s.layout}>
            <aside className={s.sidebar} aria-label="Filter answers">
              <div className={s.controls}>
                <p className={s.sideLabel} aria-hidden="true">Show answers for</p>
                <div className={s.segmented} role="group" aria-label="Show answers for">
                {AUDIENCES.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    className={s.segment}
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
              <p className={s.sideLabel} aria-hidden="true">Topics</p>
              <ul className={s.chips} aria-label="Topics">
                <li>
                  <button type="button" className={s.chip} aria-pressed={activeTopic === "ALL"} onClick={() => setTopic("ALL")}>
                    All topics
                  </button>
                </li>
                {audienceCategories.map((c) => (
                  <li key={c.id}>
                    <button type="button" className={s.chip} aria-pressed={activeTopic === c.id} onClick={() => setTopic(c.id)}>
                      {c.label} <span className={s.chipCount}>{c.items.length}</span>
                    </button>
                  </li>
                ))}
              </ul>
              </div>
            )}
            </aside>

            <div className={s.content}>
            <div className={s.listHead}>
              <p role="status" aria-live="polite">
                {results.length} {results.length === 1 ? "answer" : "answers"}
                {q && <> matching “{query.trim()}”</>}
              </p>
              {results.length > 1 && (
                <button
                  type="button"
                  className={s.textButton}
                  onClick={() => setOpenIds(allOpen ? new Set() : new Set(results.map((r) => r.id)))}
                >
                  {allOpen ? "Collapse all" : "Expand all"}
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <div className={lib.state}>
                <h2 style={{ fontSize: "1.25rem" }}>No answers match your search.</h2>
                <p>Try another word, choose a different topic, or send us your question.</p>
                <div className={lib.stateActions}>
                  <button
                    type="button"
                    className={`${lib.cta} ${lib.ctaPrimary}`}
                    onClick={() => {
                      setQuery("");
                      setTopic("ALL");
                      setAudience("ALL");
                    }}
                  >
                    Clear search
                  </button>
                  <Link href="/contact" className={`${lib.cta} ${lib.ctaSecondary}`}>Ask a question</Link>
                </div>
              </div>
            ) : (
              <ul className={s.list}>
                {results.map((item) => {
                  const open = isOpen(item.id);
                  const related = (item.related_article_ids || []).map((id) => byId.get(id)).filter(Boolean) as FAQItem[];
                  return (
                    <li key={item.id} id={`faq-${item.id}`} className={`${s.item} ${open ? s.itemOpen : ""}`}>
                      <h2 className={s.question}>
                        <button
                          type="button"
                          className={s.trigger}
                          aria-expanded={open}
                          aria-controls={`faq-panel-${item.id}`}
                          id={`faq-trigger-${item.id}`}
                          onClick={() => toggle(item.id)}
                        >
                          <span>
                            {activeTopic === "ALL" && <span className={s.category}>{item.categoryLabel}</span>}
                            {highlight(item.question, query.trim())}
                          </span>
                          <span className={s.triggerIcon} aria-hidden="true">
                            <Plus size={18} />
                          </span>
                        </button>
                      </h2>
                      {/* Closed answers are inert, so their links are not reachable by keyboard. */}
                      <div
                        id={`faq-panel-${item.id}`}
                        role="region"
                        aria-labelledby={`faq-trigger-${item.id}`}
                        className={s.panel}
                        inert={!open ? true : undefined}
                      >
                        <div className={s.panelInner}>
                          <p className={s.answer}>{highlight(item.answer, query.trim())}</p>
                          {related.length > 0 && (
                            <div className={s.related}>
                              <p>Related answers</p>
                              <ul>
                                {related.map((r) => (
                                  <li key={r.id}>
                                    <button type="button" onClick={() => openRelated(r.id)}>{r.question}</button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className={s.itemFoot}>
                            <button
                              type="button"
                              className={s.textButton}
                              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 0", whiteSpace: "nowrap" }}
                              onClick={() => copyLink(item.id)}
                            >
                              <Link2 size={15} aria-hidden="true" />
                              Copy link to this answer
                            </button>
                            <span className={s.copied} aria-live="polite">{copiedId === item.id ? "Link copied" : ""}</span>
                            {item.escalation_route && (
                              <Link href={`/contact?topic=account`} style={{ marginLeft: "auto" }}>
                                Still need help? Contact support
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            </div>
          </div>
        )}
      </div>

      <section className={lib.closing} aria-labelledby="still-heading">
        <div className={`${lib.container} ${lib.closingInner}`}>
          <div className={lib.closingTitle}>
            <span className={lib.closingIcon} aria-hidden="true">
              <MessageCircleQuestion size={24} />
            </span>
            <h2 id="still-heading">Still have a question?</h2>
          </div>
          <p>
            Send us a message and we will reply by email. If you are thinking of teaching with us, the application
            takes a few minutes.
          </p>
          <div className={lib.closingActions}>
            <Link href="/contact" className={lib.closingGold}>Send us a message <ArrowRight size={17} aria-hidden="true" /></Link>
            <Link href={isAuthenticated ? "/dashboard" : "/register"} className={lib.closingGhost}>
              {isAuthenticated ? "Go to your dashboard" : "Apply to teach"}
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
