import { guardPermission, guardRoute } from "@/lib/auth-guard";

/** Finance's layout already checks finance.view; this queue needs its own permission. */
export default async function Layout({ children }: { children: React.ReactNode }) {
  await guardRoute("/dashboard/admin/finance/payout-accounts");
  await guardPermission("finance.payout_accounts");

  return children;
}
