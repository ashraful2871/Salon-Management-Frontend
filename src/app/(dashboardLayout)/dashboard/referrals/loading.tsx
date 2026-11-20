import { Skeleton } from "@/components/ui/skeleton";

/** The Refer page's shape while its reads finish: header, hero, share row, four tiles, a reward list. */
export default function ReferralsLoading() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-busy="true" aria-label="Loading Refer & earn">
      <div className="space-y-2 max-lg:hidden">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-72 rounded-3xl xl:h-56" />
      <Skeleton className="h-40 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}
