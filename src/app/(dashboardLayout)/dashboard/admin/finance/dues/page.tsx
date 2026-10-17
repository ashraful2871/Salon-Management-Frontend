import { getAdminMe } from "@/services/admin/getAdminMe";
import { getOwnerDues } from "@/services/admin/finance/dues";
import { can } from "@/lib/admin-permissions";
import { DuesClient } from "./DuesClient";

export const metadata = { title: "Owner dues" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DuesPage({ searchParams }: { searchParams: SearchParams }) {
  const includeTest = (await searchParams).includeTest === "true";
  const [dues, me] = await Promise.all([getOwnerDues(includeTest), getAdminMe()]);
  const permissions = me.success ? (me.data?.permissions ?? []) : [];

  return (
    <DuesClient
      rows={dues.success ? (dues.data ?? []) : []}
      error={dues.success ? null : dues.message}
      includeTest={includeTest}
      canAdjust={can(permissions, "finance.wallet_adjust")}
    />
  );
}
