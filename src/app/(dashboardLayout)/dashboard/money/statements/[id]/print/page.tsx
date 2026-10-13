import { ErrorState } from "@/components/Shared/ErrorState";
import { StatementDocument } from "@/components/Money/StatementDocument";
import { getOwnerStatement } from "@/services/owner/getOwnerStatement";

export const metadata = { title: "Statement" };
export const dynamic = "force-dynamic";

export default async function StatementPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const result = await getOwnerStatement((await params).id);
  if (!result.success || !result.data) return <ErrorState message={result.message} />;
  return <StatementDocument statement={result.data} />;
}
