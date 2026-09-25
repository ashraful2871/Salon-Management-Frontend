import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  PATHNAME_HEADER,
  ROUTE_ROLES,
  deniedUrl,
  isSignedInRole,
  loginUrl,
  type ProtectedRoute,
} from "@/lib/route-access";
import { getSessionUser, type SessionUser } from "@/services/auth/session";
import type { UserRole } from "@/services/auth/auth-utils";

/**
 * The enforcing half of the access rules in `route-access.ts`.
 *
 * The proxy turns most unauthorised requests away before they reach a render,
 * but it decides from a token it never verifies, and it does not run for a
 * Server Action or a direct `fetch` of an RSC payload. These helpers are the
 * ones that count: they run inside the render, on a signature-verified session,
 * and they are what stands between a hand-typed URL and somebody else's page.
 *
 * Called from a layout, a guard covers its whole subtree, including routes
 * added under it later.
 */

/**
 * The path being rendered, as the proxy recorded it.
 *
 * Only ever used to build the `?redirect=` that returns the user to where they
 * were headed, so a missing or malformed header costs a nicety, not a guard.
 * The proxy overwrites the header on every request it forwards, so a client
 * cannot dictate it - and the login page revalidates the value regardless.
 */
const requestedPath = async (fallback: string): Promise<string> => {
  try {
    const value = (await headers()).get(PATHNAME_HEADER);

    return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
  } catch {
    return fallback;
  }
};

/**
 * The signed-in user, or a redirect to sign in.
 *
 * Every caller gets a `SessionUser` back - the `redirect` throws, so there is
 * no null branch to forget downstream.
 */
export const requireUser = async (
  returnToFallback = "/dashboard",
): Promise<SessionUser> => {
  const user = await getSessionUser();

  if (!user || !isSignedInRole(user.role)) {
    redirect(loginUrl(await requestedPath(returnToFallback)));
  }

  return user;
};

/**
 * The signed-in user, provided their role is one of `roles`.
 *
 * A wrong role is not an error state: the user is a legitimate user who asked
 * for the wrong door, so they are put back on their own dashboard with a flag
 * the toast picks up. A missing session, by contrast, goes to the login page -
 * telling the two apart is what keeps "sign in again" from being the answer to
 * a permissions problem.
 */
export const requireRole = async (
  roles: readonly UserRole[],
  returnToFallback = "/dashboard",
): Promise<SessionUser> => {
  const user = await requireUser(returnToFallback);

  if (!roles.includes(user.role)) {
    redirect(deniedUrl(user.role));
  }

  return user;
};

/**
 * Guard a route segment using the shared table rather than a repeated list.
 *
 * `route` is the segment's own path, typed against `ROUTE_ROLES`, so a folder
 * renamed without updating the table fails the build instead of quietly opening
 * itself to everyone.
 */
export const guardRoute = async (route: ProtectedRoute): Promise<SessionUser> =>
  requireRole(ROUTE_ROLES[route], route);
