import { Card, Skeleton } from "@/components/ui/primitives";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6" aria-busy="true" aria-label="Loading essay mark">
      <Skeleton className="h-4 w-32" />
      <Card>
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
      </Card>
      <Card>
        <Skeleton className="h-10 w-full" />
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-3 h-8 w-20" />
          </Card>
        ))}
      </div>
    </div>
  );
}
