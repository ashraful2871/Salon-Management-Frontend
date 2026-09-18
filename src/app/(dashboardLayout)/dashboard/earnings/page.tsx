import EarningsView from "@/components/Earnings/EarningsView";
import { getMyEarnings } from "@/services/settlement/getMyEarnings";

export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const result = await getMyEarnings(25);

  return (
    <EarningsView
      earnings={result.success ? (result.data ?? null) : null}
      error={result.success ? undefined : result.message}
    />
  );
}
