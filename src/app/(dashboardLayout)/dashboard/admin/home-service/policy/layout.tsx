import { guardPermission, guardRoute } from "@/lib/auth-guard";

/** Role from `ROUTE_ROLES`, then the admin permission this page needs. Editing is per field. */
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardRoute("/dashboard/admin/home-service/policy");
  await guardPermission("homeservice.view");

  return children;
}
