import { Card, Skeleton } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6" aria-busy="true" aria-label="Loading assessments">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-[28rem] max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={i}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-12" />
          </Card>
        ))}
      </div>
      <Card padded={false}>
        <div className="border-b border-slate-100 p-4 dark:border-ink-line">
          <Skeleton className="h-10 w-full" />
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0 dark:border-ink-line">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-56 max-w-full" />
              <Skeleton className="h-3 w-80 max-w-full" />
            </div>
            <Skeleton className="hidden h-8 w-24 sm:block" />
          </div>
        ))}
      </Card>
    </div>
  );
}
