"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronsDownUp, ChevronsUpDown, FolderPlus, LayoutList, Lock, Plus } from "lucide-react";
import { Button, Card, cn, Spinner } from "@/components/ui/primitives";
import { studioApi } from "@/lib/studio/api";
import type { HealthIssue } from "@/lib/studio/health";
import type { Item, Section } from "@/lib/studio/types";
import { useCourseEditor } from "../editor/CourseEditorContext";
import { AddItemDialog } from "./AddItemDialog";
import { HealthPanel } from "./HealthPanel";
import { ItemEditorSheet } from "./ItemEditorSheet";
import { KIND_META, sortedItems, sortedSections } from "./itemMeta";
import { SectionCard, useSortSensors, verticalOnly } from "./SectionCard";

type OpenRef = { id: string; sectionIndex: number; itemIndex: number; itemType?: Item["item_type"] };

// Ids change after the first edit of a published course (the API clones it),
// so find the open item by id, then fall back to the same position and type.
function findOpen(ref: OpenRef | null, sections: Section[]): { item: Item; section: Section } | null {
  if (!ref) return null;
  for (const s of sections) {
    const it = (s.items ?? []).find((i) => i.id === ref.id);
    if (it) return { item: it, section: s };
  }
  const s = sections[ref.sectionIndex];
  const it = s ? sortedItems(s)[ref.itemIndex] : undefined;
  return s && it && it.item_type === ref.itemType ? { item: it, section: s } : null;
}

function AddModuleRow({ nextIndex, autoOpen }: { nextIndex: number; autoOpen?: boolean }) {
  const { courseId, run } = useCourseEditor();
  const [open, setOpen] = useState(!!autoOpen);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    const t = title.trim();
    if (!t) return;
    setBusy(true);
    const ok = await run(
      async () => {
        await studioApi.createSection(courseId, { title: t, order_index: nextIndex });
        return true;
      },
      { success: "Module added" },
    );
    setBusy(false);
    if (ok) setTitle(""); // stay open for rapid entry
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-4 text-sm font-semibold text-slate-500 transition hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-700 dark:border-ink-line dark:text-slate-400 dark:hover:border-brand-400/40 dark:hover:bg-brand-400/5 dark:hover:text-brand-300"
      >
        <FolderPlus className="h-4 w-4 transition-transform group-hover:scale-110" /> Add module
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border-2 border-brand-300 bg-white p-3 sm:flex-row sm:items-center dark:border-brand-400/50 dark:bg-ink-surface">
      <span className="hidden pl-1 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600 sm:block dark:text-brand-300">
        Module {nextIndex + 1}
      </span>
      <input
        autoFocus
        value={title}
        disabled={busy}
        maxLength={255}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void create();
          }
          if (e.key === "Escape") {
            setTitle("");
            setOpen(false);
          }
        }}
        placeholder="Module title, e.g. Foundations of safeguarding"
        aria-label="New module title"
        className="h-10 min-w-0 flex-1 rounded-lg bg-transparent px-2 text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 dark:text-white"
      />
      <div className="flex items-center gap-2">
        {busy && <Spinner />}
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={busy}>
          Done
        </Button>
        <Button size="sm" icon={Plus} onClick={create} disabled={!title.trim() || busy}>
          Add
        </Button>
      </div>
    </div>
  );
}

