import { Skeleton } from "@/components/ui/skeleton";

export default function BookingSummaryLoading() {
  return (
    <div className="min-h-screen bg-muted/30 pb-16">
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-5">
          <Skeleton className="h-4 w-40" />
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-6 w-72" />
          </div>
        </div>
      </div>

      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="h-[26rem] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
