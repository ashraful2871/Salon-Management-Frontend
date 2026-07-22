import { Skeleton } from "@/components/ui/skeleton";

export function HeroSkeleton() {
  return (
    <section className="relative min-h-screen -mt-16 pt-16 flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-charcoal" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl space-y-6">
            <Skeleton className="h-8 w-48 rounded-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-6 w-96" />
            <div className="flex gap-4">
              <Skeleton className="h-14 w-44 rounded-xl" />
              <Skeleton className="h-14 w-36 rounded-xl" />
            </div>
            <div className="flex gap-8 pt-8 border-t border-white/10">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center">
            <Skeleton className="w-full max-w-md h-[400px] rounded-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function PageHeroSkeleton() {
  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4">
          <Skeleton className="h-6 w-32 mx-auto rounded-full" />
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
      </div>
    </section>
  );
}
