import { Skeleton } from "@/components/ui/skeleton";

export default function ContentLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-64 w-full rounded-2xl" />
      ))}
    </div>
  );
}
