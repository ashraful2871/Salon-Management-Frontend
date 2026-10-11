import { Skeleton } from "@/components/ui/skeleton";

export default function PlatformSettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-56 w-full rounded-2xl" />
      ))}
    </div>
  );
}
