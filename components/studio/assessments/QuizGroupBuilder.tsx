"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, Ellipsis, Layers, Plus, Shuffle, Trash2 } from "lucide-react";
import { Badge, Button, EmptyState, Input, Segmented, cn } from "@/components/ui/primitives";
import { ConfirmDialog, Menu } from "@/components/ui/overlays";
import { studioApi } from "@/lib/studio/api";
import type { QuizGroupSection } from "@/lib/studio/types";
import { QuestionBuilder } from "./QuestionBuilder";
import { InlineInput, byOrder, nextOrderIndex, questionsSummary } from "./shared";
import { useAssessmentWrite } from "./useAssessmentWrite";

export function groupStats(sections: QuizGroupSection[]) {
  const pool = sections.reduce((n, s) => n + (s.questions?.length ?? 0), 0);
  const perAttempt = sections.reduce((n, s) => {
    const size = s.questions?.length ?? 0;
    return n + (s.questions_to_ask ? Math.min(s.questions_to_ask, size) : size);
  }, 0);
  return { pool, perAttempt };
}

export function QuizGroupBuilder({
  itemId,
  sections: rawSections,
  readOnly,
}: {
  itemId: string;
  sections: QuizGroupSection[] | undefined;
  readOnly: boolean;
}) {
  const write = useAssessmentWrite();
  const sections = byOrder(rawSections);
  const { pool, perAttempt } = groupStats(sections);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set());

  async function addSection() {
    const title = newTitle.trim() || `Section ${sections.length + 1}`;
    setAdding(true);
    const ok = await write(
      () => studioApi.createGroupSection(itemId, { title, order_index: nextOrderIndex(sections), questions_to_ask: null }),
      { success: "Section added" },
    );
    setAdding(false);
    if (ok) setNewTitle("");
  }

  function toggle(i: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-[15px] font-bold text-slate-900 dark:text-white">Sections & question pools</h3>
            <Badge size="xs">{sections.length}</Badge>
          </div>
          <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Each attempt draws questions from every section. Learners only see how many — never the pool.
          </p>
        </div>
        {sections.length > 0 && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-100">{perAttempt}</span> per attempt · {pool} in pools
          </p>
        )}
      </div>

      {sections.length === 0 && (
        <EmptyState
          compact
          icon={Layers}
          title="No sections yet"
          description={
            readOnly
              ? "This quiz group has no sections."
              : "Split the exam into sections (e.g. “Legislation”, “Practice scenarios”), each with its own pool of questions."
          }
        />
      )}

      {sections.map((s, i) => (
        <GroupSectionCard
          key={i}
          section={s}
          index={i}
          readOnly={readOnly}
          collapsed={collapsed.has(i)}
          onToggle={() => toggle(i)}
        />
      ))}

      {!readOnly && (
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-slate-300 p-3 sm:flex-row sm:items-center dark:border-ink-line">
          <Input
            aria-label="New section title"
            placeholder={`Section ${sections.length + 1} title, e.g. “Legislation”`}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSection();
              }
            }}
            className="h-9"
          />
          <Button size="sm" variant="secondary" icon={Plus} loading={adding} onClick={addSection}>
            Add section
          </Button>
        </div>
      )}
    </section>
  );
}

