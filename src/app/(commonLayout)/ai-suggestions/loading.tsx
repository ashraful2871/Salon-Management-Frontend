import { Skeleton } from "@/components/ui/skeleton";
import { PageHeroSkeleton } from "@/components/Shared/SkeletonHero";

export default function AiSuggestionsLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="container mx-auto px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <Skeleton className="mx-auto h-16 w-full max-w-3xl rounded-2xl" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
