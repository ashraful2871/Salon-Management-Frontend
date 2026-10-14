"use client";

import { useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MessageSquareQuote, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/Shared/EmptyState";
import { FilterBar } from "@/components/Shared/FilterBar";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { getOwnerReviews } from "@/services/owner/getOwnerReviews";
import { SHOW_OPTIONS, type OwnerReview, type ReviewFilters, type ReviewSummary } from "@/services/owner/review-types";
import { ReviewCard } from "./ReviewCard";

/** Average, count, a 5→1 star breakdown and each stylist's average. */
function SummaryCard({ summary }: { summary: ReviewSummary }) {
  const max = Math.max(1, ...summary.breakdown.map((b) => b.count));
  return (
    <Card>
      <CardContent className="grid gap-6 p-5 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col items-start justify-center gap-1">
          <p className="font-heading text-4xl font-semibold tabular-nums">{summary.average.toFixed(1)}</p>
          <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="size-4 fill-gold text-gold" aria-hidden="true" />
            {summary.count.toLocaleString()} review{summary.count === 1 ? "" : "s"}
          </p>
          {summary.unreplied > 0 && (
            <p className="text-sm font-medium text-primary">{summary.unreplied.toLocaleString()} need a reply</p>
          )}
        </div>
        <ul className="space-y-1.5" aria-label="Ratings breakdown">
          {summary.breakdown.map((b) => (
            <li key={b.stars} className="flex items-center gap-2 text-sm">
              <span className="w-4 tabular-nums text-muted-foreground">{b.stars}</span>
              <Star className="size-3.5 shrink-0 fill-gold text-gold" aria-hidden="true" />
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-gold" style={{ width: `${(b.count / max) * 100}%` }} />
              </span>
              <span className="w-10 text-right tabular-nums text-muted-foreground">{b.count.toLocaleString()}</span>
            </li>
          ))}
        </ul>
        {summary.staff.length > 0 && (
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <p className="mb-1.5 text-sm font-medium">By stylist</p>
            <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
              {summary.staff.map((s) => (
                <li key={s.staffId} className="flex items-center justify-between gap-3">
                  <span className="truncate">{s.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {s.average.toFixed(1)} · {s.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Reviews of the branch(es) in view. `show` and `rating` live in the URL;
 * "Needs a reply" is the default. The page keys this on its filters.
 */
export function ReviewsClient({
  initial,
  nextCursor: initialCursor,
  summary,
  filters,
  show,
  multiBranch,
}: {
  initial: OwnerReview[];
  nextCursor: string | null;
  summary: ReviewSummary | null;
  filters: ReviewFilters;
  show: string;
  multiBranch: boolean;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { navigate, isPending } = useFilterNavigation();
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, startLoading] = useTransition();

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const query = next.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  const loadMore = () =>
    startLoading(async () => {
      if (!cursor) return;
      const result = await getOwnerReviews(filters, cursor);
      if (!result.success || !result.data) {
        toast.error(result.message || "Couldn't load more reviews.");
        return;
      }
      setItems((current) => [...current, ...result.data!.items]);
      setCursor(result.data.nextCursor);
    });

  const activeCount = [params.get("show"), params.get("rating")].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {summary && <SummaryCard summary={summary} />}

      <FilterBar
        chips={{
          value: show,
          options: SHOW_OPTIONS.map((o) => ({
            ...o,
            ...(o.value === "unreplied" && summary && { count: summary.unreplied }),
          })),
          onChange: (value) => setParam("show", value === "unreplied" ? null : value),
          label: "Show",
        }}
        extra={
          <Select
            value={filters.rating ? String(filters.rating) : "any"}
            onValueChange={(v) => setParam("rating", v === "any" ? null : v)}
          >
            <SelectTrigger className="w-full rounded-full md:w-40" aria-label="Rating">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any rating</SelectItem>
              {[5, 4, 3, 2, 1].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} star{n === 1 ? "" : "s"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        activeCount={activeCount}
        onClear={() => navigate(pathname)}
        pending={isPending}
      />

      <PendingRegion pending={isPending}>
        {items.length === 0 ? (
          <EmptyState
            icon={MessageSquareQuote}
            title={show === "unreplied" && !filters.rating ? "All caught up" : "No reviews"}
            description={
              show === "unreplied" && !filters.rating
                ? "Every review has a reply."
                : "Nothing matches these filters."
            }
          />
        ) : (
          <ul className="space-y-3">
            {items.map((review) => (
              <ReviewCard key={review.id} review={review} multiBranch={multiBranch} />
            ))}
          </ul>
        )}
      </PendingRegion>

      {cursor && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
