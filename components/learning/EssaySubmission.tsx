"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, FileText, Send, ShieldAlert, Upload, XCircle } from "lucide-react";
import { IconSpinner } from "@/components/auth/shared/icons";

type EssaySubmissionValue = {
  content_text?: string | null;
  document_file_name?: string | null;
  document_download_url?: string | null;
  submitted_at?: string | null;
  is_graded?: boolean | null;
  is_published?: boolean | null;
  score?: number | null;
  feedback?: string | null;
  passed?: boolean | null;
};

type EssaySubmissionProps = {
  courseId: string;
  itemId: string;
  essayQuestion?: string | null;
  essayDescription?: string | null;
  estimatedMinutes?: number | null;
  submissionMode?: "TEXT" | "DOCUMENT" | string | null;
  dueDate?: string | null;
  submission?: EssaySubmissionValue | null;
  isFinalAssessment?: boolean | null;
  maxAttempts?: number | null;
  attemptsUsed?: number | null;
  attemptsRemaining?: number | null;
  passMarkPercentage?: number | null;
  isLastSection?: boolean;
};

export function EssaySubmission({
  courseId,
  itemId,
  essayQuestion,
  essayDescription,
  estimatedMinutes,
  submissionMode,
  dueDate,
  submission,
  isFinalAssessment,
  maxAttempts,
  attemptsUsed,
  attemptsRemaining,
  passMarkPercentage,
  isLastSection,
}: EssaySubmissionProps) {
  const router = useRouter();
  const mode = submissionMode === "DOCUMENT" ? "DOCUMENT" : "TEXT";
  const [currentTime] = useState(() => Date.now());
  const [contentText, setContentText] = useState(submission?.content_text || "");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const deadline = dueDate ? new Date(dueDate) : null;
  const deadlinePassed = deadline ? deadline.getTime() < currentTime : false;
  const isGraded = submission?.is_graded === true;
  const canSubmit = !isGraded && !deadlinePassed;
  const hasSubmission = Boolean(submission?.submitted_at);

  const handleTextSubmit = async () => {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/proxy/learning/courses/${courseId}/items/${itemId}/essay/submit-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_text: contentText }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.message || "Failed to submit essay");

      setSuccess(data.message || "Essay submitted successfully");
      router.refresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to submit essay"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentSubmit = async () => {
    if (!file) {
      setError("Choose a document before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const uploadUrlRes = await fetch(`/api/proxy/learning/courses/${courseId}/items/${itemId}/essay/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: file.name }),
      });
      const uploadUrlData = await uploadUrlRes.json().catch(() => ({}));

      if (!uploadUrlRes.ok) {
        throw new Error(uploadUrlData.message || "Failed to prepare document upload");
      }

      const uploadUrl = uploadUrlData.data?.upload_url;
      const storageKey = uploadUrlData.data?.storage_key;

      if (!uploadUrl || !storageKey) {
        throw new Error("The upload URL response was incomplete.");
      }

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: file.type ? { "Content-Type": file.type } : undefined,
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload document.");
      }

      const submitRes = await fetch(`/api/proxy/learning/courses/${courseId}/items/${itemId}/essay/submit-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storage_key: storageKey,
          file_name: file.name,
          mime_type: file.type || undefined,
        }),
      });
      const submitData = await submitRes.json().catch(() => ({}));

      if (!submitRes.ok) {
        throw new Error(submitData.message || "Failed to submit document");
      }

      setFile(null);
      setSuccess(submitData.message || "Document submitted successfully");
      router.refresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to submit document"));
    } finally {
      setSubmitting(false);
    }
  };

  const attemptsLabel =
    typeof attemptsRemaining === "number"
      ? `${attemptsRemaining} ${attemptsRemaining === 1 ? "attempt" : "attempts"} remaining`
      : maxAttempts == null
        ? "Unlimited attempts"
        : `${maxAttempts} max attempts`;

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
                ? "You must pass this to complete the course."
                : "You must pass this to unlock the next module."}
              {typeof passMarkPercentage === "number" ? ` Pass mark: ${passMarkPercentage}%.` : ""}{" "}
              {typeof attemptsUsed === "number" ? `${attemptsUsed} graded ${attemptsUsed === 1 ? "attempt" : "attempts"} so far. ` : ""}
              {attemptsLabel}.
            </p>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-[#dceee4] bg-white shadow-sm dark:border-[#27433a] dark:bg-[#111525]">
        <div className="border-b border-[#dceee4] px-4 py-3 dark:border-[#27433a] sm:px-5">
          <div className="flex flex-wrap gap-2 text-[0.68rem] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span className="rounded-md bg-[#f7fcf9] px-2 py-1 dark:bg-[#0f1726]">
              {mode === "DOCUMENT" ? "Document upload" : "Text response"}
            </span>
            {deadline && (
              <span className="rounded-md bg-[#f7fcf9] px-2 py-1 dark:bg-[#0f1726]">
                Due {deadline.toLocaleDateString()}
              </span>
            )}
            {typeof estimatedMinutes === "number" && estimatedMinutes > 0 && (
              <span className="rounded-md bg-[#f7fcf9] px-2 py-1 dark:bg-[#0f1726]">
                {formatMinutes(estimatedMinutes)}
              </span>
            )}
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5">
          <h2 id="essay-question" className="text-lg font-extrabold leading-7 text-slate-950 dark:text-white">
            {essayQuestion || "Essay Assignment"}
          </h2>
          {essayDescription && (
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">
              {essayDescription}
            </p>
          )}
        </div>
      </section>

      {hasSubmission && (
        <section className="rounded-lg border border-[#dceee4] bg-white p-4 shadow-sm dark:border-[#27433a] dark:bg-[#111525] sm:p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-[#e7f6ee] text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
              <CheckCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                {submission?.is_published
                  ? "Grade published"
                  : isGraded
                    ? "Instructor review complete"
                    : "Submitted, awaiting review"}
              </h3>
              {submission?.submitted_at && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Submitted {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(submission.submitted_at))}
                </p>
              )}

              {submission?.is_published && typeof submission.score === "number" && (
                <div className="mt-3 flex items-center gap-2">
                  <p className="text-base font-extrabold text-slate-950 dark:text-white">
                    Score: {submission.score}
                  </p>
                  {isFinalAssessment && typeof submission.passed === "boolean" && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-extrabold ${
                        submission.passed
                          ? "bg-[#e7f6ee] text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]"
                          : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300"
                      }`}
                    >
                      {submission.passed ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {submission.passed ? "Passed" : "Failed"}
                    </span>
                  )}
                </div>
              )}
              {submission?.is_published && submission.feedback && (
                <p className="mt-3 whitespace-pre-line rounded-md bg-[#f7fcf9] p-3 text-sm leading-6 text-slate-700 dark:bg-[#0f1726] dark:text-slate-200">
                  {submission.feedback}
                </p>
              )}
              {isGraded && !submission?.is_published && (
                <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Your instructor has reviewed this essay. The grade has not been published yet.
                </p>
              )}
              {!isGraded && (
                <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                  You can resubmit until this essay is graded or the deadline passes.
                </p>
              )}

              {submission?.document_download_url && (
                <a
                  href={submission.document_download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-[#b7e4c7] px-3 text-sm font-bold text-[#2D6A4F] transition hover:bg-[#f0fbf5] dark:border-[#27433a] dark:text-[#b7e4c7] dark:hover:bg-[#183026]"
                >
                  <FileText className="h-4 w-4" />
                  {submission.document_file_name || "Download submission"}
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-[#dceee4] bg-white shadow-sm dark:border-[#27433a] dark:bg-[#111525]">
        <div className="border-b border-[#dceee4] px-4 py-3 dark:border-[#27433a] sm:px-5">
          <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
            {hasSubmission ? "Resubmit Essay" : "Submit Essay"}
          </h3>
        </div>

        <div className="px-4 py-4 sm:px-5">
          {mode === "TEXT" ? (
            <textarea
              id="essay-response"
              aria-labelledby="essay-question"
              value={contentText}
              onChange={(event) => setContentText(event.target.value)}
              disabled={!canSubmit || submitting}
              rows={10}
              className="min-h-[260px] w-full resize-y rounded-md border border-[#dceee4] bg-[#fbfefd] p-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-[#2D6A4F] focus:ring-4 focus:ring-[#2D6A4F]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-[#27433a] dark:bg-[#0f1726] dark:text-white dark:focus:border-[#52b788] dark:focus:ring-[#52b788]/10 dark:disabled:bg-[#111525]"
              placeholder="Write your response here..."
            />
          ) : (
            <label className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-5 text-center transition ${
              canSubmit
                ? "border-[#b7e4c7] bg-[#f7fcf9] hover:bg-[#eef8f2] dark:border-[#27433a] dark:bg-[#13231d] dark:hover:bg-[#183026]"
                : "cursor-not-allowed border-slate-200 bg-slate-50 dark:border-[#27433a] dark:bg-[#0f1726]"
            }`}>
              <Upload className="mb-3 h-7 w-7 text-[#2D6A4F] dark:text-[#52b788]" />
              <span className="font-extrabold text-slate-950 dark:text-white">
                {file ? file.name : "Choose essay document"}
              </span>
              <span className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Upload the final file, then submit it for review.
              </span>
              <input
                type="file"
                disabled={!canSubmit || submitting}
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className="sr-only"
              />
            </label>
          )}

          {error && (
            <p role="alert" aria-live="assertive" className="mt-3 text-sm font-bold text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          {success && (
            <p role="status" aria-live="polite" className="mt-3 text-sm font-bold text-[#2D6A4F] dark:text-[#52b788]">
              {success}
            </p>
          )}
          {!canSubmit && (
            <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">
              {deadlinePassed
                ? "The deadline for this essay has passed."
                : "This essay has been graded and can no longer be resubmitted."}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-[#dceee4] px-4 py-4 dark:border-[#27433a] sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {canSubmit ? "Submissions can be updated until grading begins." : "Submission is locked."}
          </p>
          <button
            onClick={mode === "TEXT" ? handleTextSubmit : handleDocumentSubmit}
            disabled={!canSubmit || submitting || (mode === "TEXT" && contentText.trim().length === 0)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-5 text-sm font-extrabold text-white shadow-sm shadow-[#2D6A4F]/20 transition hover:bg-[#1B4332] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d] sm:w-auto"
          >
            {submitting ? <IconSpinner className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Submitting..." : hasSubmission ? "Resubmit" : "Submit"}
          </button>
        </div>
      </section>
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
