import { ToneBadge } from "@/components/Shared/ToneBadge";
import { formatBDT } from "@/lib/money";
import type { Appointment } from "@/lib/api-types";
import { paymentMethodLabel } from "./format";

type Billing = Pick<
  Appointment,
  | "paymentState"
  | "amountDueMinor"
  | "depositPaidMinor"
  | "paidAtCounterMinor"
  | "payment"
>;

// "Paid ৳150 (৳30 deposit + ৳120 cash)". The split is only spelled out when
// both halves are there; otherwise the total says it all.
const customerPaidLabel = (
  depositMinor: number,
  counterMinor: number,
  method: string | null,
) => {
  const paidMinor = depositMinor + counterMinor;
  if (paidMinor <= 0) return "Paid";
  if (depositMinor <= 0 || counterMinor <= 0) {
    return `Paid ${formatBDT(paidMinor)}`;
  }
  const via = method
    ? method.charAt(0).toLowerCase() + method.slice(1)
    : "at salon";
  return `Paid ${formatBDT(paidMinor)} (${formatBDT(depositMinor)} deposit + ${formatBDT(counterMinor)} ${via})`;
};

// Long customer labels wrap inside the pill instead of widening the row.
const WRAP = "max-w-full whitespace-normal text-left";

// Reads the server's `paymentState` rather than working it out here, so the
// owner and the customer can never disagree about whether a bill is paid.
export const PaymentBadge = ({
  appointment,
  viewer = "owner",
}: {
  appointment: Partial<Billing>;
  viewer?: "owner" | "customer";
}) => {
  const due = appointment.amountDueMinor ?? 0;
  const deposit = appointment.depositPaidMinor ?? 0;
  const method =
    appointment.payment?.status === "COMPLETED"
      ? paymentMethodLabel(appointment.payment.paymentMethod)
      : null;

  switch (appointment.paymentState) {
    case "UNPAID":
      return (
        <ToneBadge status="UNPAID" dot className={WRAP}>
          {viewer === "owner"
            ? `Due ${formatBDT(due)}`
            : deposit > 0
              ? `Deposit ${formatBDT(deposit)} paid · Pay ${formatBDT(due)} at salon`
              : `Pay ${formatBDT(due)} at salon`}
        </ToneBadge>
      );
    case "PAID":
      return (
        <ToneBadge status="PAID" dot className={WRAP}>
          {/* No counter payment means the deposit alone covered the bill. */}
          {viewer === "customer"
            ? customerPaidLabel(
                deposit,
                appointment.paidAtCounterMinor ?? 0,
                method,
              )
            : method
              ? `Paid · ${method}`
              : "Paid · Deposit"}
        </ToneBadge>
      );
    case "UNRECORDED":
      // The salon forgot to log the counter payment. That is theirs to fix;
      // the customer just sees "Completed" from the status badge.
      if (viewer === "customer") return null;
      return (
        <ToneBadge status="UNRECORDED" tone="danger" dot className={WRAP}>
          Payment not recorded
        </ToneBadge>
      );
    case "REFUNDED":
      return (
        <ToneBadge status="REFUNDED" dot className={WRAP}>
          Refunded
        </ToneBadge>
      );
    default:
      return null;
  }
};

/** Whether `PaymentBadge` shows anything, so a list line can skip it. */
export const hasPaymentBadge = (
  state: string | null | undefined,
  viewer: "owner" | "customer" = "owner",
) =>
  state === "UNPAID" ||
  state === "PAID" ||
  state === "REFUNDED" ||
  (state === "UNRECORDED" && viewer === "owner");
