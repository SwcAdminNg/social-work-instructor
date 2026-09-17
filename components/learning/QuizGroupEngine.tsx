"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  PlayCircle,
  RotateCcw,
  Send,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { IconSpinner } from "@/components/auth/shared/icons";

type QuizGroupOption = { id: string; text: string };

type QuizGroupQuestion = {
  id: string;
  text: string;
  allow_multiple_answers?: boolean | null;
  multi_answer_mode?: string | null;
  options: QuizGroupOption[];
};

type QuizGroupAttemptSection = {
  section_id: string;
  title: string;
  questions: QuizGroupQuestion[];
};

type QuizGroupSectionSummary = {
  id: string;
  title: string;
  order_index?: number | null;
  question_count?: number | null;
};

type QuizGroupSectionResult = {
  section_id: string;
  title: string;
  earned_points: number;
  total_questions: number;
  score_percent: number;
};

type ActiveAttempt = {
  attempt_id: string;
  started_at?: string | null;
  expires_at?: string | null;
  sections: QuizGroupAttemptSection[];
  saved_answers?: Record<string, string[]> | null;
};

type QuizGroupResult = {
  attempt_id?: string;
  score: number | null;
  passed: boolean | null;
  auto_submitted?: boolean | null;
  sections?: QuizGroupSectionResult[] | null;
  result_visible?: boolean | null;
  section_reset?: boolean | null;
  course_reset?: boolean | null;
  message?: string;
};

type QuizGroupData = {
  max_attempts?: number | null;
  attempts_used?: number | null;
  attempts_remaining?: number | null;
  pass_mark_percentage?: number | null;
  show_result_to_student?: boolean | null;
  time_limit_seconds?: number | null;
  sections: QuizGroupSectionSummary[];
  active_attempt?: ActiveAttempt | null;
  previous_result?: QuizGroupResult | null;
};

interface QuizGroupEngineProps {
  courseId: string;
  itemId: string;
  title: string;
  estimatedMinutes?: number | null;
  dueDate?: string | null;
  isFinalAssessment?: boolean | null;
  sectionFirstItemId?: string | null;
  isLastSection?: boolean;
  quizGroup: QuizGroupData;
}

