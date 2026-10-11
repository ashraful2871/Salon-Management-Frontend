import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { guardRoute, requireRole } from "@/lib/auth-guard";
import { ADMIN_SECURITY_PATH, PATHNAME_HEADER, rolesForPath } from "@/lib/route-access";
import { getAdminMe } from "@/services/admin/getAdminMe";

/**
 * Role gate for this subtree. The allowed roles live in `ROUTE_ROLES`, not
 * here, so this segment and its sidebar link can never disagree.
 *
 * `/dashboard/admin` admits ADMIN and AGENT (agents need the security page);
 * children with their own, narrower entry (agents, topups) are checked
 * against it too. An account without 2FA is sent to the security page: the
 * API refuses every other admin route until it is set up.
 */
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardRoute("/dashboard/admin");

  const path = (await headers()).get(PATHNAME_HEADER) ?? "";
  const roles = rolesForPath(path);
  if (roles) await requireRole(roles, path);

  if (!path.startsWith(ADMIN_SECURITY_PATH)) {
    const me = await getAdminMe();
    if (me.success && me.data?.mfa.enrolled === false) redirect(ADMIN_SECURITY_PATH);
  }

  return children;
}
