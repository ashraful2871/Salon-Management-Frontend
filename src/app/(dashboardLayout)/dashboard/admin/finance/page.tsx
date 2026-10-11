import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/Shared/PageHeader";
import { ErrorState } from "@/components/Shared/ErrorState";
import { KpiTile } from "@/components/Admin/KpiTile";
import EarningsTrend from "@/components/Earnings/EarningsTrend";
import { ExportButton } from "@/components/Admin/finance/ExportButton";
import { RangeChips } from "@/components/Admin/finance/RangeChips";
import { ReconciliationCard } from "@/components/Admin/finance/ReconciliationCard";
import { isOn, parsePreset, presetRange } from "@/components/Admin/finance/range";
import { getAdminMe } from "@/services/admin/getAdminMe";
import { getFinanceOverview } from "@/services/admin/finance/getFinanceOverview";
import { can } from "@/lib/admin-permissions";
import { formatBDT } from "@/lib/money";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const LINKS = [
  { href: "/dashboard/admin/finance/payouts", label: "Payouts", text: "Run the batch, mark transfers paid" },
  { href: "/dashboard/admin/finance/wallets", label: "Wallets", text: "Look up, adjust or freeze a wallet" },
  { href: "/dashboard/admin/finance/ledger", label: "Ledger", text: "Every entry, unbalanced bookings, drift" },
  { href: "/dashboard/admin/finance/topups", label: "Top-ups & refunds", text: "Gateway top-ups and refunds" },
];

export default async function FinanceOverviewPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const range = parsePreset(first(params.range));
  const includeTest = isOn(params.includeTest);
  const { from, to } = presetRange(range);

  const [overview, me] = await Promise.all([
    getFinanceOverview({ from, to, includeTest: includeTest || undefined }),
    getAdminMe(),
  ]);
  const permissions = me.success ? (me.data?.permissions ?? []) : [];
  const canExport = can(permissions, "finance.export");

  if (!overview.success || !overview.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Finance" />
        <ErrorState message={overview.message} />
      </div>
    );
  }

  const { earnings: e, reconciliation } = overview.data;
  const tiles = [
    {
      label: "Completed booking value",
      value: formatBDT(e.grossBookingsMinor),
      definition: `${e.completedBookings} completed bookings in the range, by appointment date.`,
    },
    {
      label: "Commission",
      value: formatBDT(e.platformRevenueMinor),
      definition: "Platform revenue booked to the ledger in the range.",
    },
    {
      label: "Take rate",
      value: `${e.effectiveCommissionPercent}%`,
      definition: `Commission ÷ completed booking value. Standard rate ${e.standardCommissionPercent}%.`,
    },
    {
      label: "Wallet float",
      value: formatBDT(e.walletFloatMinor),
      definition: "Customer money in wallets right now. A liability, not revenue.",
    },
    {
      label: "Held deposits",
      value: formatBDT(e.depositsHeldMinor),
      definition: "Deposits reserved for upcoming bookings right now.",
    },
    {
      label: "Payable to salons",
      value: formatBDT(e.salonPayableMinor),
      definition: "Unpaid SALON_PAYABLE not yet in a payout.",
    },
    {
      label: "Failed payouts",
      value: formatBDT(e.failedPayoutMinor),
      definition: `${e.failedPayoutCount} payout(s) marked failed.`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Money in, money owed, and whether the books balance."
        actions={
          canExport ? (
            <div className="flex flex-wrap gap-2">
              <ExportButton kind="bookings" from={from} to={to} includeTest={includeTest} label="Bookings" />
              <ExportButton kind="ledger" from={from} to={to} includeTest={includeTest} label="Ledger" />
            </div>
          ) : undefined
        }
      />

      <RangeChips range={range} includeTest={includeTest} />

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <KpiTile key={tile.label} label={tile.label} value={tile.value} definition={tile.definition} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-5 lg:col-span-2">
          <h2 className="font-heading text-base font-semibold">Commission per month</h2>
          <div className="mt-3">
            <EarningsTrend months={e.monthly} />
          </div>
        </section>
        <ReconciliationCard counts={reconciliation} canRun={can(permissions, "finance.reconcile")} />
      </div>

      <nav aria-label="Finance pages" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-center justify-between font-medium">
              {link.label}
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">{link.text}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
