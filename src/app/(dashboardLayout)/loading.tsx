import { DashboardSkeleton } from "@/components/Shared/SkeletonCard";

export default function DashboardLayoutLoading() {
  return (
    <div className="flex min-h-screen">
      <div className="w-64 shrink-0 bg-sidebar border-r border-sidebar-border p-4 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      <main className="flex-1 p-6">
        <DashboardSkeleton />
      </main>
    </div>
  );
}
