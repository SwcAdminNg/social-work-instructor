"use client";

// Shared with the admin app (admin/components/ui/select) so both platforms look and behave the same.

import {
  Children,
  Fragment,
  forwardRef,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import * as Popover from "@radix-ui/react-popover";
import * as RadixDialog from "@radix-ui/react-dialog";
import { Check, ChevronDown, Search, X, type LucideIcon } from "lucide-react";
import { cn } from "../primitives";
import type { Tone } from "@/lib/studio/labels";

/* ───────────── Types ───────────── */

export type SelectOption = {
  value: string;
  label: string;
  /** Secondary line under the label. */
  description?: string;
  icon?: LucideIcon;
  /** Coloured status dot before the label. */
  tone?: Tone;
  disabled?: boolean;
  /** Extra text matched by search (e.g. an email). */
  keywords?: string;
};

export type SelectGroup = { label: string; options: SelectOption[] };

export type SelectProps = {
  /** null/undefined are treated as "" (nothing selected unless an option has value ""). */
  value: string | null | undefined;
  onChange: (value: string) => void;
  /** Options as data. Alternatively pass native-style `<option>` / `<optgroup>` children. */
  options?: (SelectOption | SelectGroup)[];
  children?: React.ReactNode;
  placeholder?: string;
  /** Show a search box. Defaults to on when there are more than 8 options. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Show an × that resets to `clearValue` (default ""). */
  clearable?: boolean;
  clearValue?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  id?: string;
  name?: string;
  size?: "sm" | "md";
  /** Leading icon in the trigger (used when the selected option has none). */
  icon?: LucideIcon;
  /** Heading of the mobile sheet; falls back to aria-label / placeholder. */
  title?: string;
  emptyText?: string;
  className?: string;
  /** Width of the dropdown list: match the trigger (default) or size to content. */
  menuWidth?: "trigger" | "auto";
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

type FlatItem = { kind: "option"; option: SelectOption } | { kind: "group"; label: string };

/* ───────────── Helpers ───────────── */

const DOT: Record<Tone, string> = {
  neutral: "bg-slate-400",
  brand: "bg-brand-500",
  info: "bg-sky-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  violet: "bg-violet-500",
};

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/** Read native `<option>` / `<optgroup>` children (incl. fragments and mapped arrays). */
function optionsFromChildren(children: React.ReactNode): (SelectOption | SelectGroup)[] {
  const out: (SelectOption | SelectGroup)[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Fragment) {
      out.push(...optionsFromChildren((child.props as { children?: React.ReactNode }).children));
    } else if (child.type === "optgroup") {
      const p = child.props as { label?: string; children?: React.ReactNode };
      out.push({ label: p.label ?? "", options: optionsFromChildren(p.children) as SelectOption[] });
    } else if (child.type === "option") {
      const p = child.props as { value?: string | number; children?: React.ReactNode; disabled?: boolean };
      const label = textOf(p.children).trim();
      out.push({ value: p.value != null ? String(p.value) : label, label, disabled: p.disabled });
    }
  });
  return out;
}

const isGroup = (o: SelectOption | SelectGroup): o is SelectGroup => "options" in o;

/** Visible rows (group headers + options) for a search query. */
function buildRows(all: (SelectOption | SelectGroup)[], query: string): FlatItem[] {
  const q = query.trim().toLowerCase();
  const match = (o: SelectOption) =>
    !q || `${o.label} ${o.description ?? ""} ${o.keywords ?? ""}`.toLowerCase().includes(q);
  const rows: FlatItem[] = [];
  for (const o of all) {
    if (isGroup(o)) {
      const opts = o.options.filter(match);
      if (opts.length) rows.push({ kind: "group", label: o.label }, ...opts.map((option) => ({ kind: "option" as const, option })));
    } else if (match(o)) rows.push({ kind: "option", option: o });
  }
  return rows;
}

const enabledRows = (rows: FlatItem[]) =>
  rows.map((r, i) => (r.kind === "option" && !r.option.disabled ? i : -1)).filter((i) => i >= 0);