export function QuizGroupEngine({
  courseId,
  itemId,
  estimatedMinutes,
  dueDate,
  isFinalAssessment,
  sectionFirstItemId,
  isLastSection,
  quizGroup,
}: QuizGroupEngineProps) {
  const router = useRouter();
  const [currentTime] = useState(() => Date.now());
  const [attempt, setAttempt] = useState<ActiveAttempt | null>(quizGroup.active_attempt || null);
  const [answers, setAnswers] = useState<Record<string, string[]>>(
    quizGroup.active_attempt?.saved_answers || {},
  );
  const [result, setResult] = useState<QuizGroupResult | null>(quizGroup.previous_result || null);
  const [attemptsUsedThisSession, setAttemptsUsedThisSession] = useState(0);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const submittedRef = useRef(false);
  const timeWarningsAnnouncedRef = useRef<{ oneMinute: boolean; tenSeconds: boolean }>({
    oneMinute: false,
    tenSeconds: false,
  });
  const [timeWarning, setTimeWarning] = useState("");

  // Once the server-provided attempts_remaining reflects a submission (after router.refresh()),
  // drop the local session counter so we don't double-subtract the same attempt.
  const [prevAttemptsSnapshot, setPrevAttemptsSnapshot] = useState({
    attemptsUsed: quizGroup.attempts_used,
    attemptsRemaining: quizGroup.attempts_remaining,
  });
  if (
    prevAttemptsSnapshot.attemptsUsed !== quizGroup.attempts_used ||
    prevAttemptsSnapshot.attemptsRemaining !== quizGroup.attempts_remaining
  ) {
    setPrevAttemptsSnapshot({
      attemptsUsed: quizGroup.attempts_used,
      attemptsRemaining: quizGroup.attempts_remaining,
    });
    setAttemptsUsedThisSession(0);
  }

  const deadline = dueDate ? new Date(dueDate) : null;
  const deadlinePassed = deadline ? deadline.getTime() < currentTime : false;
  const effectiveAttemptsRemaining =
    quizGroup.attempts_remaining == null
      ? null
      : Math.max(quizGroup.attempts_remaining - attemptsUsedThisSession, 0);
  const hasAttemptsRemaining = effectiveAttemptsRemaining == null || effectiveAttemptsRemaining > 0;
  const canStart = !deadlinePassed && hasAttemptsRemaining;

  const expiresAtMs = attempt?.expires_at ? new Date(attempt.expires_at).getTime() : null;
  const remainingMs = expiresAtMs != null ? Math.max(expiresAtMs - now, 0) : null;

  // Tick the countdown once a second while an attempt is active and timed.
  useEffect(() => {
    if (!attempt || expiresAtMs == null) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [attempt, expiresAtMs]);

  // Announce accessible warnings at the 60s and 10s marks before auto-submit.
  useEffect(() => {
    if (remainingMs == null) return;
    if (remainingMs <= 10000 && !timeWarningsAnnouncedRef.current.tenSeconds) {
      timeWarningsAnnouncedRef.current.tenSeconds = true;
      setTimeWarning("10 seconds remaining. This quiz attempt will be submitted automatically.");
    } else if (remainingMs <= 60000 && !timeWarningsAnnouncedRef.current.oneMinute) {
      timeWarningsAnnouncedRef.current.oneMinute = true;
      setTimeWarning("1 minute remaining in this quiz attempt.");
    }
  }, [remainingMs]);

  const handleSubmit = async (auto = false) => {
    if (!attempt || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/proxy/learning/courses/${courseId}/items/${itemId}/quiz-group/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attempt_id: attempt.attempt_id, answers: answersRef.current }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to submit quiz group");

      setResult({
        score: data.data?.score ?? null,
        passed: data.data?.passed ?? null,
        auto_submitted: data.data?.auto_submitted ?? auto,
        sections: data.data?.sections ?? null,
        result_visible: data.data?.result_visible !== false,
        section_reset: data.data?.section_reset === true,
        course_reset: data.data?.course_reset === true,
        message: data.message,
      });
      setAttemptsUsedThisSession((count) => count + 1);
      setAttempt(null);
      router.refresh();
    } catch (err: unknown) {
      submittedRef.current = false;
      setError(getErrorMessage(err, "Failed to submit quiz group"));
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-submit once the countdown reaches zero.
  useEffect(() => {
    if (attempt && remainingMs === 0 && !submittedRef.current) {
      handleSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, remainingMs]);

  // Periodically autosave progress while an attempt is active.
  useEffect(() => {
    if (!attempt) return;

    const saveProgress = async () => {
      try {
        const res = await fetch(
          `/api/proxy/learning/courses/${courseId}/items/${itemId}/quiz-group/progress`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ attempt_id: attempt.attempt_id, answers: answersRef.current }),
          },
        );
        if (res.status === 400 && !submittedRef.current) {
          // Timer ran out server-side before our countdown noticed.
          handleSubmit(true);
        }
      } catch {
        // Best-effort autosave; ignore transient network errors.
      }
    };

    const interval = setInterval(saveProgress, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, courseId, itemId]);

  const handleStart = async () => {
    setStarting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/proxy/learning/courses/${courseId}/items/${itemId}/quiz-group/start`,
        { method: "POST" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to start quiz group");

      submittedRef.current = false;
      timeWarningsAnnouncedRef.current = { oneMinute: false, tenSeconds: false };
      setTimeWarning("");
      setResult(null);
      setAttempt({
        attempt_id: data.data?.attempt_id,
        started_at: data.data?.started_at,
        expires_at: data.data?.expires_at,
        sections: data.data?.sections || [],
        saved_answers: data.data?.saved_answers || {},
      });
      setAnswers(data.data?.saved_answers || {});
      setCurrentQuestionIndex(0);
      setNow(Date.now());
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to start quiz group"));
    } finally {
      setStarting(false);
    }
  };

  const toggleOption = (qId: string, oId: string, allowMultiple: boolean) => {
    setAnswers((prev) => {
      const current = prev[qId] || [];
      if (allowMultiple) {
        return {
          ...prev,
          [qId]: current.includes(oId) ? current.filter((id) => id !== oId) : [...current, oId],
        };
      }
      return { ...prev, [qId]: [oId] };
    });
  };

  const isReset = result?.section_reset || result?.course_reset;
  const resetHref = result?.course_reset
    ? `/learn/${courseId}`
    : sectionFirstItemId
      ? `/learn/${courseId}/item/${sectionFirstItemId}`
      : `/learn/${courseId}`;

  const attemptLabel =
    effectiveAttemptsRemaining == null
      ? quizGroup.max_attempts == null
        ? "Unlimited attempts"
        : `${quizGroup.max_attempts} max attempts`
      : `${effectiveAttemptsRemaining} ${effectiveAttemptsRemaining === 1 ? "attempt" : "attempts"} remaining`;

  const attemptQuestions =
    attempt?.sections.flatMap((sec, secIdx) =>
      sec.questions.map((question, questionIdx) => ({
        question,
        sectionId: sec.section_id,
        sectionTitle: sec.title,
        sectionIndex: secIdx,
        questionIndex: questionIdx,
      })),
    ) || [];
  const answeredCount = attemptQuestions.filter(({ question }) => (answers[question.id] || []).length > 0).length;
  const boundedQuestionIndex =
    attemptQuestions.length > 0 ? Math.min(currentQuestionIndex, attemptQuestions.length - 1) : 0;
  const currentQuestionItem = attemptQuestions[boundedQuestionIndex] || null;
  const progressPercent =
    attemptQuestions.length > 0 ? Math.round((answeredCount / attemptQuestions.length) * 100) : 0;
  const canGoPrevious = boundedQuestionIndex > 0;
  const canGoNext = boundedQuestionIndex < attemptQuestions.length - 1;

  return (
    <div className="mx-auto max-w-[860px] space-y-4">
      {isFinalAssessment && (
        <section className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <h2 className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
              {isLastSection ? "Final exam for this course" : "Final assessment for this module"}
            </h2>
            <p className="mt-1 text-sm font-medium leading-6 text-amber-800 dark:text-amber-300">
              {isLastSection
                ? "You must pass this to complete the course. Running out of attempts without passing resets the entire course."
                : "You must pass this to unlock the next module. Running out of attempts without passing resets this module."}{" "}
              {attemptLabel}.
            </p>
          </div>
        </section>
      )}

      {isReset && result && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900/40 dark:bg-red-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-red-600 text-white">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                  {result.course_reset ? "Course reset" : "Module reset"}
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                  {result.message ||
                    (result.course_reset
                      ? "You're out of retries. The entire course has been reset."
                      : "You're out of retries. This module has been reset.")}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(resetHref)}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-4 text-sm font-extrabold text-white shadow-sm shadow-[#2D6A4F]/20 transition hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d] sm:w-auto"
            >
              {result.course_reset ? "Restart course" : "Restart module"}
            </button>
          </div>
        </section>
      )}

      {result && !isReset && !attempt && (
        <section
          role="status"
          aria-live="polite"
          className={`rounded-lg border p-4 shadow-sm sm:p-5 ${
            result.result_visible && result.passed
              ? "border-[#b7e4c7] bg-[#f0fbf5] dark:border-[#27433a] dark:bg-[#13231d]"
              : result.result_visible && result.passed === false
                ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20"
                : "border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md ${
                  result.result_visible && result.passed
                    ? "bg-[#2D6A4F] text-white dark:bg-[#52b788] dark:text-[#06130d]"
                    : result.result_visible && result.passed === false
                      ? "bg-red-600 text-white"
                      : "bg-blue-600 text-white"
                }`}
              >
                {result.result_visible && result.passed === false ? (
                  <XCircle className="h-5 w-5" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                  {result.result_visible
                    ? result.passed
                      ? "Quiz group passed"
                      : "Try again"
                    : "Quiz group submitted"}
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                  {result.result_visible && typeof result.score === "number" ? (
                    <>
                      Score: <span className="font-extrabold text-slate-950 dark:text-white">{result.score}%</span>
                    </>
                  ) : (
                    "Your submission was recorded. Results are not available for this quiz group."
                  )}
                </p>
                {result.auto_submitted && (
                  <p className="mt-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                    Time&apos;s up - this attempt was submitted automatically.
                  </p>
                )}
              </div>
            </div>

            {canStart && (
              <button
                onClick={handleStart}
                disabled={starting}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#b7e4c7] bg-white px-4 text-sm font-extrabold text-[#2D6A4F] transition hover:bg-[#e7f6ee] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#27433a] dark:bg-[#111525] dark:text-[#b7e4c7] dark:hover:bg-[#183026] sm:w-auto"
              >
                {starting ? <IconSpinner className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                {result.passed ? "Retake" : "Try Again"}
              </button>
            )}
          </div>

          {result.result_visible && result.sections && result.sections.length > 0 && (
            <div className="mt-4 grid gap-2 border-t border-black/5 pt-4 dark:border-white/10">
              {result.sections.map((sec) => (
                <div
                  key={sec.section_id}
                  className="flex items-center justify-between rounded-md bg-white/60 px-3 py-2 text-sm font-bold text-slate-700 dark:bg-white/5 dark:text-slate-200"
                >
                  <span>{sec.title}</span>
                  <span>
                    {sec.earned_points}/{sec.total_questions} ({Math.round(sec.score_percent)}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {!attempt && !result && (
        <section className="rounded-lg border border-[#dceee4] bg-white shadow-sm dark:border-[#27433a] dark:bg-[#111525]">
          <div className="border-b border-[#dceee4] px-4 py-3 dark:border-[#27433a] sm:px-5">
            <h2 className="text-base font-extrabold text-slate-950 dark:text-white">Quiz Group</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-[0.68rem] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <span className="rounded-md bg-[#f7fcf9] px-2 py-1 dark:bg-[#0f1726]">
                {quizGroup.sections.length} sections
              </span>
              {typeof quizGroup.pass_mark_percentage === "number" && (
                <span className="rounded-md bg-[#f7fcf9] px-2 py-1 dark:bg-[#0f1726]">
                  {quizGroup.pass_mark_percentage}% pass mark
                </span>
              )}
              {typeof estimatedMinutes === "number" && estimatedMinutes > 0 && (
                <span className="rounded-md bg-[#f7fcf9] px-2 py-1 dark:bg-[#0f1726]">
                  {formatMinutes(estimatedMinutes)}
                </span>
              )}
              {quizGroup.time_limit_seconds ? (
                <span className="rounded-md bg-[#f7fcf9] px-2 py-1 dark:bg-[#0f1726]">
                  {formatSeconds(quizGroup.time_limit_seconds)} time limit
                </span>
              ) : null}
              <span className="rounded-md bg-[#f7fcf9] px-2 py-1 dark:bg-[#0f1726]">{attemptLabel}</span>
              {deadline && (
                <span className="rounded-md bg-[#f7fcf9] px-2 py-1 dark:bg-[#0f1726]">
                  Due {deadline.toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-[#edf5f0] dark:divide-[#24372e]">
            {quizGroup.sections.map((sec, idx) => (
              <div key={sec.id} className="flex items-center justify-between px-4 py-3 sm:px-5">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {idx + 1}. {sec.title}
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {sec.question_count ?? "?"} questions
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#dceee4] px-4 py-4 dark:border-[#27433a] sm:px-5">
            {error && (
              <p role="alert" aria-live="assertive" className="mb-3 text-sm font-bold text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {canStart ? (
              <button
                onClick={handleStart}
                disabled={starting}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-5 text-sm font-extrabold text-white shadow-sm shadow-[#2D6A4F]/20 transition hover:bg-[#1B4332] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d] sm:w-auto"
              >
                {starting ? <IconSpinner className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                {starting ? "Starting..." : "Start"}
              </button>
            ) : (
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {deadlinePassed
                  ? "The deadline for this quiz group has passed."
                  : "You have no attempts remaining for this quiz group."}
              </p>
            )}
          </div>
        </section>
      )}

      {attempt && (
        <section className="rounded-lg border border-[#dceee4] bg-white shadow-sm dark:border-[#27433a] dark:bg-[#111525]">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dceee4] bg-white/95 px-4 py-3 backdrop-blur dark:border-[#27433a] dark:bg-[#111525]/95 sm:px-5">
            <h2 className="text-base font-extrabold text-slate-950 dark:text-white">Quiz Group</h2>
            {remainingMs != null && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-extrabold ${
                  remainingMs < 60000
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    : "bg-[#e7f6ee] text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]"
                }`}
              >
                <Clock className="h-4 w-4" />
                {formatCountdown(remainingMs)}
              </span>
            )}
          </div>

          <div role="alert" aria-live="assertive" className="sr-only">
            {timeWarning}
          </div>

          {error && (
            <p role="alert" aria-live="assertive" className="px-4 pt-3 text-sm font-bold text-red-600 dark:text-red-400 sm:px-5">
              {error}
            </p>
          )}

          {attemptQuestions.length > 0 ? (
            <>
              <div className="border-b border-[#edf5f0] px-4 py-4 dark:border-[#24372e] sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[0.68rem] font-extrabold uppercase tracking-wide text-[#2D6A4F] dark:text-[#b7e4c7]">
                      Question {boundedQuestionIndex + 1} of {attemptQuestions.length}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300">
                      {answeredCount}/{attemptQuestions.length} answered
                    </p>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Quiz progress"
                    className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#0f1726] sm:w-52"
                  >
                    <div
                      className="h-full rounded-full bg-[#2D6A4F] transition-all dark:bg-[#52b788]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {attemptQuestions.map(({ question }, idx) => {
                    const isAnswered = (answers[question.id] || []).length > 0;
                    const isCurrent = idx === boundedQuestionIndex;

                    return (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(idx)}
                        aria-label={`Go to question ${idx + 1}${isAnswered ? ", answered" : ", unanswered"}`}
                        className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border text-sm font-extrabold transition ${
                          isAnswered
                            ? "border-[#2D6A4F] bg-[#2D6A4F] text-white shadow-sm shadow-[#2D6A4F]/20 dark:border-[#52b788] dark:bg-[#52b788] dark:text-[#06130d]"
                            : "border-slate-200 bg-slate-100 text-slate-500 hover:border-[#b7e4c7] hover:bg-[#f0fbf5] hover:text-[#2D6A4F] dark:border-[#27433a] dark:bg-[#0f1726] dark:text-slate-400 dark:hover:border-[#40916c] dark:hover:bg-[#183026] dark:hover:text-[#b7e4c7]"
                        } ${
                          isCurrent
                            ? "ring-2 ring-[#F4A261] ring-offset-2 ring-offset-white dark:ring-[#f7c88f] dark:ring-offset-[#111525]"
                            : ""
                        }`}
                      >
                        {idx + 1}
                        {isAnswered && (
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#2D6A4F] shadow-sm dark:bg-[#06130d] dark:text-[#52b788]">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {currentQuestionItem && (
                <div className="px-4 py-5 sm:px-5">
                  <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-[#2D6A4F] dark:text-[#b7e4c7]">
                    Section {currentQuestionItem.sectionIndex + 1}: {currentQuestionItem.sectionTitle}
                  </p>
                  <h3 className="text-base font-extrabold leading-7 text-slate-900 dark:text-white">
                    <span className="mr-2 text-[#2D6A4F] dark:text-[#b7e4c7]">
                      {currentQuestionItem.questionIndex + 1}.
                    </span>
                    {currentQuestionItem.question.text}
                  </h3>
                  <div className="mt-4 grid gap-2">
                    {currentQuestionItem.question.options.map((opt) => {
                      const isSelected = (answers[currentQuestionItem.question.id] || []).includes(opt.id);

                      return (
                        <label
                          key={opt.id}
                          className={`grid cursor-pointer grid-cols-[18px_minmax(0,1fr)] items-start gap-3 rounded-md border px-3 py-3 transition hover:border-[#b7e4c7] hover:bg-[#f0fbf5] dark:hover:border-[#40916c] dark:hover:bg-[#183026] ${
                            isSelected
                              ? "border-[#2D6A4F] bg-[#e7f6ee] dark:border-[#52b788] dark:bg-[#52b788]/12"
                              : "border-[#e3ede7] bg-[#fbfefd] dark:border-[#27433a] dark:bg-[#0f1726]"
                          }`}
                        >
                          <input
                            type={currentQuestionItem.question.allow_multiple_answers ? "checkbox" : "radio"}
                            name={currentQuestionItem.question.id}
                            checked={isSelected}
                            onChange={() =>
                              toggleOption(
                                currentQuestionItem.question.id,
                                opt.id,
                                currentQuestionItem.question.allow_multiple_answers === true,
                              )
                            }
                            className={`mt-0.5 h-4 w-4 flex-shrink-0 border-[#b7e4c7] text-[#2D6A4F] focus:ring-[#2D6A4F] dark:border-[#315244] dark:bg-[#111525] dark:text-[#52b788] ${currentQuestionItem.question.allow_multiple_answers ? "rounded" : ""}`}
                          />
                          <span className="text-sm font-medium leading-5 text-slate-700 dark:text-slate-300">
                            {opt.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 border-t border-[#edf5f0] px-4 py-4 dark:border-[#24372e] sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((idx) => Math.max(idx - 1, 0))}
                  disabled={!canGoPrevious}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#dceee4] bg-white px-4 text-sm font-extrabold text-slate-700 transition hover:bg-[#f0fbf5] hover:text-[#2D6A4F] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#27433a] dark:bg-[#111525] dark:text-slate-200 dark:hover:bg-[#183026] dark:hover:text-[#b7e4c7] sm:w-auto"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((idx) => Math.min(idx + 1, attemptQuestions.length - 1))}
                  disabled={!canGoNext}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#b7e4c7] bg-[#f7fcf9] px-4 text-sm font-extrabold text-[#2D6A4F] transition hover:bg-[#e7f6ee] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#27433a] dark:bg-[#0f1726] dark:text-[#b7e4c7] dark:hover:bg-[#183026] sm:w-auto"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="px-4 py-5 text-sm font-bold text-slate-600 dark:text-slate-300 sm:px-5">
              No questions are available for this quiz group yet.
            </div>
          )}

          <div className="border-t border-[#dceee4] px-4 py-4 dark:border-[#27433a] sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Your progress is saved automatically. Unanswered questions will be scored as 0.
              </p>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-5 text-sm font-extrabold text-white shadow-sm shadow-[#2D6A4F]/20 transition hover:bg-[#1B4332] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d] sm:w-auto"
              >
                {submitting ? <IconSpinner className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

function formatSeconds(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return formatMinutes(minutes);
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
