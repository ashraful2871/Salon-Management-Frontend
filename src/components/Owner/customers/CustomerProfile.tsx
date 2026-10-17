import Link from "next/link";
import { format } from "date-fns";
import { CalendarPlus, Mail, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/Shared/StatCard";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { formatBDT } from "@/lib/money";
import type { CustomerDetail } from "@/services/owner/customer-types";
import { NoteEditor } from "./NoteEditor";

const day = (iso: string | null) => (iso ? format(new Date(iso), "d MMM yyyy") : "—");

/** Customer 360: who they are, what they did here, and the business's note. */
export function CustomerProfile({ data }: { data: CustomerDetail }) {
  const { customer, stats, timeline, reviews, note } = data;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xl font-semibold text-primary"
            >
              {customer.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {customer.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5" aria-hidden="true" />
                    {customer.contactMasked ? (
                      <span className="tabular-nums">{customer.phone}</span>
                    ) : (
                      <a href={`tel:${customer.phone}`} className="tabular-nums hover:underline">
                        {customer.phone}
                      </a>
                    )}
                  </span>
                )}
                {customer.email && (
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{customer.email}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Customer since {day(customer.memberSince)}</p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0 self-start sm:self-center">
            <Link href="/dashboard/calendar">
              <CalendarPlus aria-hidden="true" /> Book walk-in
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Visits" value={stats.visits} hint={`${stats.bookings} bookings in all`} />
        <StatCard label="Spent" value={formatBDT(stats.spentMinor)} hint="Completed visits" />
        <StatCard label="Last visit" value={day(stats.lastVisit)} hint={`First ${day(stats.firstVisit)}`} />
        <StatCard
          label="No-shows"
          value={stats.noShows}
          tone={stats.noShows >= 2 ? "danger" : "neutral"}
          hint={`${stats.forfeits} deposit${stats.forfeits === 1 ? "" : "s"} forfeited · ${stats.cancelled} cancelled`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visits</CardTitle>
              {(stats.favouriteService || stats.favouriteStylist) && (
                <p className="text-sm text-muted-foreground">
                  {[
                    stats.favouriteService && `Usually books ${stats.favouriteService.name}`,
                    stats.favouriteStylist && `with ${stats.favouriteStylist.name}`,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings yet.</p>
              ) : (
                <ol className="divide-y">
                  {timeline.map((b) => (
                    <li key={b.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{b.service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {[day(b.appointmentDate), b.startTime, b.staff?.name, b.salon.name].filter(Boolean).join(" · ")}
                        </p>
                        {b.token && (
                          <Link
                            href={`/dashboard/appointments?date=all&searchTerm=${encodeURIComponent(b.token)}`}
                            className="text-xs text-primary hover:underline"
                          >
                            {b.token}
                          </Link>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <ToneBadge status={b.status} />
                        <span className="text-sm tabular-nums">{formatBDT(b.totalMinor)}</span>
                        {b.rating !== null && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Star className="size-3 fill-gold text-gold" aria-hidden="true" />
                            {b.rating}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Their reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {reviews.map((r) => (
                    <li key={r.id} className="space-y-1 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1 text-sm font-semibold">
                          <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />
                          {r.rating}
                          <span className="font-normal text-muted-foreground">· {r.salon.name}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{day(r.createdAt)}</span>
                      </div>
                      {r.status === "HIDDEN" ? (
                        <p className="text-sm text-muted-foreground">Hidden by moderators{r.hiddenReason ? ` (${r.hiddenReason})` : ""}.</p>
                      ) : (
                        r.comment && <p className="text-sm break-words">{r.comment}</p>
                      )}
                      {r.ownerReply && (
                        <p className="border-l-2 border-primary pl-3 text-sm text-muted-foreground break-words whitespace-pre-line">
                          {r.ownerReply}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard/reviews" className="mt-2 inline-block text-sm text-primary hover:underline">
                  Go to Reviews
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="self-start">
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <NoteEditor customerId={customer.customerId} initial={note} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
