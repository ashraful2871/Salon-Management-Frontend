import { ErrorState } from "@/components/Shared/ErrorState";
import { PayoutAccountCard } from "@/components/Money/PayoutAccountCard";
import { KycCard } from "@/components/Money/KycCard";
import { getPayoutAccounts } from "@/services/owner/getPayoutAccounts";

export const metadata = { title: "Payout settings" };

export default async function PayoutSettingsPage() {
  const response = await getPayoutAccounts();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Where we send your earnings, and the business details our finance team verifies.</p>
      {!response.success || !response.data ? (
        <ErrorState message={response.message} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <PayoutAccountCard settings={response.data} />
          <KycCard kyc={response.data.kyc} />
        </div>
      )}
    </div>
  );
}
