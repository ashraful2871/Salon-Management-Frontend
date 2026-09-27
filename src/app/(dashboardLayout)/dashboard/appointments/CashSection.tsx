import { CashSummary } from "@/components/Dashboard/appointments/CashSummary";
import type { getCashSummary } from "@/services/appoinments/getCashSummary";

// The owner's takings for the day being viewed, streamed in on their own. A
// failed read shows nothing rather than holding up the page.
export default async function CashSection({
  date,
  read,
}: {
  date: string;
  read: ReturnType<typeof getCashSummary>;
}) {
  const res = await read;
  if (!res?.success || !res.data) return null;
  return <CashSummary summary={res.data} date={date} />;
}
