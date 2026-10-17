import { ErrorState } from "@/components/Shared/ErrorState";
import { StatementsClient } from "@/components/Money/StatementsClient";
import { getOwnerStatements } from "@/services/owner/getOwnerStatements";
import type { StatementKind } from "@/services/owner/statement-types";

export const metadata = { title: "Statements" };
export const dynamic = "force-dynamic";

const KINDS = new Set(["MONTHLY", "PAYOUT", "INVOICE"]);

export default async function StatementsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const requested = (await searchParams).kind;
  const kind = requested && KINDS.has(requested) ? (requested as StatementKind) : undefined;
  const result = await getOwnerStatements(kind);

  if (!result.success || !result.data) return <ErrorState message={result.message} />;

  return (
    <StatementsClient
      key={kind ?? "all"}
      initial={result.data.items}
      nextCursor={result.data.nextCursor}
      kind={kind}
    />
  );
}
