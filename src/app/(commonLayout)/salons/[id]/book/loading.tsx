import { Skeleton } from "@/components/ui/skeleton";

/** Same frame as `BookingSummary`: header, details left, sticky money card right, fixed bar on phones. */
export default function BookingSummaryLoading() {
  return (
    <div className="min-h-screen bg-surface-subtle pb-[calc(8rem+env(safe-area-inset-bottom))] lg:pb-16">
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-5">
          <Skeleton className="h-4 w-40" />
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-64 max-w-full" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
            <Skeleton className="h-6 w-72 max-w-full" />
          </div>
        </div>
      </div>

      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="h-[26rem] w-full rounded-xl" />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-11 flex-1 rounded-full" />
        </div>
      </div>
    </div>
  );
}
