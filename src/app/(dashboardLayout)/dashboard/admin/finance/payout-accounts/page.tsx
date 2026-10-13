import { getAdminMe } from "@/services/admin/getAdminMe";
import { getAdminPayoutAccounts } from "@/services/admin/finance/getAdminPayoutAccounts";
import { getKycQueue } from "@/services/admin/finance/getKycQueue";
import type { PayoutAccountStatus } from "@/services/admin/finance/payoutAccountTypes";
import { can } from "@/lib/admin-permissions";
import { PayoutAccountsClient, type AccountsTab } from "./PayoutAccountsClient";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TABS: AccountsTab[] = ["PENDING_VERIFICATION", "VERIFIED", "REJECTED", "DISABLED", "KYC"];

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function PayoutAccountsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = (first(params.status) ?? "").toUpperCase();
  const tab = TABS.includes(raw as AccountsTab) ? (raw as AccountsTab) : "PENDING_VERIFICATION";
  const page = Math.max(1, Math.floor(Number(first(params.page))) || 1);

  // The account counts feed the tab chips on the KYC tab too.
  const [accounts, kyc, me] = await Promise.all([
    getAdminPayoutAccounts({
      status: tab === "KYC" ? "PENDING_VERIFICATION" : (tab as PayoutAccountStatus),
      page: tab === "KYC" ? 1 : page,
    }),
    tab === "KYC" ? getKycQueue({ status: "SUBMITTED", page }) : Promise.resolve(null),
    getAdminMe(),
  ]);
  const permissions = me.success ? (me.data?.permissions ?? []) : [];

  return (
    <PayoutAccountsClient
      tab={tab}
      page={page}
      accounts={accounts}
      kyc={kyc}
      canReveal={can(permissions, "users.view_pii")}
    />
  );
}
