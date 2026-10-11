import { getSessionUser } from "@/services/auth/session";
import { ImpersonationBannerClient } from "./ImpersonationBannerClient";

/**
 * The "Viewing as" bar, on every page of the dashboard shell and the public
 * layout while an admin runs a read-only view of this account. Render inside
 * <Suspense> on public pages: it reads the session cookie.
 */
export async function ImpersonationBanner() {
  const user = await getSessionUser();
  if (!user?.impersonating) return null;

  return <ImpersonationBannerClient name={user.name} until={user.impersonating.until} />;
}
