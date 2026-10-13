"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataList, type Column } from "@/components/Shared/DataList";
import { EmptyState } from "@/components/Shared/EmptyState";
import { FilterBar } from "@/components/Shared/FilterBar";
import { PendingRegion } from "@/components/Shared/PendingRegion";
import { ToneBadge } from "@/components/Shared/ToneBadge";
import { useFilterNavigation } from "@/hooks/useFilterNavigation";
import { formatBDT } from "@/lib/money";
import { getOwnerStatements } from "@/services/owner/getOwnerStatements";
import type { OwnerStatementItem, StatementKind } from "@/services/owner/statement-types";
import { KIND_LABEL, statementPeriod } from "./statement-format";

const KINDS: StatementKind[] = ["MONTHLY", "PAYOUT", "INVOICE"];

const AMOUNT_LABEL: Record<StatementKind, string> = {
  MONTHLY: "Closing balance",
  PAYOUT: "Paid",
  INVOICE: "Commission",
};

const COLUMNS: Column<OwnerStatementItem>[] = [
  {
    key: "title",
    header: "Statement",
    cell: (s) => <span className="font-medium">{s.title}</span>,
    mobile: "primary",
  },
  {
    key: "kind",
    header: "Type",
    cell: (s) => <ToneBadge status={s.kind} tone={KIND_LABEL[s.kind].tone}>{KIND_LABEL[s.kind].label}</ToneBadge>,
    mobile: "trailing",
  },
  {
    key: "period",
    header: "Period",
    cell: (s) => statementPeriod(s.periodStart, s.periodEnd),
    mobile: "secondary",
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (s) => <span className="font-semibold tabular-nums">{formatBDT(s.amountMinor)}</span>,
    mobileCell: (s) => `${AMOUNT_LABEL[s.kind]} ${formatBDT(s.amountMinor)}`,
  },
];

const csvHref = (id: string) => `/api/owner/export/statements/${id}.csv`;
const printHref = (id: string) => `/dashboard/money/statements/${id}/print`;

/** Monthly statements, payout statements and invoices, newest first. */
export function StatementsClient({
  initial,
  nextCursor: initialCursor,
  kind,
}: {
  initial: OwnerStatementItem[];
  nextCursor: string | null;
  kind?: StatementKind;
}) {
  const pathname = usePathname();
  const { navigate, isPending } = useFilterNavigation();
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, startLoading] = useTransition();

  const loadMore = () =>
    startLoading(async () => {
      if (!cursor) return;
      const result = await getOwnerStatements(kind, cursor);
      if (!result.success || !result.data) {
        toast.error(result.message || "Couldn't load more statements.");
        return;
      }
      setItems((current) => [...current, ...result.data!.items]);
      setCursor(result.data.nextCursor);
    });

  return (
    <div className="space-y-4">
      <FilterBar
        chips={{
          value: kind ?? "all",
          options: [
            { value: "all", label: "All" },
            ...KINDS.map((k) => ({ value: k, label: KIND_LABEL[k].plural })),
          ],
          onChange: (value) => navigate(value === "all" ? pathname : `${pathname}?kind=${value}`),
          label: "Type",
        }}
        activeCount={kind ? 1 : 0}
        onClear={() => navigate(pathname)}
        pending={isPending}
      />

      <PendingRegion pending={isPending}>
        <DataList
          items={items}
          rowKey={(s) => s.id}
          columns={COLUMNS}
          caption="Statements"
          tableFrom="3xl"
          rowHref={(s) => printHref(s.id)}
          rowActions={(s) => (
            <>
              <Button asChild variant="outline" size="sm">
                <a href={csvHref(s.id)} download>
                  <Download aria-hidden />
                  CSV
                </a>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={printHref(s.id)}>View</Link>
              </Button>
            </>
          )}
          empty={
            <EmptyState
              icon={FileText}
              title="No statements yet"
              description="A statement and a commission invoice are made on the 1st for the month before, and a statement for every payout once it is paid."
            />
          }
        />
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
