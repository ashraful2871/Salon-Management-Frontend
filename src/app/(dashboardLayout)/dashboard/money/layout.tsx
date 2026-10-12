import { guardRoute } from "@/lib/auth-guard";

/**
 * The owner's money pages. Role gate from `ROUTE_ROLES` (business owner only);
 * Phase 5 adds the balance, payouts and statements tabs here.
 */
export default async function Layout({ children }: { children: React.ReactNode }) {
  await guardRoute("/dashboard/money");

  return children;
}
