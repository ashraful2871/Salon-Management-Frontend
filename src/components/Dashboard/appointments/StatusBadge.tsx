import type { ReactNode } from "react";
import { ToneBadge } from "@/components/Shared/ToneBadge";

const LABELS: Record<string, string> = {
  CHECKED_IN: "Checked in",
  IN_PROGRESS: "In progress",
  NO_SHOW: "No show",
};

// Booking status only. Whether the bill is settled is PaymentBadge's job.
export const StatusBadge = ({
  status,
  children,
  className,
}: {
  status: string;
  /** Relabel, e.g. "Checked in – you're in the queue" for the customer. */
  children?: ReactNode;
  className?: string;
}) => {
  const key = (status || "").toUpperCase().replace("-", "_");
  return (
    <ToneBadge status={key} dot className={className}>
      {children ?? LABELS[key]}
    </ToneBadge>
  );
};