function GroupSectionCard({
  section,
  index,
  readOnly,
  collapsed,
  onToggle,
}: {
  section: QuizGroupSection;
  index: number;
  readOnly: boolean;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const write = useAssessmentWrite();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const questions = section.questions ?? [];
  const poolSize = questions.length;
  const draw = section.questions_to_ask ?? null;
  const { withIssues } = questionsSummary(questions);
  const overDraw = draw !== null && draw > poolSize;

  // The draw count is typed locally and saved on blur.
  const [drawDraft, setDrawDraft] = useState(draw ? String(draw) : "");
  const [prevDraw, setPrevDraw] = useState(draw);
  if (draw !== prevDraw) {
    setPrevDraw(draw);
    setDrawDraft(draw ? String(draw) : "");
  }

  async function setDraw(next: number | null) {
    if (next === draw) return;
    const ok = await write(() => studioApi.updateGroupSection(section.id, { questions_to_ask: next }));
    if (!ok) setDrawDraft(draw ? String(draw) : "");
  }

  function commitDraft() {
    const n = Math.floor(Number(drawDraft));
    if (!drawDraft.trim() || !Number.isFinite(n) || n < 1) {
      setDrawDraft(draw ? String(draw) : "");
      return;
    }
    setDraw(n);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/50 dark:border-ink-line dark:bg-white/[0.015]">
      <div className="flex items-start gap-2 border-b border-slate-200/80 bg-white px-3 py-3 dark:border-ink-line dark:bg-ink-surface">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand section" : "Collapse section"}
          className="mt-1.5 grid h-7 w-7 flex-shrink-0 cursor-pointer place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/8"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", collapsed && "-rotate-90")} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Section {index + 1}</p>
          {readOnly ? (
            <p className="px-2 font-display text-[15px] font-bold text-slate-900 dark:text-white">{section.title}</p>
          ) : (
            <InlineInput
              aria-label={`Section ${index + 1} title`}
              value={section.title ?? ""}
              maxLength={255}
              onCommit={(title) => write(() => studioApi.updateGroupSection(section.id, { title }))}
              className="h-8 border-transparent bg-transparent px-2 font-display text-[15px] font-bold shadow-none hover:border-slate-200 focus:bg-white dark:bg-transparent dark:hover:border-ink-line"
            />
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 px-2">
            {readOnly ? (
              <Badge size="xs" tone="brand" icon={Shuffle}>
                {draw ? `Asks ${draw} of ${poolSize}` : `Asks all ${poolSize}`}
              </Badge>
            ) : (
              <>
                <Segmented
                  size="sm"
                  value={draw === null ? "all" : "random"}
                  onChange={(k) => setDraw(k === "all" ? null : Math.max(1, Math.min(poolSize || 1, 5)))}
                  options={[
                    { key: "all", label: "Ask all" },
                    { key: "random", label: "Random draw", icon: Shuffle },
                  ]}
                />
                {draw !== null && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Ask
                    <Input
                      aria-label="Questions to ask"
                      type="number"
                      min={1}
                      value={drawDraft}
                      onChange={(e) => setDrawDraft(e.target.value)}
                      onBlur={commitDraft}
                      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      invalid={overDraw}
                      className="h-7 w-16 px-2 text-center text-xs"
                    />
                    of {poolSize}
                  </span>
                )}
              </>
            )}
            {overDraw && (
              <Badge size="xs" tone="warning" icon={AlertTriangle}>
                Pool only has {poolSize}
              </Badge>
            )}
            {poolSize === 0 && (
              <Badge size="xs" tone="warning" icon={AlertTriangle}>
                Empty pool
              </Badge>
            )}
            {withIssues > 0 && (
              <Badge size="xs" tone="warning" icon={AlertTriangle}>
                {withIssues} incomplete
              </Badge>
            )}
          </div>
        </div>
        {!readOnly && (
          <Menu
            trigger={<Button variant="ghost" size="sm" iconOnly icon={Ellipsis} aria-label={`Section ${index + 1} options`} />}
            items={[{ label: "Delete section", icon: Trash2, danger: true, onSelect: () => setConfirmDelete(true) }]}
          />
        )}
      </div>

      {!collapsed && (
        <div className="p-3 sm:p-4">
          <QuestionBuilder
            title="Question pool"
            questions={questions}
            target={{ kind: "group", sectionId: section.id }}
            readOnly={readOnly}
            drawCount={draw}
          />
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete “${section.title}”?`}
        description={`This removes the section and all ${poolSize} question${poolSize === 1 ? "" : "s"} in its pool.`}
        confirmLabel="Delete section"
        onConfirm={async () => {
          const ok = await write(() => studioApi.deleteGroupSection(section.id), { success: "Section deleted" });
          if (!ok) throw new Error("failed");
        }}
      />
    </div>
  );
}