function EmptyCurriculum({ readOnly }: { readOnly: boolean }) {
  const { courseId, run } = useCourseEditor();
  const [busy, setBusy] = useState(false);
  const steps = [
    { title: "Create a module", text: "Group lessons into themes, weeks or units." },
    { title: "Add lessons", text: "Videos, readings, links and live classes." },
    { title: "Check understanding", text: "Quizzes and essays, with a final assessment per module." },
  ];
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-brand-100 to-transparent opacity-70 blur-2xl dark:from-brand-400/15" />
      <div className="relative flex flex-col items-center px-2 py-8 text-center sm:py-12">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_16px_32px_-16px_rgba(45,106,79,0.8)]">
          <LayoutList className="h-7 w-7" strokeWidth={1.8} />
        </span>
        <h2 className="mt-5 font-display text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          {readOnly ? "No modules yet" : "Start with your first module"}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          Modules are the chapters of your course. Learners work through them in order, one lesson at a time.
        </p>
        {!readOnly && (
          <Button
            size="lg"
            icon={FolderPlus}
            className="mt-6"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await run(() => studioApi.createSection(courseId, { title: "Module 1", order_index: 0 }), { success: "Module added — click its title to rename it" });
              setBusy(false);
            }}
          >
            Add module
          </Button>
        )}
        <ol className="mt-9 grid w-full max-w-3xl gap-3 text-left sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-ink-line dark:bg-white/[0.02]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-400/12 dark:text-brand-300">
                {i + 1}
              </span>
              <p className="mt-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100">{s.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

export function CurriculumBuilder({
  issues,
  onGoToTab,
}: {
  issues: HealthIssue[];
  onGoToTab: (tab: "details" | "pricing") => void;
}) {
  const { course, courseId, readOnly, run } = useCourseEditor();
  const sensors = useSortSensors();

  const serverSections = useMemo(() => sortedSections(course?.sections), [course?.sections]);
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [openRef, setOpenRef] = useState<OpenRef | null>(null);
  const [addFor, setAddFor] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);

  // Deep link: ?tab=curriculum&item={itemId} opens that item's editor.
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const linkedItem = searchParams.get("item");
  const [handledLink, setHandledLink] = useState<string | null>(null);
  if (linkedItem && linkedItem !== handledLink) {
    // Adjusting state during render (React's pattern for reacting to new props).
    setHandledLink(linkedItem);
    setOpenRef({ id: linkedItem, sectionIndex: -1, itemIndex: -1 });
  } else if (!linkedItem && handledLink) {
    setHandledLink(null); // so the same item can be linked again later
  }

  const sections = useMemo(() => {
    if (!pendingOrder) return serverSections;
    const byId = new Map(serverSections.map((s) => [s.id, s]));
    const ordered = pendingOrder.map((id) => byId.get(id)).filter((s): s is Section => !!s);
    return ordered.length === serverSections.length ? ordered : serverSections;
  }, [pendingOrder, serverSections]);

  const open = findOpen(openRef, serverSections);
  const linkedSectionId = linkedItem && open?.item.id === linkedItem ? open.section.id : null;

  // Bring the linked item's module into view behind the drawer.
  useEffect(() => {
    if (!linkedSectionId) return;
    const t = setTimeout(() => document.getElementById(`module-${linkedSectionId}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    return () => clearTimeout(t);
  }, [linkedSectionId]);

  function closeItem() {
    setOpenRef(null);
    if (linkedItem) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("item");
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    }
  }

  function openItem(id: string) {
    for (let si = 0; si < serverSections.length; si++) {
      const items = sortedItems(serverSections[si]);
      const ii = items.findIndex((i) => i.id === id);
      if (ii !== -1) return setOpenRef({ id, sectionIndex: si, itemIndex: ii, itemType: items[ii].item_type });
    }
    // Not in the tree yet (just created — the re-fetch is still landing).
    setOpenRef({ id, sectionIndex: -1, itemIndex: -1 });
  }

  function toggle(id: string) {
    setCollapsed((c) => {
      const next = new Set(c);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function focusSection(id: string) {
    setCollapsed((c) => {
      const next = new Set(c);
      next.delete(id);
      return next;
    });
    setHighlight(id);
    setTimeout(() => document.getElementById(`module-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
    setTimeout(() => setHighlight((h) => (h === id ? null : h)), 1800);
  }

  function selectIssue(issue: HealthIssue) {
    if (issue.itemId) return openItem(issue.itemId);
    if (issue.sectionId) return focusSection(issue.sectionId);
    const m = issue.message.toLowerCase();
    if (m.includes("cover image")) return onGoToTab("pricing");
    if (m.includes("description") || m.includes("outcome")) return onGoToTab("details");
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = sections.map((s) => s.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setPendingOrder(next);
    await run(() => studioApi.reorderSections(courseId, next.map((id, order_index) => ({ id, order_index }))), { success: "Module order saved" });
    setPendingOrder(null);
  }

  const addSection = sections.find((s) => s.id === addFor) ?? null;
  const allCollapsed = sections.length > 0 && sections.every((s) => collapsed.has(s.id));
  const totalItems = sections.reduce((n, s) => n + (s.items?.length ?? 0), 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="flex min-w-0 flex-col gap-4">
        {sections.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">Curriculum</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {readOnly ? (
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-3 w-3" /> View only
                  </span>
                ) : (
                  "Drag to reorder. Click any item to edit it."
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={allCollapsed ? ChevronsUpDown : ChevronsDownUp}
                onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(sections.map((s) => s.id)))}
              >
                {allCollapsed ? "Expand all" : "Collapse all"}
              </Button>
            </div>
          </div>
        )}

        {sections.length === 0 ? (
          <EmptyCurriculum readOnly={readOnly} />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[verticalOnly]} onDragEnd={onDragEnd}>
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className={cn("flex flex-col gap-4", pendingOrder && "pointer-events-none")}>
                {sections.map((s, i) => (
                  <SectionCard
                    key={s.id}
                    section={s}
                    index={i}
                    readOnly={readOnly}
                    collapsed={collapsed.has(s.id)}
                    highlighted={highlight === s.id}
                    onToggle={() => toggle(s.id)}
                    onOpenItem={openItem}
                    onAddItem={() => setAddFor(s.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {!readOnly && sections.length > 0 && <AddModuleRow nextIndex={sections.length} />}

        {sections.length > 0 && totalItems === 0 && !readOnly && (
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Tip: start with a short {KIND_META.VIDEO.noun} that welcomes learners and explains what the course covers.
          </p>
        )}
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-6">
          <HealthPanel course={course} issues={issues} onSelect={selectIssue} />
        </div>
      </aside>

      {/* Smaller screens get the health checklist below the modules. */}
      {issues.length > 0 && (
        <div className="xl:hidden">
          <HealthPanel course={course} issues={issues} onSelect={selectIssue} />
        </div>
      )}

      {addSection && (
        <AddItemDialog section={addSection} onClose={() => setAddFor(null)} onCreated={(id) => openItem(id)} />
      )}

      <ItemEditorSheet item={open?.item ?? null} section={open?.section ?? null} onClose={closeItem} onOpenItem={openItem} />
    </div>
  );
}
