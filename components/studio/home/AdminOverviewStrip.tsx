"use client";

import { GraduationCap, LifeBuoy, UsersRound, Wallet, type LucideIcon } from "lucide-react";
import type { AdminOverview } from "@/components/dashboard/instructor/types";
import { Card } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/studio/labels";

const fmt = (n?: number) => new Intl.NumberFormat("en-NG").format(Number(n ?? 0));

function Metric({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate font-display text-base font-extrabold text-slate-900 dark:text-white">
          {value}
          {hint && <span className="ml-1.5 text-xs font-medium text-slate-400">{hint}</span>}
        </p>
      </div>
    </div>
  );
}

/** Slim platform snapshot for admins / publishers. */
export function AdminOverviewStrip({ overview }: { overview: AdminOverview }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Platform snapshot</h2>
      <Card className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={UsersRound}
          label="Users"
          value={fmt(overview.users?.total_users)}
          hint={overview.users?.new_last_30_days ? `+${fmt(overview.users.new_last_30_days)} this month` : undefined}
        />
        <Metric
          icon={Wallet}
          label="Revenue (30 days)"
          value={formatMoney(overview.revenue?.last_30_days)}
        />
        <Metric
          icon={GraduationCap}
          label="Published courses"
          value={fmt(overview.courses?.published)}
          hint={overview.courses?.draft ? `${fmt(overview.courses.draft)} in draft` : undefined}
        />
        <Metric
          icon={LifeBuoy}
          label="Open support tickets"
          value={fmt(overview.support?.open)}
          hint={overview.support?.unassigned_open ? `${fmt(overview.support.unassigned_open)} unassigned` : undefined}
        />
      </Card>
    </section>
  );
}
