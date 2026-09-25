import { ROLE_HOME } from "@/lib/route-access";

export type UserRole =
  | "CUSTOMER"
  | "STAFF"
  | "SALON_OWNER"
  | "ADMIN"
  | "AGENT"
  | "GUEST";

/**
 * Where a role belongs after signing in, or after being turned away from a page
 * that is not theirs. The table itself lives with the rest of the access rules.
 */
export const getDefaultDashboardRoute = (role: UserRole): string =>
  ROLE_HOME[role];