const subscribeMedia = (cb: () => void) => {
  const mq = window.matchMedia("(max-width: 639px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** True on phone-width screens, where the list opens as a bottom sheet. */
function useIsPhone() {
  return useSyncExternalStore(subscribeMedia, () => window.matchMedia("(max-width: 639px)").matches, () => false);
}

/* ───────────── Select ───────────── */

/**
 * Accessible, searchable select. Opens as an anchored popover (flips/resizes to
 * stay on screen) on desktop and as a bottom sheet on phones.
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    value: rawValue,
    onChange,
    options: optionsProp,
    children,
    placeholder = "Select…",
    searchable,
    searchPlaceholder = "Search…",
    clearable,
    clearValue = "",
    disabled,
    required,
    invalid,
    id,
    name,
    size = "md",
    icon: TriggerIcon,
    title,
    emptyText = "No matches",
    className,
    menuWidth = "trigger",
    ...aria
  },
  ref,
) {
  const value = rawValue ?? "";
  const listId = useId();
  const isPhone = useIsPhone();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const typeahead = useRef({ text: "", at: 0 });

  const allOptions = useMemo(() => optionsProp ?? optionsFromChildren(children), [optionsProp, children]);
  const flatOptions = useMemo(
    () => allOptions.flatMap((o) => (isGroup(o) ? o.options : [o])),
    [allOptions],
  );
  const selected = flatOptions.find((o) => o.value === value);
  const showSearch = searchable ?? flatOptions.length > 8;

  const items = useMemo(() => buildRows(allOptions, query), [allOptions, query]);
  const optionRows = enabledRows(items);

  function openMenu() {
    if (disabled) return;
    // Highlight the selected option (or the first enabled one) in the unfiltered list.
    const rows = buildRows(allOptions, "");
    const idx = rows.findIndex((r) => r.kind === "option" && r.option.value === value);
    setQuery("");
    setActive(idx >= 0 ? idx : enabledRows(rows)[0] ?? -1);
    setOpen(true);
  }

  function search(next: string) {
    setQuery(next);
    // Keep the highlight on the same option if it's still visible, else the first match.
    const rows = buildRows(allOptions, next);
    const current = items[active];
    const keep = current?.kind === "option" ? rows.findIndex((r) => r.kind === "option" && r.option.value === current.option.value) : -1;
    setActive(keep >= 0 ? keep : enabledRows(rows)[0] ?? -1);
  }

  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  // Focus goes back to the trigger after picking or Escape — not after clicking elsewhere.
  const returnFocus = useRef(false);

  function choose(option: SelectOption) {
    if (option.disabled) return;
    returnFocus.current = true;
    onChange(option.value);
    setOpen(false);
  }

  function onCloseAutoFocus(e: Event) {
    e.preventDefault();
    if (returnFocus.current) triggerRef.current?.focus();
    returnFocus.current = false;
  }

  function move(delta: number | "first" | "last") {
    if (!optionRows.length) return;
    const pos = optionRows.indexOf(active);
    let next: number;
    if (delta === "first") next = 0;
    else if (delta === "last") next = optionRows.length - 1;
    else next = pos < 0 ? 0 : Math.min(optionRows.length - 1, Math.max(0, pos + delta));
    setActive(optionRows[next]);
  }

  /** Jump to the next option starting with the typed text (native select behaviour). */
  function typeTo(char: string, fromIndex: number, list: { option: SelectOption; index: number }[]) {
    const now = Date.now();
    const t = typeahead.current;
    t.text = now - t.at > 600 ? char : t.text + char;
    t.at = now;
    const needle = t.text.toLowerCase();
    const start = list.findIndex((x) => x.index === fromIndex);
    const ordered = [...list.slice(start + 1), ...list.slice(0, start + 1)];
    // "aaa" cycles through options starting with "a"; otherwise match the whole buffer.
    const repeat = needle.length > 1 && needle.split("").every((c) => c === needle[0]);
    const hit = ordered.find((x) => x.option.label.toLowerCase().startsWith(repeat ? needle[0] : needle));
    if (hit || needle.length === 1) return hit;
    // No match for the buffer: start a fresh search with just this key.
    t.text = char;
    return ordered.find((x) => x.option.label.toLowerCase().startsWith(char.toLowerCase()));
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        return move(1);
      case "ArrowUp":
        e.preventDefault();
        return move(-1);
      case "PageDown":
        e.preventDefault();
        return move(8);
      case "PageUp":
        e.preventDefault();
        return move(-8);
      case "Home":
        if (showSearch && e.currentTarget.tagName === "INPUT") return;
        e.preventDefault();
        return move("first");
      case "End":
        if (showSearch && e.currentTarget.tagName === "INPUT") return;
        e.preventDefault();
        return move("last");
      case "Enter": {
        e.preventDefault();
        const row = items[active];
        if (row?.kind === "option") choose(row.option);
        return;
      }
      case "Tab":
        setOpen(false);
        return;
    }
    if (!showSearch && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const list = optionRows.map((index) => ({ index, option: (items[index] as { option: SelectOption }).option }));
      const hit = typeTo(e.key, active, list);
      if (hit) setActive(hit.index);
    }
  }

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if (open) return;
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openMenu();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Closed + typing: change the value directly, like a native select.
      const enabled = flatOptions.filter((o) => !o.disabled).map((option, index) => ({ option, index }));
      const current = enabled.findIndex((x) => x.option.value === value);
      const hit = typeTo(e.key, current, enabled);
      if (hit && hit.option.value !== value) onChange(hit.option.value);
    }
  }

  const activeId = active >= 0 ? `${listId}-opt-${active}` : undefined;
  const LeadIcon = selected?.icon ?? TriggerIcon;
  const canClear = clearable && !disabled && value !== clearValue && value !== "";

  const trigger = (
    <button
      ref={(node) => {
        triggerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      id={id}
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-invalid={invalid || undefined}
      disabled={disabled}
      onClick={() => (open ? setOpen(false) : openMenu())}
      onKeyDown={onTriggerKeyDown}
      {...aria}
      className={cn(
        "group flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white pl-3 text-left text-slate-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition hover:border-slate-300 focus-visible:border-brand-400 focus-visible:ring-4 focus-visible:ring-brand-400/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 aria-expanded:border-brand-400 aria-expanded:ring-4 aria-expanded:ring-brand-400/15 dark:border-ink-line dark:bg-ink-page/60 dark:text-white dark:hover:border-white/20 dark:disabled:bg-white/[0.03]",
        size === "sm" ? "h-9 text-[13px]" : "h-10 text-sm",
        canClear ? "pr-14" : "pr-9",
        invalid && "border-rose-400",
      )}
    >
      {selected?.tone ? (
        <span className={cn("h-2 w-2 flex-shrink-0 rounded-full", DOT[selected.tone])} />
      ) : (
        LeadIcon && <LeadIcon className="h-4 w-4 flex-shrink-0 text-slate-400" strokeWidth={2} />
      )}
      <span className={cn("min-w-0 flex-1 truncate", !selected && "text-slate-400 dark:text-slate-500")}>
        {selected ? selected.label : placeholder}
      </span>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform duration-200 group-aria-expanded:rotate-180"
        strokeWidth={2}
      />
    </button>
  );

  const searchBox = showSearch && (
    <div className="flex-shrink-0 border-b border-slate-100 p-2 dark:border-ink-line">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus={!isPhone}
          value={query}
          onChange={(e) => search(e.target.value)}
          onKeyDown={onListKeyDown}
          placeholder={searchPlaceholder}
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-8 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-400/15 dark:border-ink-line dark:bg-white/[0.03] dark:text-white dark:focus:bg-ink-page/60"
        />
      </div>
    </div>
  );

  const list = (
    <div
      ref={listRef}
      id={listId}
      role="listbox"
      tabIndex={showSearch ? -1 : 0}
      aria-activedescendant={showSearch ? undefined : activeId}
      aria-label={aria["aria-label"] ?? title ?? placeholder}
      onKeyDown={showSearch ? undefined : onListKeyDown}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 outline-none"
    >
      {items.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
      ) : (
        items.map((row, i) =>
          row.kind === "group" ? (
            <p
              key={`g-${row.label}-${i}`}
              role="presentation"
              className="px-2.5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 first:pt-1.5 dark:text-slate-500"
            >
              {row.label}
            </p>
          ) : (
            <OptionRow
              key={`${row.option.value}-${i}`}
              id={`${listId}-opt-${i}`}
              index={i}
              option={row.option}
              selected={row.option.value === value}
              active={i === active}
              roomy={isPhone}
              onHover={() => !row.option.disabled && setActive(i)}
              onChoose={() => choose(row.option)}
            />
          ),
        )
      )}
    </div>
  );

  return (
    <div className={cn("relative w-full min-w-0", className)}>
      {isPhone ? (
        <>
          {trigger}
          <RadixDialog.Root open={open} onOpenChange={setOpen}>
            {open && (
              <RadixDialog.Portal>
                <RadixDialog.Overlay className="fixed inset-0 z-[90] animate-fade-in bg-slate-950/50 backdrop-blur-[2px]" />
                <RadixDialog.Content
                  aria-describedby={undefined}
                  onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    listRef.current?.focus();
                  }}
                  onEscapeKeyDown={() => (returnFocus.current = true)}
                  onCloseAutoFocus={onCloseAutoFocus}
                  className="fixed inset-x-0 bottom-0 z-[91] flex max-h-[min(85dvh,calc(100dvh-max(0.75rem,env(safe-area-inset-top))))] w-full animate-sheet-up flex-col overflow-hidden rounded-t-3xl border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-24px_60px_-30px_rgba(15,23,42,0.45)] outline-none dark:border-ink-line dark:bg-ink-surface"
                >
                  <div aria-hidden="true" className="flex justify-center pt-2.5">
                    <span className="h-1.5 w-10 rounded-full bg-slate-200 dark:bg-white/15" />
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3 px-4 pb-2 pt-2">
                    <RadixDialog.Title className="min-w-0 flex-1 truncate font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">
                      {title ?? aria["aria-label"] ?? placeholder}
                    </RadixDialog.Title>
                    <RadixDialog.Close
                      aria-label="Close"
                      className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/8"
                    >
                      <X className="h-4 w-4" />
                    </RadixDialog.Close>
                  </div>
                  {searchBox}
                  {list}
                </RadixDialog.Content>
              </RadixDialog.Portal>
            )}
          </RadixDialog.Root>
        </>
      ) : (
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Anchor asChild>{trigger}</Popover.Anchor>
          {/* Rendered only while open: closing unmounts immediately instead of
              waiting for an animation to finish (which can stall off-screen). */}
          {open && (
            <Popover.Portal>
              <Popover.Content
                align="start"
                sideOffset={6}
                collisionPadding={12}
                onOpenAutoFocus={(e) => {
                  if (!showSearch) {
                    e.preventDefault();
                    listRef.current?.focus();
                  }
                }}
                onEscapeKeyDown={() => (returnFocus.current = true)}
                onCloseAutoFocus={onCloseAutoFocus}
                onInteractOutside={(e) => {
                  // Clicking the trigger toggles it; don't let Radix close-then-reopen.
                  if (triggerRef.current?.contains(e.target as Node)) e.preventDefault();
                }}
                className={cn(
                  "z-[90] flex max-h-[min(22rem,var(--radix-popover-content-available-height))] max-w-[min(28rem,var(--radix-popover-content-available-width))] animate-pop-in flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_48px_-16px_rgba(15,23,42,0.35)] outline-none dark:border-ink-line dark:bg-ink-raised",
                  menuWidth === "trigger" ? "w-[var(--radix-popover-trigger-width)] min-w-48" : "min-w-[max(12rem,var(--radix-popover-trigger-width))]",
                )}
              >
                {searchBox}
                {list}
              </Popover.Content>
            </Popover.Portal>
          )}
        </Popover.Root>
      )}

      {canClear && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Clear selection"
          onClick={() => onChange(clearValue)}
          className="absolute right-8 top-1/2 grid h-6 w-6 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/8 dark:hover:text-white"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.2} />
        </button>
      )}

      {/* Keeps native `required` validation and `name`-based form posts working. */}
      <input
        tabIndex={-1}
        aria-hidden="true"
        name={name}
        required={required}
        value={value}
        onChange={() => {}}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full opacity-0"
      />
    </div>
  );
});

