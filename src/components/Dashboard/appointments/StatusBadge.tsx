import { ToneBadge } from "@/components/Shared/ToneBadge";

const LABELS: Record<string, string> = {
  CHECKED_IN: "Checked in",
  IN_PROGRESS: "In progress",
  NO_SHOW: "No show",
};

// Booking status only. Whether the bill is settled is PaymentBadge's job.
export const StatusBadge = ({ status }: { status: string }) => {
  const key = (status || "").toUpperCase().replace("-", "_");
  return <ToneBadge status={key}>{LABELS[key]}</ToneBadge>;
};
