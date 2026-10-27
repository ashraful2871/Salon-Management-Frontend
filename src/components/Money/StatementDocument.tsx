import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/money";
import type {
  InvoiceTotals,
  MonthlyTotals,
  OwnerStatementDetail,
  PayoutTotals,
} from "@/services/owner/statement-types";
import { PrintButton } from "./PrintButton";
import { dhakaDate, statementPeriod } from "./statement-format";
import { SITE } from "@/lib/site";

/**
 * Print rules: A4 portrait, and everything on the page except the document
 * (and the boxes that contain it) is dropped, so the dashboard chrome never
 * reaches the paper and no scroll container clips it to one page.
 */
const PRINT_CSS = `
@page { size: A4 portrait; margin: 14mm; }
@media print {
  html, body { background: #fff !important; }
  body *:not(:has(#statement-doc)):not(#statement-doc):not(#statement-doc *) { display: none !important; }
  *:has(#statement-doc) {
    display: block !important; position: static !important; overflow: visible !important;
    height: auto !important; min-height: 0 !important; max-height: none !important;
    width: auto !important; max-width: none !important; margin: 0 !important; padding: 0 !important;
    border: 0 !important; box-shadow: none !important; transform: none !important; background: none !important;
  }
  #statement-doc { border: 0 !important; box-shadow: none !important; padding: 0 !important; max-width: none !important; font-size: 10.5pt; }
  #statement-doc table { page-break-inside: auto; }
  #statement-doc tr { page-break-inside: avoid; }
}
`;

/** Signed money: "−৳50" rather than "৳-50". */
const money = (minor: number) => (minor < 0 ? `−${formatBDT(-minor)}` : formatBDT(minor));

const HEADING: Record<OwnerStatementDetail["kind"], string> = {
  MONTHLY: "Monthly statement",
  PAYOUT: "Payout statement",
  INVOICE: "Commission invoice",
};

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <tr className={strong ? "border-t-2 border-foreground/70 font-semibold" : "border-t border-border"}>
      <td className={`py-1.5 pr-4 ${muted ? "text-muted-foreground" : ""}`}>{label}</td>
      <td className="py-1.5 text-right tabular-nums">{value}</td>
    </tr>
  );
}

