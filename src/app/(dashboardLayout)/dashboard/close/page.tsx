import { Banknote, Calculator, CreditCard, HandCoins, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/Shared/PageHeader";
import { EmptyState } from "@/components/Shared/EmptyState";
import { StatCard } from "@/components/Shared/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DailyCloseForm } from "@/components/Owner/close/DailyCloseForm";
import { ReopenCloseButton } from "@/components/Owner/close/ReopenCloseButton";
import { differenceLabel, differenceTone } from "@/components/Owner/close/close-format";
import { dhakaToday, formatDay } from "@/components/Dashboard/appointments/format";
import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";
import { runsBranch } from "@/lib/owner-access";
import { getSelectedSalonId } from "@/lib/branch-cookie";
import { getUserRoles } from "@/services/get-roles/getUserRoles";
import { getMyAccess } from "@/services/owner/getMyAccess";
import { getDailyClose, getDailyCloseHistory } from "@/services/owner/getDailyClose";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const isDay = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export default async function DailyClosePage({ searchParams }: { searchParams: SearchParams }) {
  const [role, params] = await Promise.all([getUserRoles(), searchParams]);
  const today = dhakaToday();
  const requested = first(params.date);
  const date = isDay(requested) && requested <= today ? requested : today;

  // One branch at a time: the owner's or manager's switcher (a ?salonId from a
  // notification link wins); the desk works at one salon.
  const salonId =
    first(params.salonId) ||
    (runsBranch(role) ? await getSelectedSalonId() : (await getMyAccess()).data?.[0]?.salonId);

  const header = (
    <PageHeader
      title="Daily close"
      description="Count the till at closing time against what the system expected."
    />
  );

  if (!salonId) {
    return (
      <>
        {header}
        <EmptyState
          icon={Calculator}
          title="Pick a branch"
          description="The till is counted one branch at a time. Choose a branch in the switcher at the top of the page."
        />
      </>
    );
  }

  const [day, history] = await Promise.all([getDailyClose(salonId, date), getDailyCloseHistory(salonId)]);

  if (!day.success || !day.data) {
    return (
      <>
        {header}
        <p role="alert" className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          The daily close couldn&apos;t be loaded: {day.message}
        </p>
      </>
    );
  }

  const { expected, close, canReopen } = day.data;
  const closes = history.success ? (history.data?.items ?? []) : [];

  return (
    <div className="space-y-6">
      {header}

      {/* Label above, input and button on one row at the same height. */}
      <form method="get" className="flex flex-col gap-1.5">
        <label htmlFor="close-day" className="text-sm font-medium text-muted-foreground">
          Day
        </label>
        {/* items-stretch + h-auto: the button takes the input's height on every pointer. */}
        <div className="flex items-stretch gap-2">
          <Input
            id="close-day"
            type="date"
            name="date"
            defaultValue={date}
            max={today}
            className="w-full max-w-48 sm:w-48"
          />
          <Button type="submit" variant="outline" className="h-auto shrink-0 pointer-coarse:h-auto">
            Show
          </Button>
        </div>
      </form>

      <section className="space-y-3" aria-labelledby="close-expected">
        <h2 id="close-expected" className="text-sm font-semibold text-foreground">
          Expected · {date === today ? "Today" : formatDay(date, true)}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard
            label="Cash"
            value={formatBDT(expected.cashMinor)}
            hint="Should be in the till"
            icon={Banknote}
            tone="primary"
          />
          <StatCard label="Card" value={formatBDT(expected.cardMinor)} hint="On card slips" icon={CreditCard} />
          <StatCard
            label="Mobile banking"
            value={formatBDT(expected.mobileMinor)}
            hint="bKash, Nagad and others"
            icon={Smartphone}
          />
          <StatCard
            label="Tips"
            value={formatBDT(expected.tipsMinor)}
            hint={`Included above · ${expected.payments} payment${expected.payments === 1 ? "" : "s"}`}
            icon={HandCoins}
          />
        </div>
      </section>

      {close ? (
        <section
          className="space-y-3 rounded-2xl border border-border bg-surface p-4 sm:p-5"
          aria-label="This day's close"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Closed{close.closedByName ? ` by ${close.closedByName}` : ""} ·{" "}
                {new Date(close.createdAt).toLocaleTimeString("en-GB", {
                  timeZone: "Asia/Dhaka",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="mt-1 text-sm">
                Counted <span className="font-semibold tabular-nums">{formatBDT(close.countedCashMinor)}</span> against{" "}
                <span className="tabular-nums">{formatBDT(close.expectedCashMinor)}</span> expected
              </p>
            </div>
            {canReopen && <ReopenCloseButton closeId={close.id} />}
          </div>
          <p
            className={cn(
              "rounded-xl px-4 py-3 text-lg font-semibold tabular-nums",
              differenceTone(close.differenceMinor).soft,
              differenceTone(close.differenceMinor).text,
            )}
          >
            {differenceLabel(close.differenceMinor)}
          </p>
          {close.note && <p className="text-sm text-muted-foreground">Note: {close.note}</p>}
        </section>
      ) : (
        <DailyCloseForm salonId={salonId} date={date} expectedCashMinor={expected.cashMinor} />
      )}

      <section className="space-y-3" aria-labelledby="close-history">
        <h2 id="close-history" className="text-sm font-semibold text-foreground">
          Last 30 closes
        </h2>
        {closes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No closes yet for this branch.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {closes.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{formatDay(row.date, true)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Counted {formatBDT(row.countedCashMinor)} · expected {formatBDT(row.expectedCashMinor)}
                    {row.closedByName ? ` · ${row.closedByName}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                    differenceTone(row.differenceMinor).soft,
                    differenceTone(row.differenceMinor).text,
                  )}
                >
                  {row.differenceMinor === 0 ? "Balanced" : differenceLabel(row.differenceMinor)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
