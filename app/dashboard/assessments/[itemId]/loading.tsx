import { Card, Skeleton } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6" aria-busy="true" aria-label="Loading submissions">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-3 w-24" />
        <Skeleton className="h-8 w-72 max-w-full" />
      </div>
      <Card>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-5 w-full" />
      </Card>
      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <Card padded={false} className="p-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </Card>
        <Card className="hidden lg:block">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="mt-5 h-64 w-full" />
        </Card>
      </div>
    </div>
  );
}
