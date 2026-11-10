"use client";

import { Check, Circle } from "lucide-react";

export const PASSWORD_MIN = 8;

/** Live password guidance. Only the length rule is required (it matches the API). */
export function PasswordChecklist({ id, password, confirm }: { id: string; password: string; confirm?: string }) {
  const rules = [
    { label: `At least ${PASSWORD_MIN} characters (required)`, met: password.length >= PASSWORD_MIN },
    { label: "Letters and numbers", met: /[a-z]/i.test(password) && /\d/.test(password) },
    { label: "An uppercase letter or a symbol", met: /[A-Z]/.test(password) || /[^a-z0-9]/i.test(password) },
  ];
  const score = rules.filter((r) => r.met).length;
  const strength = password.length === 0 ? null : score <= 1 ? "Weak" : score === 2 ? "Fair" : "Strong";
  const colour = strength === "Strong" ? "bg-[#2D6A4F] dark:bg-[#74c69d]" : strength === "Fair" ? "bg-[#E5A61D]" : "bg-red-500";

  return (
    <div id={id} className="mt-2.5 rounded-2xl border border-[#e4e1d6] bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${strength && i < score ? colour : "bg-gray-200 dark:bg-white/10"}`} />
          ))}
        </div>
        <span className="min-w-[4.5rem] text-right text-[0.78rem] font-semibold text-gray-600 dark:text-gray-300" aria-live="polite">
          {strength ? `${strength} password` : ""}
        </span>
      </div>
      <ul className="mt-2.5 grid gap-1.5">
        {rules.map((rule) => (
          <li key={rule.label} className={`flex items-center gap-2 text-[0.82rem] ${rule.met ? "text-[#1f5c3f] dark:text-[#95d5b2]" : "text-gray-500 dark:text-gray-400"}`}>
            {rule.met ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : <Circle size={10} aria-hidden="true" className="mx-[2px]" />}
            <span>
              {rule.label}
              <span className="sr-only">{rule.met ? ": done" : ": not yet"}</span>
            </span>
          </li>
        ))}
        {confirm !== undefined && confirm.length > 0 && (
          <li className={`flex items-center gap-2 text-[0.82rem] ${confirm === password ? "text-[#1f5c3f] dark:text-[#95d5b2]" : "text-red-600 dark:text-red-400"}`}>
            {confirm === password ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : <Circle size={10} aria-hidden="true" className="mx-[2px]" />}
            {confirm === password ? "Passwords match" : "Passwords do not match yet"}
          </li>
        )}
      </ul>
    </div>
  );
}