function Table({ head, rows, foot }: { head: string[]; rows: string[][]; foot?: string[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b-2 border-foreground/70 text-left">
          {head.map((h, i) => (
            <th key={h} className={`py-1.5 pr-3 font-semibold ${i > 0 ? "text-right" : ""}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r} className="border-b border-border">
            {row.map((cell, i) => (
              <td key={i} className={`py-1.5 pr-3 ${i > 0 ? "text-right tabular-nums" : ""}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {foot && (
        <tfoot>
          <tr className="border-t-2 border-foreground/70 font-semibold">
            {foot.map((cell, i) => (
              <td key={i} className={`py-1.5 pr-3 ${i > 0 ? "text-right tabular-nums" : ""}`}>
                {cell}
              </td>
            ))}
          </tr>
        </tfoot>
      )}
    </table>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 break-inside-avoid">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Monthly({ t }: { t: MonthlyTotals }) {
  return (
    <>
      <Section title="Balance">
        <table className="w-full text-sm">
          <tbody>
            <Row label="Opening balance" value={money(t.openingMinor)} />
            <Row label="Deposits applied to bookings" value={money(t.depositsAppliedMinor)} />
            <Row label="No-show share" value={money(t.noShowShareMinor)} />
            <Row label="Late cancellation fees" value={money(t.lateCancelMinor)} />
            <Row label="Prepaid bookings" value={money(t.prepaidMinor)} />
            <Row label="Platform commission" value={money(t.commissionMinor)} />
            <Row label="Goodwill credits" value={money(t.goodwillMinor)} />
            <Row label="Dues paid" value={money(t.duesPaidMinor)} />
            <Row label="Adjustments" value={money(t.adjustmentsMinor)} />
            <Row label="Payouts paid" value={money(t.payoutsMinor)} />
            <Row label="Closing balance" value={money(t.closingMinor)} strong />
          </tbody>
        </table>
        <p className="text-xs text-muted-foreground">
          Balance = what {SITE.name} owes the business (negative: dues owed to {SITE.name}). Collected at the
          counter this month, not part of the balance: {money(t.counterCollectedMinor)}.
        </p>
      </Section>
      {t.perSalon.length > 0 && (
        <Section title="By branch">
          <Table
            head={["Branch", "Deposits", "Commission", "Other", "Net"]}
            rows={t.perSalon.map((s) => [
              s.salonName,
              money(s.depositsAppliedMinor),
              money(s.commissionMinor),
              money(s.netMinor - s.depositsAppliedMinor - s.commissionMinor),
              money(s.netMinor),
            ])}
            foot={[
              "Total",
              money(t.depositsAppliedMinor),
              money(t.commissionMinor),
              money(t.closingMinor - t.openingMinor - t.payoutsMinor - t.depositsAppliedMinor - t.commissionMinor),
              money(t.closingMinor - t.openingMinor - t.payoutsMinor),
            ]}
          />
        </Section>
      )}
    </>
  );
}

function Payout({ t }: { t: PayoutTotals }) {
  return (
    <>
      <Section title="Payment">
        <table className="w-full text-sm">
          <tbody>
            <Row label="Payout reference" value={t.reference} />
            <Row label="Paid on" value={t.paidAt ? dhakaDate(t.paidAt) : "—"} />
            <Row label="Sent to" value={t.destination ?? t.method ?? "—"} />
            <Row label="Transfer reference" value={t.bankReference ?? "—"} />
          </tbody>
        </table>
      </Section>
      <Section title="What it is made of">
        <table className="w-full text-sm">
          <tbody>
            <Row label="Deposits applied to bookings" value={money(t.depositsAppliedMinor)} />
            <Row label="No-show share" value={money(t.noShowShareMinor)} />
            <Row label="Late cancellation fees" value={money(t.lateCancelMinor)} />
            <Row label="Platform commission" value={money(t.commissionMinor)} />
            <Row label="Goodwill credits" value={money(t.goodwillMinor)} />
            <Row label="Dues paid" value={money(t.duesPaidMinor)} />
            <Row label="Adjustments" value={money(t.adjustmentsMinor)} />
            <Row label="Amount paid" value={money(t.netMinor)} strong />
          </tbody>
        </table>
      </Section>
      {t.perSalon.length > 0 && (
        <Section title="By branch">
          <Table
            head={["Branch", "Lines", "Net"]}
            rows={t.perSalon.map((s) => [s.salonName, String(s.entryCount), money(s.netMinor)])}
            foot={["Total", String(t.entryCount), money(t.netMinor)]}
          />
        </Section>
      )}
    </>
  );
}

function Invoice({ t }: { t: InvoiceTotals }) {
  return (
    <>
      <Section title="Commission by branch">
        <Table
          head={["Branch", "Bookings", "Commission"]}
          rows={t.lines.map((l) => [l.salonName, String(l.bookings), money(l.commissionMinor)])}
        />
        <table className="ml-auto w-full max-w-xs text-sm">
          <tbody>
            <Row label="Subtotal" value={money(t.subtotalMinor)} />
            {t.vatRatePercent > 0 && (
              <>
                <Row label="Net of VAT" value={money(t.netOfVatMinor)} muted />
                <Row label={`VAT included (${t.vatRatePercent}%)`} value={money(t.vatMinor)} muted />
              </>
            )}
            <Row label="Total" value={money(t.totalMinor)} strong />
          </tbody>
        </table>
      </Section>
      <p className="text-xs text-muted-foreground">
        This commission was already deducted from the business&apos;s balance; nothing is due on this invoice.
      </p>
    </>
  );
}

/** One statement as a plain, printable page. */
export function StatementDocument({ statement: s }: { statement: OwnerStatementDetail }) {
  const issuedAs = s.kind === "INVOICE" ? (s.totals as InvoiceTotals).buyer : null;
  const billTo = {
    name: issuedAs?.businessName ?? s.owner.businessName,
    legalName: issuedAs?.legalName ?? s.owner.legalName,
    address: issuedAs?.address ?? s.owner.address,
    bin: issuedAs?.bin ?? s.owner.bin,
    tin: issuedAs?.tin ?? s.owner.tin,
  };

  return (
    <div className="space-y-4">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/money/statements">
            <ArrowLeft aria-hidden />
            Statements
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={`/api/owner/export/statements/${s.id}.csv`} download>
              <Download aria-hidden />
              CSV
            </a>
          </Button>
          <PrintButton />
        </div>
      </div>

      <article
        id="statement-doc"
        className="mx-auto w-full max-w-[210mm] space-y-6 rounded-2xl border bg-surface p-5 text-foreground shadow-xs sm:p-8"
      >
        <header className="flex flex-col gap-4 border-b-2 border-foreground/70 pb-4 sm:flex-row sm:justify-between">
          <div>
            <p className="text-lg font-bold">{s.platform.legalName}</p>
            {s.platform.bin && <p className="text-xs text-muted-foreground">BIN {s.platform.bin}</p>}
          </div>
          <div className="sm:text-right">
            <h1 className="text-xl font-bold">{HEADING[s.kind]}</h1>
            {s.number && <p className="text-sm font-semibold">No. {s.number}</p>}
            <p className="text-sm">Period {statementPeriod(s.periodStart, s.periodEnd)}</p>
            <p className="text-xs text-muted-foreground">Issued {dhakaDate(s.createdAt)}</p>
          </div>
        </header>

        <section className="text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {s.kind === "INVOICE" ? "Bill to" : "Business"}
          </p>
          <p className="font-semibold">{billTo.name}</p>
          {billTo.legalName && billTo.legalName !== billTo.name && <p>{billTo.legalName}</p>}
          {billTo.address && <p>{billTo.address}</p>}
          {(billTo.bin || billTo.tin) && (
            <p className="text-xs text-muted-foreground">
              {[billTo.bin && `BIN ${billTo.bin}`, billTo.tin && `TIN ${billTo.tin}`].filter(Boolean).join(" · ")}
            </p>
          )}
        </section>

        {s.kind === "MONTHLY" && <Monthly t={s.totals as MonthlyTotals} />}
        {s.kind === "PAYOUT" && <Payout t={s.totals as PayoutTotals} />}
        {s.kind === "INVOICE" && <Invoice t={s.totals as InvoiceTotals} />}

        <footer className="border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
          Amounts in Bangladeshi taka. Generated from the ledger; every line is in the CSV download. Ledger
          check {s.ledgerHash.slice(0, 16)}.
        </footer>
      </article>
    </div>
  );
}
