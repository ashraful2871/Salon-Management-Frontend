import { Badge } from "@/components/ui/badge";

// Booking status only. Whether the bill is settled is PaymentBadge's job.
export const StatusBadge = ({ status }: { status: string }) => {
  const s = (status || "").toLowerCase();

  switch (s) {
    case "confirmed":
      return (
        <Badge className="bg-sage text-accent-foreground text-white">
          Confirmed
        </Badge>
      );
    case "checked_in":
      return <Badge className="bg-sky-600 text-white">Checked in</Badge>;
    case "in_progress":
    case "in-progress":
      return (
        <Badge className="bg-gold text-primary-foreground">In Progress</Badge>
      );
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "completed":
      return <Badge className="bg-primary text-primary-foreground">Completed</Badge>;
    case "cancelled":
    case "canceled":
      return <Badge variant="destructive">Cancelled</Badge>;
    case "no_show":
      return <Badge variant="destructive">No Show</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};
