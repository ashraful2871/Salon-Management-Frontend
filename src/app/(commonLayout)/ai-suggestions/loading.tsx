import { Skeleton } from "@/components/ui/skeleton";
import { PageHeroSkeleton } from "@/components/Shared/SkeletonHero";

export default function AiSuggestionsLoading() {
  return (
    <div className="min-h-screen bg-muted/30 pt-24 pb-16">
      <PageHeroSkeleton />
      <section className="container mx-auto px-4 mt-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
