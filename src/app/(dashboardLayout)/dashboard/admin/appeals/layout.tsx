import { guardPermission, guardRoute } from "@/lib/auth-guard";

/** Role from `ROUTE_ROLES`, then the admin permission this page needs. */
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardRoute("/dashboard/admin/appeals");
  await guardPermission("appeals.resolve");

  return children;
}
