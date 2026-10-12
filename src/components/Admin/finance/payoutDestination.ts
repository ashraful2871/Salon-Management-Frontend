import type { AdminPayout, PayoutDestination } from "@/services/admin/finance/types";

const TYPE_LABEL: Record<PayoutDestination["type"], string> = { BKASH: "bKash", NAGAD: "Nagad", BANK: "Bank" };

/** "bKash ••• 4821" / "City Bank ••• 4821" from the payout's snapshot, or null before Phase 3. */
export const destinationLabel = (snapshot: PayoutDestination | null | undefined) =>
  snapshot?.type && snapshot.last4
    ? `${snapshot.type === "BANK" ? snapshot.bankName || "Bank" : TYPE_LABEL[snapshot.type]} ••• ${snapshot.last4}`
    : null;

/** The transfer method a payout's destination implies (Nagad goes as a wallet transfer too). */
export const methodFor = (payout: AdminPayout): "BKASH" | "BANK" =>
  payout.destinationSnapshot?.type === "BANK" ? "BANK" : "BKASH";

/** The note on the transfer and in the bKash file: `SK-PO-<first 8 of the id>`. */
export const payoutNote = (id: string) => `SK-PO-${id.slice(0, 8).toUpperCase()}`;
