import type { ReactNode } from "react";

/**
 * Renders an instructor-written lesson description (CourseItem.item_description).
 *
 * The text is plain, not HTML - so there is nothing to sanitise and we never use
 * dangerouslySetInnerHTML. Supported syntax (kept in sync with the editor hint in the
 * instructor/admin item editors):
 *   - a blank line starts a new paragraph
 *   - lines starting with "- " form a bullet list
 *   - a line starting with "## " is a sub-heading
 *   - **text** is bold
 */
type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "h"; text: string };

function parseBlocks(source: string): Block[] {
  return source
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): Block => {
      const lines = chunk.split("\n").map((line) => line.trimEnd());
      if (lines.length === 1 && lines[0].startsWith("## ")) {
        return { kind: "h", text: lines[0].slice(3).trim() };
      }
      if (lines.every((line) => /^[-•]\s+/.test(line))) {
        return { kind: "ul", items: lines.map((line) => line.replace(/^[-•]\s+/, "")) };
      }
      return { kind: "p", lines };
    });
}

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={index} className="font-semibold text-slate-950 dark:text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function LessonDescription({ text }: { text?: string | null }) {
  const blocks = parseBlocks(text || "");
  if (blocks.length === 0) return null;

  return (
    <section aria-label="Lesson description" className="mt-0 max-w-[68ch] space-y-4">
      {blocks.map((block, index) => {
        if (block.kind === "h") {
          return (
            <h2
              key={index}
              className="pt-2 text-[1.0625rem] font-semibold tracking-[-0.01em] text-slate-950 dark:text-white"
            >
              {block.text}
            </h2>
          );
        }
        if (block.kind === "ul") {
          return (
            <ul key={index} className="space-y-2">
              {block.items.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  className="grid grid-cols-[6px_minmax(0,1fr)] gap-3 text-[1.0625rem] leading-[1.65] text-slate-700 dark:text-slate-300"
                >
                  <span className="mt-[0.7em] h-1.5 w-1.5 rounded-full bg-[#2D6A4F] dark:bg-[#52b788]" aria-hidden />
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="text-[1.0625rem] leading-[1.7] text-slate-700 dark:text-slate-300">
            {block.lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 && <br />}
                {renderInline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </section>
  );
}
