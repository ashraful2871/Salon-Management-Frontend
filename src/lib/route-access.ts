/**
 * The one table of who may open which route.
 *
 * Everything that makes an access decision reads this file: the proxy that
 * gates requests at the edge, the server-side guards that enforce the decision
 * where it actually counts, and the sidebar that decides which links to draw.
 * Keeping them on one table is what makes "the link is hidden" and "the URL is
 * blocked" the same statement - typing a dashboard path you have no link for
 * now bounces you back rather than rendering someone else's page.
 *
 * This module must stay importable from the Edge runtime: no `next/headers`,
 * no `jsonwebtoken`, no Node built-ins.
 */

import type { UserRole } from "@/services/auth/auth-utils";

/**
 * Header the proxy stamps on each forwarded request, so a guard rendering deep
 * inside a layout tree can still name the path the user asked for. It lives
 * here rather than beside the guards because the proxy must import it without
 * dragging Node-only code into the Edge bundle.
 */
export const PATHNAME_HEADER = "x-pathname";

/** Every role a real, signed-in account can carry. `GUEST` is the absence of one. */
export const SIGNED_IN_ROLES = [
  "CUSTOMER",
  "STAFF",
  "SALON_OWNER",
  "ADMIN",
  "AGENT",
] as const satisfies readonly UserRole[];

export const isSignedInRole = (role: UserRole | undefined | null): role is UserRole =>
  !!role && (SIGNED_IN_ROLES as readonly string[]).includes(role);

/**
 * Subtrees that require a session. A path under one of these is never served to
 * a visitor; which roles may then proceed is `ROUTE_ROLES`' business.
 */
const PRIVATE_TREES = ["/dashboard", "/my-profile"] as const;

/**
 * Pages that only make sense signed out. A signed-in user who lands here is
 * sent home instead of being shown a second login form.
 *
 * `reset-password` and `verify-email` are deliberately absent: both are opened
 * from an email link, sometimes while a session is still alive, and bouncing
 * them would strand the user on a dashboard with an unusable link.
 */
const GUEST_ONLY_ROUTES = ["/login", "/register"] as const;

/**
 * Role lists per route, keyed by the route's own path.
 *
 * A path inherits from the longest key that prefixes it, so `/dashboard/store/42`
 * is governed by `/dashboard/store` and `/dashboard/admin/agents` by its own
 * entry rather than by `/dashboard/admin`. Anything inside a private tree with
 * no entry at all falls back to "any signed-in role", which is the right answer
 * for the shared pages (settings, wallet, profile) and a safe one for a page
 * added later and forgotten here.
 */
export const ROUTE_ROLES = {
  "/dashboard": SIGNED_IN_ROLES,
  "/dashboard/appointments": ["SALON_OWNER", "STAFF", "CUSTOMER"],
  "/dashboard/slots": ["SALON_OWNER"],
  "/dashboard/customers": ["SALON_OWNER", "STAFF"],
  "/dashboard/services": ["SALON_OWNER"],
  "/dashboard/store": ["SALON_OWNER"],
  "/dashboard/earnings": ["SALON_OWNER"],
  // The back office. Agents get Home, Salons and their security page; the
  // rest is ADMIN only. The admin layout checks each child against its own
  // entry, and each page also checks its permission (`guardPermission`),
  // since an ADMIN's admin role narrows it further.
  "/dashboard/admin": ["ADMIN", "AGENT"],
  "/dashboard/admin/security": ["ADMIN", "AGENT"],
  "/dashboard/admin/salons": ["ADMIN", "AGENT"],
  "/dashboard/admin/users": ["ADMIN"],
  "/dashboard/admin/bookings": ["ADMIN"],
  "/dashboard/admin/appeals": ["ADMIN"],
  "/dashboard/admin/agents": ["ADMIN"],
  "/dashboard/admin/applications": ["ADMIN"],
  "/dashboard/admin/finance": ["ADMIN"],
  "/dashboard/admin/finance/topups": ["ADMIN"],
  "/dashboard/admin/finance/payouts": ["ADMIN"],
  "/dashboard/admin/finance/wallets": ["ADMIN"],
  "/dashboard/admin/finance/ledger": ["ADMIN"],
  "/dashboard/admin/finance/approvals": ["ADMIN"],
  "/dashboard/admin/team": ["ADMIN"],
  "/dashboard/admin/settings": ["ADMIN"],
  "/dashboard/admin/system": ["ADMIN"],
  "/dashboard/admin/content": ["ADMIN"],
  "/dashboard/admin/reviews": ["ADMIN"],
  "/dashboard/admin/support": ["ADMIN"],
  "/dashboard/admin/analytics": ["ADMIN"],
  // Old admin URLs: the proxy sends admins on (`ADMIN_MOVED`), and nobody
  // else has a page here.
  "/dashboard/become-a-salon-owner-request": [],
  "/dashboard/approval-salon": [],
  "/dashboard/applications-status": ["SALON_OWNER", "CUSTOMER"],
  "/dashboard/settings": SIGNED_IN_ROLES,
  "/dashboard/wallet": ["CUSTOMER"],
  "/my-profile": SIGNED_IN_ROLES,
} as const satisfies Record<string, readonly UserRole[]>;

