import { guardRoute } from "@/lib/auth-guard";

/**
 * Role gate for this subtree. The allowed roles live in `ROUTE_ROLES`, not
 * here, so this segment and its sidebar link can never disagree.
 */
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardRoute("/dashboard/customers");

  return children;
}
