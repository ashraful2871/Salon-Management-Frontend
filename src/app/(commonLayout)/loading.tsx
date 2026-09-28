import { HeroSkeleton } from "@/components/Shared/SkeletonHero";

// The layout reads the session cookie, so every page here streams in after this
// fallback has painted. At least a screen tall, or the footer paints in view and
// the page shoves it down (home CLS 0.44 on Lighthouse mobile).
export default function CommonLayoutLoading() {
  return (
    <div className="min-h-dvh">
      <HeroSkeleton />
    </div>
  );
}
