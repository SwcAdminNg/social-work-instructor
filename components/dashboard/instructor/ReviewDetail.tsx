import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, FileText, ShieldAlert } from "lucide-react";

type ReviewDetailProps = {
  title: string;
  subtitle: string;
  typeLabel: string;
  detail: Record<string, unknown> | null;
};

function asText(value: unknown, fallback = "Not provided") {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return fallback;
}

function list(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function object(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function ReviewDetail({
  title,
  subtitle,
  typeLabel,
  detail,
}: ReviewDetailProps) {
  const actions = list(detail?.available_actions).map(String);
  const stages = list(detail?.stages).map(object);
  const history = list(detail?.history ?? detail?.decision_history).map(object);
  const blockedReason =
    typeof detail?.blocked_reason === "string" && detail.blocked_reason.trim()
      ? detail.blocked_reason
      : "";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <Link
        href="/dashboard/approval-centre"
        className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[#2D6A4F] no-underline transition hover:text-[#1B4332] dark:text-[#74c69d]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Approval Centre
      </Link>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-[#262a3d] dark:bg-[#111525]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="rounded-md bg-[#eef8f2] px-2.5 py-1 text-xs font-extrabold text-[#2D6A4F] dark:bg-[#52b788]/12 dark:text-[#74c69d]">
              {typeLabel}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-80">
            <div className="rounded-lg border border-slate-100 p-3 dark:border-[#262a3d]">
              <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Status
              </p>
              <p className="mt-1 text-sm font-extrabold text-slate-950 dark:text-white">
                {asText(detail?.status).replaceAll("_", " ")}
              </p>
            </div>
            <div className="rounded-lg border border-slate-100 p-3 dark:border-[#262a3d]">
              <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                Stage
              </p>
              <p className="mt-1 text-sm font-extrabold text-slate-950 dark:text-white">
                {asText(detail?.current_stage).replaceAll("_", " ")}
              </p>
            </div>
          </div>
        </div>

        {blockedReason && (
          <div className="mt-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-semibold leading-6">
              {blockedReason}
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-[#262a3d] dark:bg-[#111525]">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
            Workflow
          </h2>
          {stages.length === 0 && history.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              The backend did not return a timeline for this item yet.
            </p>
          ) : (
            <ul className="mt-4 m-0 list-none space-y-3 p-0">
              {(stages.length > 0 ? stages : history).map((stage, index) => (
                <li key={String(stage.id ?? index)} className="flex gap-3 rounded-lg border border-slate-100 p-4 dark:border-[#262a3d]">
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md bg-[#eef8f2] text-[#2D6A4F] dark:bg-[#52b788]/12 dark:text-[#74c69d]">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-950 dark:text-white">
                      {asText(stage.stage ?? stage.action ?? stage.status, "Workflow step").replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {asText(stage.comment ?? stage.note ?? stage.decision, "No note recorded")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-[#262a3d] dark:bg-[#111525]">
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
            Available Actions
          </h2>
          {actions.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
              No actions are available for your role on this item.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled
                  title="Action wiring is ready for the documented API endpoint."
                  className="flex h-10 items-center justify-between rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-600 dark:border-[#262a3d] dark:text-slate-300"
                >
                  {action.replaceAll("_", " ")}
                  <Clock3 className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}
          <div className="mt-5 rounded-lg bg-slate-50 p-4 dark:bg-white/5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
              <FileText className="h-4 w-4" />
              Review note
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              The detail route is ready for decision forms. The buttons are shown from `available_actions` so separation-of-duties rules stay backend-driven.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
