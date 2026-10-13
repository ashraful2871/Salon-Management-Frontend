import type { Tone } from "@/lib/status-tone";
import type { StatementKind } from "@/services/owner/statement-types";

export const KIND_LABEL: Record<StatementKind, { label: string; plural: string; tone: Tone }> = {
  MONTHLY: { label: "Monthly", plural: "Monthly", tone: "primary" },
  PAYOUT: { label: "Payout", plural: "Payouts", tone: "success" },
  INVOICE: { label: "Invoice", plural: "Invoices", tone: "info" },
};

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Dhaka",
});

/** A date as the owner reads it: Asia/Dhaka, "1 Sept 2026". */
export const dhakaDate = (iso: string) => DATE.format(new Date(iso));

/** "1 Sept 2026 – 30 Sept 2026"; the API's period end is exclusive. */
export const statementPeriod = (startIso: string, endIso: string) =>
  `${dhakaDate(startIso)} – ${dhakaDate(new Date(new Date(endIso).getTime() - 1).toISOString())}`;
