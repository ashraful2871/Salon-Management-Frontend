import { Skeleton } from "@/components/ui/skeleton";

/** Same frame as both booking steps: header with steps, cards left, sticky summary right, fixed bar on phones. */
export default function BookingLoading() {
  return (
    <div className="min-h-[70vh] bg-surface-subtle pb-[calc(9rem+env(safe-area-inset-bottom))] lg:pb-16">
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4 sm:px-6 md:py-6 lg:px-8">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-9 w-64 max-w-full" />
            </div>
            <Skeleton className="h-7 w-full md:w-[26rem]" />
          </div>
        </div>
      </div>

      <div className="container mx-auto grid gap-8 px-4 py-6 sm:px-6 md:py-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:px-8">
        <div className="space-y-6">
          <Skeleton className="h-72 w-full rounded-3xl" />
          <Skeleton className="h-56 w-full rounded-3xl" />
        </div>
        <div className="hidden lg:block">
          <Skeleton className="h-[26rem] w-full rounded-3xl" />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto max-w-xl space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