function OptionRow({
  id,
  index,
  option,
  selected,
  active,
  roomy,
  onHover,
  onChoose,
}: {
  id: string;
  index: number;
  option: SelectOption;
  selected: boolean;
  active: boolean;
  roomy: boolean;
  onHover: () => void;
  onChoose: () => void;
}) {
  const Icon = option.icon;
  return (
    <div
      id={id}
      role="option"
      data-index={index}
      aria-selected={selected}
      aria-disabled={option.disabled || undefined}
      onMouseMove={onHover}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onChoose}
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors",
        roomy ? "min-h-11 py-2" : "min-h-9 py-1.5",
        option.disabled
          ? "cursor-not-allowed opacity-40"
          : active
            ? "bg-slate-100 text-slate-900 dark:bg-white/8 dark:text-white"
            : "text-slate-700 dark:text-slate-200",
      )}
    >
      {option.tone ? (
        <span className={cn("h-2 w-2 flex-shrink-0 rounded-full", DOT[option.tone])} />
      ) : (
        Icon && (
          <span
            className={cn(
              "grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg",
              selected ? "bg-brand-50 text-brand-600 dark:bg-brand-400/12 dark:text-brand-300" : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        )
      )}
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate", selected && "font-semibold text-brand-700 dark:text-brand-300")}>{option.label}</span>
        {option.description && (
          <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{option.description}</span>
        )}
      </span>
      {selected && <Check className="h-4 w-4 flex-shrink-0 text-brand-600 dark:text-brand-300" strokeWidth={2.4} />}
    </div>
  );
}
