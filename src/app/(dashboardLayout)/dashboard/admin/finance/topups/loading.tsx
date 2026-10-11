import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TopupsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row">
          <Skeleton className="h-9 w-full md:w-72" />
          <Skeleton className="h-9 w-full md:w-40" />
          <Skeleton className="h-9 w-full md:w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg bg-muted/50 p-3">
              <Skeleton className="h-4 w-20" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="hidden h-4 w-16 sm:block" />
              <Skeleton className="hidden h-6 w-20 rounded-full md:block" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
