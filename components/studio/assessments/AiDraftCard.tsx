"use client";

import { AlertTriangle, Check, Plus, Trash2, X } from "lucide-react";
import { Badge, Button, Segmented, cn } from "@/components/ui/primitives";
import type { MultiAnswerMode } from "@/lib/studio/types";
import { LIMITS, draftIssues, newDraftOption, type DraftOption, type DraftQuestion } from "./aiAuthoring";

const BARE =
  "w-full resize-none rounded-lg border border-transparent bg-transparent px-2 py-1 outline-none transition hover:border-slate-200 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-400/15 dark:hover:border-ink-line dark:focus:bg-ink-page/60";

/** An AI-drafted question the instructor can tidy up before it's saved. */
export function AiDraftCard({
  draft,
  index,
  onChange,
  onRemove,
  disabled,
}: {
  draft: DraftQuestion;
  index: number;
  onChange: (next: DraftQuestion) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const issues = draftIssues(draft);
  const patch = (p: Partial<DraftQuestion>) => onChange({ ...draft, ...p });

  function setOption(key: number, p: Partial<DraftOption>) {
    patch({
      options: draft.options.map((o) => {
        if (o.key === key) return { ...o, ...p };
        // One-answer questions behave like radio buttons.
        if (p.correct && !draft.multiple) return { ...o, correct: false };
        return o;
      }),
    });
  }

  function setMultiple(multiple: boolean) {
    if (multiple) return patch({ multiple });
    let seen = false;
    patch({
      multiple,
      options: draft.options.map((o) => {
        if (o.correct && !seen) {
          seen = true;
          return o;
        }
        return { ...o, correct: false };
      }),
    });
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition sm:p-4",
        draft.selected
          ? "border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-ink-line dark:bg-ink-surface"
          : "border-dashed border-slate-200 bg-slate-50/50 dark:border-ink-line dark:bg-white/[0.015]",
      )}
    >
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={draft.selected}
          disabled={disabled}
          onChange={(e) => patch({ selected: e.target.checked })}
          aria-label={`Keep question ${index + 1}`}
          className="mt-2 h-4 w-4 flex-shrink-0 cursor-pointer accent-brand-600 dark:accent-brand-400"
        />
        <div className={cn("min-w-0 flex-1", !draft.selected && "opacity-60")}>
          <div className="flex items-start gap-1">
            <span className="mt-1.5 w-6 flex-shrink-0 text-sm font-bold text-slate-400">{index + 1}.</span>
            <textarea
              aria-label={`Question ${index + 1}`}
              value={draft.text}
              disabled={disabled}
              rows={Math.min(5, Math.max(1, Math.ceil(draft.text.length / 80)))}
              onChange={(e) => patch({ text: e.target.value })}
              className={cn(BARE, "text-sm font-semibold leading-6 text-slate-900 dark:text-white")}
            />
            <Button
              variant="ghost"
              size="xs"
              iconOnly
              icon={Trash2}
              aria-label={`Discard question ${index + 1}`}
              title="Discard"
              disabled={disabled}
              onClick={onRemove}
              className="mt-0.5 text-slate-400 hover:text-rose-600"
            />
          </div>

          <ul className="mt-1.5 flex flex-col gap-1 pl-6">
            {draft.options.map((o, i) => (
              <li key={o.key} className="group flex items-center gap-1.5">
                <button
                  type="button"
                  role={draft.multiple ? "checkbox" : "radio"}
                  aria-checked={o.correct}
                  aria-label={`Mark option ${i + 1} as correct`}
                  disabled={disabled}
                  onClick={() => setOption(o.key, { correct: draft.multiple ? !o.correct : true })}
                  className={cn(
                    "grid h-5 w-5 flex-shrink-0 cursor-pointer place-items-center border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60",
                    draft.multiple ? "rounded-md" : "rounded-full",
                    o.correct
                      ? "border-brand-600 bg-brand-600 text-white dark:border-brand-400 dark:bg-brand-400 dark:text-[#06130d]"
                      : "border-slate-300 bg-white text-transparent hover:border-brand-400 hover:text-brand-300 dark:border-white/20 dark:bg-transparent",
                  )}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </button>
                <input
                  aria-label={`Option ${i + 1}`}
                  value={o.text}
                  maxLength={500}
                  disabled={disabled}
                  placeholder={`Option ${i + 1}`}
                  onChange={(e) => setOption(o.key, { text: e.target.value })}
                  className={cn(
                    BARE,
                    "h-8 text-[13px]",
                    o.correct ? "font-medium text-brand-800 dark:text-brand-200" : "text-slate-600 dark:text-slate-300",
                  )}
                />
                <Button
                  variant="ghost"
                  size="xs"
                  iconOnly
                  icon={X}
                  aria-label={`Remove option ${i + 1}`}
                  disabled={disabled || draft.options.length <= LIMITS.optionsMin}
                  onClick={() => patch({ options: draft.options.filter((x) => x.key !== o.key) })}
                  className="opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
                />
              </li>
            ))}
          </ul>

          <div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
            {draft.options.length < LIMITS.optionsMax && (
              <Button
                variant="ghost"
                size="xs"
                icon={Plus}
                disabled={disabled}
                onClick={() => patch({ options: [...draft.options, newDraftOption()] })}
              >
                Option
              </Button>
            )}
            <Segmented
              size="sm"
              value={draft.multiple ? "multi" : "single"}
              onChange={(k) => setMultiple(k === "multi")}
              options={[
                { key: "single", label: "One answer" },
                { key: "multi", label: "Several" },
              ]}
            />
            {draft.multiple && (
              <Segmented<MultiAnswerMode>
                size="sm"
                value={draft.mode}
                onChange={(mode) => patch({ mode })}
                options={[
                  { key: "OR", label: "Partial credit" },
                  { key: "AND", label: "All or nothing" },
                ]}
              />
            )}
            {draft.selected && issues.length > 0 && (
              <Badge size="xs" tone="warning" icon={AlertTriangle}>
                {issues[0]}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