/** Where an ADMIN or AGENT without 2FA is sent; the API refuses the rest. */
export const ADMIN_SECURITY_PATH = "/dashboard/admin/security";

/** The paths a segment guard may name - a typo is a build error, not a hole. */
export type ProtectedRoute = keyof typeof ROUTE_ROLES;

/**
 * Where a role is sent when it asks for something it may not have.
 *
 * Admins and agents have their own home in the back office; everyone else
 * lands on `/dashboard`, which renders per role.
 */
export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: "/dashboard/admin",
  AGENT: "/dashboard/admin",
  SALON_OWNER: "/dashboard",
  STAFF: "/dashboard",
  CUSTOMER: "/dashboard",
  GUEST: "/login",
};

/**
 * Admin pages that moved under `/dashboard/admin`, and where they went. The
 * proxy redirects ADMIN and AGENT before the role check, so old bookmarks
 * still open; for everyone else these paths are closed by `ROUTE_ROLES`.
 */
const ADMIN_MOVED: Record<string, string> = {
  "/dashboard": "/dashboard/admin",
  "/dashboard/customers": "/dashboard/admin/users",
  "/dashboard/approval-salon": "/dashboard/admin/salons?status=PENDING_APPROVAL",
  "/dashboard/become-a-salon-owner-request": "/dashboard/admin/applications",
  "/dashboard/admin/topups": "/dashboard/admin/finance/topups",
};

/** Where an admin or agent asking for an old admin URL goes, or `null`. */
export const adminMovedTo = (
  role: UserRole | undefined | null,
  pathname: string,
): string | null =>
  role === "ADMIN" || role === "AGENT" ? (ADMIN_MOVED[pathname] ?? null) : null;

/** True when `pathname` is `base` itself or something beneath it. */
const isUnder = (pathname: string, base: string): boolean =>
  pathname === base || pathname.startsWith(`${base}/`);

export const isPrivateRoute = (pathname: string): boolean =>
  PRIVATE_TREES.some((tree) => isUnder(pathname, tree));

export const isGuestOnlyRoute = (pathname: string): boolean =>
  GUEST_ONLY_ROUTES.some((route) => isUnder(pathname, route));

/**
 * The roles allowed on `pathname`, or `null` if it is public.
 *
 * Longest matching prefix wins, so the order of `ROUTE_ROLES` does not matter
 * and a nested route can narrow its parent.
 */
export const rolesForPath = (pathname: string): readonly UserRole[] | null => {
  if (!isPrivateRoute(pathname)) return null;

  let matched: readonly UserRole[] = SIGNED_IN_ROLES;
  let matchedLength = -1;

  for (const [route, roles] of Object.entries(ROUTE_ROLES)) {
    if (isUnder(pathname, route) && route.length > matchedLength) {
      matched = roles;
      matchedLength = route.length;
    }
  }

  return matched;
};

export const canAccessRoute = (
  role: UserRole | undefined | null,
  pathname: string,
): boolean => {
  const allowed = rolesForPath(pathname);

  if (allowed === null) return true;
  if (!isSignedInRole(role)) return false;

  return allowed.includes(role);
};

/** The sign-in page, carrying where to come back to. */
export const loginUrl = (returnTo?: string): string => {
  const safe = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//");

  return safe ? `/login?redirect=${encodeURIComponent(returnTo)}` : "/login";
};

/** Where a signed-in user goes after asking for a route their role cannot open. */
export const deniedUrl = (role: UserRole | undefined | null): string => {
  const home = isSignedInRole(role) ? ROLE_HOME[role] : "/";

  return `${home}?denied=true`;
};
