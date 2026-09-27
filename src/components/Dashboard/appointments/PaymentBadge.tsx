import { Badge } from "@/components/ui/badge";
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
        <Badge variant="warning" className="max-w-full whitespace-normal">
          {viewer === "owner"
            ? `Due ${formatBDT(due)}`
            : deposit > 0
              ? `Deposit ${formatBDT(deposit)} paid · Pay ${formatBDT(due)} at salon`
              : `Pay ${formatBDT(due)} at salon`}
        </Badge>
      );
    case "PAID":
      return (
        <Badge variant="success" className="max-w-full whitespace-normal">
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
        </Badge>
      );
    case "UNRECORDED":
      // The salon forgot to log the counter payment. That is theirs to fix;
      // the customer just sees "Completed" from the status badge.
      if (viewer === "customer") return null;
      return (
        <Badge variant="danger" className="max-w-full whitespace-normal">
          Payment not recorded
        </Badge>
      );
    case "REFUNDED":
      return (
        <Badge variant="secondary" className="max-w-full whitespace-normal">
          Refunded
        </Badge>
      );
    default:
      return null;
  }
};
