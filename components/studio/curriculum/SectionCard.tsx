"use client";

import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, MoreHorizontal, Pencil, Plus, Trash2, UserPlus, X } from "lucide-react";
import { Avatar, Button, cn } from "@/components/ui/primitives";
import { ConfirmDialog, Menu } from "@/components/ui/overlays";
import { studioApi } from "@/lib/studio/api";
import { formatMinutes } from "@/lib/studio/labels";
import type { Section } from "@/lib/studio/types";
import { useCourseEditor } from "../editor/CourseEditorContext";
import { InlineText } from "../editor/InlineText";
import { ItemRow } from "./ItemRow";
import { plural, sectionMinutes, sortedItems } from "./itemMeta";

export const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

export function useSortSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

function GuestLecturers({ section, readOnly }: { section: Section; readOnly: boolean }) {
  const { courseId, run } = useCourseEditor();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const guests = section.guest_instructors ?? [];

  async function save(names: string[]) {
    setBusy(true);
    await run(() => studioApi.updateSection(courseId, section.id, { guest_instructors: names }), { success: "Guest lecturers updated" });
    setBusy(false);
  }

  async function add() {
    const n = name.trim();
    if (!n) return setAdding(false);
    if (guests.some((g) => g.name.toLowerCase() === n.toLowerCase())) {
      setName("");
      return;
    }
    await save([...guests.map((g) => g.name), n]);
    setName("");
    setAdding(false);
  }

  if (!guests.length && (readOnly || !adding)) {
    return readOnly ? null : (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/6 dark:hover:text-slate-300"
      >
        <UserPlus className="h-3.5 w-3.5" /> Add guest lecturer
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-medium text-slate-400">Guest lecturers</span>
      {guests.map((g) => (
        <span
          key={g.name}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-0.5 pl-0.5 pr-2 text-xs font-semibold text-slate-700 dark:bg-white/8 dark:text-slate-200"
        >
          <Avatar name={g.name} src={g.profile_picture_url} size="xs" className="!h-5 !w-5 !text-[9px] ring-0" />
          {g.name}
          {!readOnly && (
            <button
              type="button"
              disabled={busy}
              aria-label={`Remove ${g.name}`}
              onClick={() => save(guests.filter((x) => x.name !== g.name).map((x) => x.name))}
              className="-mr-1 cursor-pointer rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {!readOnly &&
        (adding ? (
          <input
            autoFocus
            value={name}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
            onBlur={add}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void add();
              }
              if (e.key === "Escape") {
                setName("");
                setAdding(false);
              }
            }}
            placeholder="Full name, then Enter"
            aria-label="Guest lecturer name"
            className="h-6 w-44 rounded-full border border-brand-300 bg-white px-2.5 text-xs outline-none ring-4 ring-brand-400/15 dark:border-brand-400/60 dark:bg-ink-page/60 dark:text-white"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label="Add guest lecturer"
            className="grid h-6 w-6 cursor-pointer place-items-center rounded-full border border-dashed border-slate-300 text-slate-400 transition hover:border-brand-400 hover:text-brand-600 dark:border-ink-line dark:hover:text-brand-300"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        ))}
    </div>
  );
}

export function SectionCard({
  section,
  index,
  readOnly,
  collapsed,
  highlighted,
  onToggle,
  onOpenItem,
  onAddItem,
}: {
  section: Section;
  index: number;
  readOnly: boolean;
  collapsed: boolean;
  highlighted?: boolean;
  onToggle: () => void;
  onOpenItem: (itemId: string) => void;
  onAddItem: () => void;
}) {
  const { courseId, run } = useCourseEditor();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled: readOnly,
  });
  const sensors = useSortSensors();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);

  const serverItems = useMemo(() => sortedItems(section), [section]);
  const items = useMemo(() => {
    if (!pendingOrder) return serverItems;
    const byId = new Map(serverItems.map((i) => [i.id, i]));
    const ordered = pendingOrder.map((id) => byId.get(id)).filter((i): i is NonNullable<typeof i> => !!i);
    return ordered.length === serverItems.length ? ordered : serverItems;
  }, [pendingOrder, serverItems]);

  const minutes = sectionMinutes(section);

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = items.map((i) => i.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setPendingOrder(next);
    await run(() => studioApi.reorderItems(courseId, section.id, next.map((id, order_index) => ({ id, order_index }))), {
      success: "Order saved",
    });
    setPendingOrder(null);
  }

  return (
    <section
      id={`module-${section.id}`}
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "scroll-mt-24 rounded-2xl border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-18px_rgba(16,24,40,0.18)] transition-[box-shadow,border-color] dark:bg-ink-surface dark:shadow-none",
        isDragging
          ? "relative z-20 border-brand-300 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.5)] dark:border-brand-400/50"
          : highlighted
            ? "border-brand-400 ring-4 ring-brand-400/15 dark:border-brand-400/70"
            : "border-slate-200/80 dark:border-ink-line",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-1 px-3 pb-3 pt-3.5 sm:px-4">
        {!readOnly && (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reorder module ${section.title}`}
            className="mt-1 flex h-8 w-6 flex-shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-slate-300 transition hover:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-300"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? `Expand ${section.title}` : `Collapse ${section.title}`}
          className="mt-1 grid h-8 w-8 flex-shrink-0 cursor-pointer place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/6 dark:hover:text-white"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", collapsed && "-rotate-90")} />
        </button>
        <div className="min-w-0 flex-1 pl-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600 dark:text-brand-300">Module {index + 1}</p>
          <div className="flex min-w-0 items-center">
            <InlineText
              value={section.title}
              disabled={readOnly}
              ariaLabel="Module title"
              className="font-display text-[15px] font-bold tracking-tight text-slate-900 dark:text-white"
              onSave={(title) => run(() => studioApi.updateSection(courseId, section.id, { title }), { success: "Module renamed" })}
            />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{plural(items.length, "item")}</span>
            {minutes > 0 && <span>{formatMinutes(minutes)}</span>}
            <GuestLecturers section={section} readOnly={readOnly} />
          </div>
        </div>
        {!readOnly && (
          <div className="flex flex-shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" icon={Plus} onClick={onAddItem} className="hidden sm:inline-flex">
              Add item
            </Button>
            <Menu
              trigger={<Button variant="ghost" size="sm" iconOnly icon={MoreHorizontal} aria-label={`More actions for ${section.title}`} />}
              items={[
                { label: "Add item", icon: Plus, onSelect: onAddItem },
                {
                  label: "Rename module",
                  icon: Pencil,
                  onSelect: () => {
                    // Start inline editing once the menu has closed and returned focus.
                    setTimeout(
                      () =>
                        document
                          .getElementById(`module-${section.id}`)
                          ?.querySelector<HTMLButtonElement>('[aria-label^="Module title"]')
                          ?.click(),
                      60,
                    );
                  },
                },
                "separator",
                { label: "Delete module", icon: Trash2, danger: true, onSelect: () => setConfirmDelete(true) },
              ]}
            />
          </div>
        )}
      </div>

      {/* Items */}
      {!collapsed && (
        <div className="border-t border-slate-100 px-2 pb-2 pt-1.5 sm:px-3 dark:border-ink-line">
          {items.length ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[verticalOnly]} onDragEnd={onDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <ul className="flex flex-col gap-0.5">
                  {items.map((item, i) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      index={i}
                      sectionId={section.id}
                      sectionTitle={section.title}
                      readOnly={readOnly}
                      onOpen={() => onOpenItem(item.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
              {readOnly ? "This module has no items." : "This module is empty. Add a video, reading, live class or assessment."}
            </p>
          )}
          {!readOnly && (
            <button
              type="button"
              onClick={onAddItem}
              className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700 dark:border-ink-line dark:text-slate-400 dark:hover:border-brand-400/40 dark:hover:bg-brand-400/5 dark:hover:text-brand-300"
            >
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-slate-100 dark:bg-white/6">
                <Plus className="h-3.5 w-3.5" />
              </span>
              Add lesson or assessment
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete “${section.title}”?`}
        description={
          items.length
            ? `This removes the module and its ${plural(items.length, "item")}, including any uploads and questions inside them.`
            : "This removes the empty module."
        }
        confirmLabel="Delete module"
        onConfirm={async () => {
          const ok = await run(
            async () => {
              await studioApi.deleteSection(courseId, section.id);
              return true;
            },
            { success: "Module deleted" },
          );
          if (!ok) throw new Error("failed");
        }}
      />
    </section>
  );
}
