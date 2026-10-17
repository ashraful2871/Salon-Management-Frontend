import type { ApiResponse } from "@/lib/api-types";
import type { BranchAccess } from "@/services/owner/getMyAccess";

// What the caller may do at a branch, read off `GET /owner/access`
// (`getMyAccess`). Cosmetic only: it hides buttons a member could not use.
// The API checks every permission again on every call.

type Access = ApiResponse<BranchAccess[]> | BranchAccess[] | undefined | null;

const branchesOf = (access: Access): BranchAccess[] =>
  Array.isArray(access) ? access : access?.success ? (access.data ?? []) : [];

/**
 * True when the caller holds `perm` at `salonId`; with no salon ("All
 * branches"), when they hold it at any branch.
 */
export const canAt = (access: Access, perm: string, salonId?: string | null): boolean => {
  const branches = branchesOf(access);
  return salonId
    ? !!branches.find((b) => b.salonId === salonId)?.permissions.includes(perm)
    : branches.some((b) => b.permissions.includes(perm));
};

/** True when the caller owns at least one of their branches (the business owner). */
export const ownsAny = (access: Access): boolean =>
  branchesOf(access).some((b) => b.role === "OWNER");

/** The caller's seat at `salonId`, or `null` when they have none there. */
export const roleAt = (access: Access, salonId: string): BranchAccess["role"] | null =>
  branchesOf(access).find((b) => b.salonId === salonId)?.role ?? null;

/**
 * Account roles that run a branch's desk: the owner, and a manager at their
 * branches. Both get the branch switcher, the desk actions and Today v2.
 */
export const runsBranch = (role: string | null | undefined): boolean =>
  role === "SALON_OWNER" || role === "BRANCH_MANAGER";
