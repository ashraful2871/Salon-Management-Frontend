/**
 * Admin permissions, named as the API names them (`admin.permissions.ts` on
 * the backend). `GET /admin/me` returns the caller's list; the nav, the page
 * guards and the buttons read it through `can`. Hiding something here is a
 * courtesy - the API checks the same permission on every request.
 *
 * Edge-safe: no imports, so the proxy and client components can use it too.
 */
export type Permission =
  | "users.view"
  | "users.view_pii"
  | "users.manage"
  | "users.role"
  | "users.delete"
  | "users.impersonate"
  | "salons.view"
  | "salons.review"
  | "salons.manage"
  | "salons.delete"
  | "bookings.view"
  | "bookings.manage"
  | "appeals.resolve"
  | "finance.view"
  | "finance.payouts"
  | "finance.refunds"
  | "finance.wallet_adjust"
  | "finance.wallet_freeze"
  | "finance.reconcile"
  | "finance.export"
  | "reviews.moderate"
  | "support.view"
  | "support.reply"
  | "support.assign"
  | "content.manage"
  | "analytics.view"
  | "analytics.export"
  | "settings.view"
  | "flags.manage"
  | "settings.manage"
  | "system.view"
  | "system.operate"
  | "audit.view"
  | "agents.manage"
  | "team.manage";

/** True when `perms` (from `getAdminMe`) holds `p`. A missing list holds nothing. */
export const can = (
  perms: readonly string[] | null | undefined,
  p: Permission,
): boolean => !!perms?.includes(p);
