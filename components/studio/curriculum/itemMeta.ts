import {
  ClipboardList,
  FileText,
  Layers,
  Link2,
  PenLine,
  PlayCircle,
  Radio,
  type LucideIcon,
} from "lucide-react";
import type { Tone } from "@/lib/studio/labels";
import type { Item, Section } from "@/lib/studio/types";

/** What the author picks in "Add lesson" — assessments are split by flavour. */
export type ItemKind = "VIDEO" | "DOCUMENT" | "LINKS" | "LIVE_SESSION" | "QUIZ" | "ESSAY" | "QUIZ_GROUP";

export const KIND_META: Record<ItemKind, { label: string; noun: string; icon: LucideIcon; tone: Tone; description: string }> = {
  VIDEO: {
    label: "Video",
    noun: "video lesson",
    icon: PlayCircle,
    tone: "violet",
    description: "Upload a recorded lesson. We stream it in the best quality for each learner.",
  },
  DOCUMENT: {
    label: "Document",
    noun: "document",
    icon: FileText,
    tone: "info",
    description: "A PDF, slide deck, worksheet or template learners can read.",
  },
  LINKS: {
    label: "Link",
    noun: "link",
    icon: Link2,
    tone: "neutral",
    description: "Point learners to guidance, an article or a resource on another site.",
  },
  LIVE_SESSION: {
    label: "Live session",
    noun: "live session",
    icon: Radio,
    tone: "danger",
    description: "A scheduled live class with a video room created for you.",
  },
  QUIZ: {
    label: "Quiz",
    noun: "quiz",
    icon: ClipboardList,
    tone: "brand",
    description: "Multiple-choice questions, marked automatically.",
  },
  ESSAY: {
    label: "Essay",
    noun: "essay",
    icon: PenLine,
    tone: "warning",
    description: "A written response you mark by hand, with optional moderation.",
  },
  QUIZ_GROUP: {
    label: "Quiz group",
    noun: "quiz group",
    icon: Layers,
    tone: "success",
    description: "An exam built from question pools, drawn at random each attempt.",
  },
};

export function itemKind(item: Pick<Item, "item_type" | "assessment">): ItemKind {
  if (item.item_type === "ASSESSMENT") return (item.assessment?.assessment_type ?? "QUIZ") as ItemKind;
  return item.item_type as ItemKind;
}

export function sortedSections(sections?: Section[]) {
  return [...(sections ?? [])].sort((a, b) => a.order_index - b.order_index);
}

export function sortedItems(section?: Section) {
  return [...(section?.items ?? [])].sort((a, b) => a.order_index - b.order_index);
}

/** Minutes an item contributes to the course length. */
export function itemMinutes(item: Item) {
  if (item.estimated_minutes) return item.estimated_minutes;
  if (item.video?.duration_seconds) return Math.round(item.video.duration_seconds / 60);
  if (item.live_session?.duration_minutes) return item.live_session.duration_minutes;
  return 0;
}

export function sectionMinutes(section: Section) {
  return (section.items ?? []).reduce((sum, i) => sum + itemMinutes(i), 0);
}

export function questionCount(item: Item) {
  const a = item.assessment;
  if (!a) return 0;
  if (a.assessment_type === "QUIZ") return a.quiz?.questions?.length ?? 0;
  if (a.assessment_type === "QUIZ_GROUP")
    return (a.quiz_group?.sections ?? []).reduce((n, s) => n + (s.questions?.length ?? 0), 0);
  return 0;
}

export function plural(n: number, word: string, many = `${word}s`) {
  return `${n} ${n === 1 ? word : many}`;
}
