"use client";

import { useState } from "react";
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CornerDownLeft, GripVertical, X, type LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { useSortSensors, verticalOnly } from "../curriculum/SectionCard";

function Row({
  id,
  value,
  index,
  icon: Icon,
  disabled,
  onChange,
  onRemove,
}: {
  id: string;
  value: string;
  index: number;
  icon?: LucideIcon;
  disabled?: boolean;
  onChange: (v: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-1.5 rounded-lg border border-transparent bg-white py-0.5 pr-1 transition-colors dark:bg-transparent",
        !disabled && "hover:border-slate-200 dark:hover:border-ink-line",
        isDragging && "relative z-10 border-brand-300 shadow-lg dark:border-brand-400/50 dark:bg-ink-raised",
      )}
    >
      {!disabled ? (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reorder item ${index + 1}`}
          className="flex h-8 w-5 flex-shrink-0 cursor-grab touch-none items-center justify-center text-slate-300 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing dark:text-slate-600"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      ) : (
        <span className="w-1" />
      )}
      {Icon && <Icon className="h-4 w-4 flex-shrink-0 text-brand-500 dark:text-brand-400" strokeWidth={2.2} />}
      <input
        value={value}
        disabled={disabled}
        aria-label={`Item ${index + 1}`}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 min-w-0 flex-1 rounded-md bg-transparent px-1.5 text-sm text-slate-800 outline-none focus:bg-slate-50 disabled:cursor-default dark:text-slate-100 dark:focus:bg-white/5"
      />
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove item ${index + 1}`}
          className="grid h-7 w-7 flex-shrink-0 cursor-pointer place-items-center rounded-md text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-rose-500/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}

/** Ordered list of short strings: add on Enter, edit inline, drag to reorder. */
export function StringListEditor({
  value,
  onChange,
  disabled,
  placeholder = "Add an item and press Enter",
  icon,
  emptyText = "Nothing added yet.",
  id,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  icon?: LucideIcon;
  emptyText?: string;
  id?: string;
}) {
  const sensors = useSortSensors();
  const [draft, setDraft] = useState("");
  const ids = value.map((_, i) => `row-${i}`);

  function add() {
    const t = draft.trim();
    if (!t) return;
    onChange([...value, t]);
    setDraft("");
  }

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    onChange(arrayMove(value, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id))));
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-1.5 dark:border-ink-line dark:bg-ink-page/40">
      {value.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[verticalOnly]} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col">
              {value.map((v, i) => (
                <Row
                  key={ids[i]}
                  id={ids[i]}
                  index={i}
                  value={v}
                  icon={icon}
                  disabled={disabled}
                  onChange={(next) => onChange(value.map((x, j) => (j === i ? next : x)))}
                  onRemove={() => onChange(value.filter((_, j) => j !== i))}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        disabled && <p className="px-2.5 py-2 text-sm text-slate-400">{emptyText}</p>
      )}
      {!disabled && (
        <div className={cn("flex items-center gap-2 px-1", value.length > 0 && "mt-1 border-t border-slate-100 pt-1.5 dark:border-ink-line")}>
          <input
            id={id}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            onBlur={add}
            placeholder={placeholder}
            className="h-9 min-w-0 flex-1 bg-transparent px-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          <kbd className="hidden items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline-flex dark:border-ink-line">
            <CornerDownLeft className="h-3 w-3" /> Enter
          </kbd>
        </div>
      )}
    </div>
  );
}
