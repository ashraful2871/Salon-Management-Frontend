import { Skeleton } from "@/components/ui/skeleton";

// The home page's fallback: light, and the shape of the hero that replaces it.
export function HeroSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading"
      className="-mt-16 bg-background pt-24 pb-12 sm:pt-28 sm:pb-16 lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-center"
    >
      <div className="container mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
          <div className="flex flex-col items-center gap-5 lg:items-start">
            <Skeleton className="h-6 w-52 rounded-full" />
            <div className="flex w-full flex-col items-center gap-3 lg:items-start">
              <Skeleton className="h-9 w-full max-w-md lg:h-14" />
              <Skeleton className="h-9 w-2/3 max-w-xs lg:h-14" />
            </div>
            <Skeleton className="h-5 w-full max-w-lg" />
            <Skeleton className="mt-3 h-14 w-full max-w-xl rounded-full" />
            <Skeleton className="h-11 w-full rounded-full sm:w-52" />
          </div>
          <div className="hidden justify-end lg:flex">
            <Skeleton className="aspect-[4/5] w-full max-w-[520px] rounded-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

// The same band as PublicPageHero, for the static pages and AI Match.
export function PageHeroSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading"
      className="border-b border-border/60 bg-surface-subtle bg-glow-soft"
    >
      <div className="container mx-auto px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20">
        <div className="flex flex-col items-center gap-4 text-center">
          <Skeleton className="h-7 w-32 rounded-full" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-5 w-full max-w-lg" />
        </div>
      </div>
    </section>
  );
}
