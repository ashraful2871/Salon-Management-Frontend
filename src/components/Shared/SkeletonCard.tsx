import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { salonGridClass } from "@/components/Salons/types";

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-9 w-24" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader>
              <Skeleton className="h-6 w-44" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </CardContent>
          </Card>
        </div>
        <Card className="shadow-card">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AppointmentsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-56" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <Card className="shadow-card">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function ServicesSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-56" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <Card className="shadow-card">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// The /salons results while they stream: the toolbar line and the grid, with
// the same grid classes as SalonsResults. The intro and filter bar above are
// already on screen.
export function SalonGridSkeleton({
  count = 6,
  nearby = false,
}: {
  count?: number;
  nearby?: boolean;
}) {
  return (
    <div aria-busy="true" aria-label="Loading salons">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Skeleton className="h-7 w-44 max-w-[50%]" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <div
        className={cn(
          nearby &&
            "lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-8",
        )}
      >
        <div className={salonGridClass(nearby)}>
          {Array.from({ length: count }).map((_, i) => (
            <SalonCardSkeleton key={i} />
          ))}
        </div>
        {nearby && (
          <Skeleton className="hidden h-[calc(100vh-6rem-var(--salons-bar-h,0px))] rounded-2xl lg:block" />
        )}
      </div>
    </div>
  );
}

// First entry to /salons (loading.tsx): the intro (PublicPageHero compact,
// left), the sticky filter bar, then the grid.
export function SalonListSkeleton() {
  return (
    <div>
      <section className="border-b border-border/60 bg-surface-subtle">
        <div className="container mx-auto px-4 py-8 sm:px-6 md:py-10 lg:px-8">
          <div className="flex flex-col items-center lg:items-start">
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="mt-4 h-9 w-64 max-w-full md:h-10" />
            <Skeleton className="mt-4 h-5 w-full max-w-xl" />
            <Skeleton className="mt-2 h-5 w-3/5 max-w-sm sm:hidden" />
          </div>
        </div>
      </section>
      <div className="border-b border-border/60">
        <div className="container mx-auto space-y-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="md:grid md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] md:gap-3">
            <Skeleton className="h-13 rounded-full" />
            <Skeleton className="hidden h-13 rounded-full md:block" />
            <Skeleton className="hidden h-13 rounded-full md:block" />
            <Skeleton className="hidden h-13 rounded-full md:block" />
          </div>
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 shrink-0 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      <section className="py-6 md:py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SalonGridSkeleton />
        </div>
      </section>
    </div>
  );
}

// Same shape as SalonCard: 4:3 photo, name + rating, place, chips, footer.
export function SalonCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-4 w-2/5" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="flex items-center justify-between border-t border-border/70 pt-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SalonDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-10">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <Skeleton className="h-[300px] md:h-[400px] w-full rounded-xl" />
            </div>
            <div className="lg:col-span-5">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      <section className="pt-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-40" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="lg:col-span-4 space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-28" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full rounded-md" />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---- New skeletons needed by the task ---- */

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
          <Skeleton className="h-10 w-32 rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}

export function SkeletonError({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-muted-foreground text-sm text-center max-w-md">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function PageTitleSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-5 w-72 max-w-full" />
    </div>
  );
}

/** Settings: three section cards of label + input rows. */
export function SettingsSkeleton() {
  return (
    <div className="space-y-8">
      <PageTitleSkeleton />
      {[3, 2, 2].map((rows, card) => (
        <Card key={card}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </CardHeader>
          <CardContent className="space-y-5">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
            <Skeleton className="h-10 w-32 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Slots: a 7-day date strip over a grid of slot pills. */
export function SlotsSkeleton() {
  return (
    <div className="space-y-8">
      <PageTitleSkeleton />
      <Card>
        <CardContent className="space-y-6 p-4 md:p-6">
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-14 shrink-0 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Wallet: the balance card and a list of transactions. */
export function WalletSkeleton() {
  return (
    <div className="space-y-6">
      <PageTitleSkeleton />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:items-start">
        {/* Balance card: label, amount, two figures, Top up */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="space-y-3 px-4 pt-4 pb-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="grid grid-cols-2 gap-4 border-y border-border px-4 py-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="p-3">
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <Skeleton className="h-8 w-full rounded-none" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40 max-w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** A payment result: icon, heading, a few detail rows and the way on. */
export function PaymentResultSkeleton() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center space-y-4 p-8">
          <Skeleton className="size-16 rounded-full" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
          <div className="w-full space-y-3 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-full" />
        </CardContent>
      </Card>
    </div>
  );
}

/** The desk's queue (status line + table) while today's bookings load. */
export function QueueSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading today's queue" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-56 max-w-[60%]" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="h-11 border-b border-border bg-surface-subtle" />
        <div className="border-b border-border bg-surface-subtle/60 px-4 py-3">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-6 w-8 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36 max-w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="hidden h-6 w-24 rounded-full sm:block" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The four takings tiles while the day's cash summary loads. */
export function CashSummarySkeleton() {
  return (
    <section aria-busy="true" aria-label="Loading takings" className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-2 p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
