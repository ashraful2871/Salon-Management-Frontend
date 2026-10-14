import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/money";
import { formatTime12 } from "@/components/Dashboard/appointments/format";
import type { OwnerHomeData } from "@/services/owner/home-types";

const Figure = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-lg font-semibold tabular-nums [overflow-wrap:anywhere] sm:text-xl">{value}</p>
  </div>
);

/** Today at a glance, and the next three customers due. */
export function TodayStrip({ today }: { today: OwnerHomeData["today"] }) {
  return (
    <Card className="gap-3">
      <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 sm:px-6">
        <CardTitle>Today</CardTitle>
        <Button asChild variant="ghost" size="sm" className="-mr-2">
          <Link href="/dashboard/calendar">Open calendar</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-6">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          <Figure label="Bookings" value={today.bookings.toLocaleString()} />
          <Figure label="In the salon" value={today.checkedIn.toLocaleString()} />
          <Figure label="Completed" value={today.completed.toLocaleString()} />
          <Figure label="No-shows" value={today.noShows.toLocaleString()} />
          <Figure label="Takings" value={formatBDT(today.takingsMinor)} />
        </div>
        {today.next.length > 0 ? (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {today.next.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <span className="w-16 shrink-0 font-medium tabular-nums">{formatTime12(b.time)}</span>
                <span className="min-w-0 flex-1 truncate">
                  {b.customerName} · {b.serviceName}
                  {b.staffName && <span className="text-muted-foreground"> · {b.staffName}</span>}
                </span>
                {b.token && (
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{b.token}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No one else is due today.</p>
        )}
      </CardContent>
    </Card>
  );
}
