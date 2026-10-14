import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBDT } from "@/lib/money";
import type { OwnerHomeData } from "@/services/owner/home-types";

/** Today per branch. The table scrolls inside its card on phones. */
export function BranchesTable({
  branches,
  total,
}: {
  branches: NonNullable<OwnerHomeData["branches"]>;
  total: number;
}) {
  return (
    <Card className="gap-3">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle>Branches today</CardTitle>
        {total > branches.length && (
          <p className="text-xs text-muted-foreground">
            The busiest {branches.length} of {total.toLocaleString()} branches.
          </p>
        )}
      </CardHeader>
      <CardContent className="px-0 sm:px-2">
        <div className="max-h-[28rem] overflow-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="sticky top-0 bg-surface text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Branch</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Bookings</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Takings</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">No-shows</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Rating</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Open slots</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {branches.map((b) => (
                <tr key={b.salonId}>
                  <th scope="row" className="max-w-56 truncate px-4 py-2 text-left font-medium">
                    {b.salonName}
                  </th>
                  <td className="px-3 py-2 text-right tabular-nums">{b.bookings}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatBDT(b.takingsMinor)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{b.noShows}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {b.totalReviews > 0 ? b.rating.toFixed(1) : "—"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{b.openSlotsToday}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
