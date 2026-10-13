import { notFound } from "next/navigation";
import { ErrorState } from "@/components/Shared/ErrorState";
import { PayoutDetail } from "@/components/Money/PayoutDetail";
import { getOwnerPayout } from "@/services/owner/getOwnerPayout";

export const metadata = { title: "Payout" };
export const dynamic = "force-dynamic";

export default async function PayoutPage({ params }: { params: Promise<{ id: string }> }) {
  const result = await getOwnerPayout((await params).id);

  if (!result.success || !result.data) {
    // The API answers 404 for a payout that is not this business's.
    if (result.message === "Not found") notFound();
    return <ErrorState message={result.message} />;
  }

  return <PayoutDetail payout={result.data} />;
}
