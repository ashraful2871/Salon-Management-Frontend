"use server";

// The owner's chosen branch: "all", or one salon id. Server components read it
// with `getSelectedBranch()` and pass the id (or nothing, for "all") to their
// services; the branch switcher writes it with `setSelectedBranch`. It only
// narrows what a page asks for - the backend still checks every salonId.

import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { TAGS } from "./cache-tags";
import { getMyAccess } from "@/services/owner/getMyAccess";
import { BRANCH_COOKIE, BRANCH_COOKIE_OPTIONS } from "./branch-cookie-name";

/**
 * "all", or a salon id the caller still has access to (else "all"). A team
 * member who owns none of their branches (a manager) has no "all": they fall
 * back to their first branch, so every page is pinned to one they work at.
 */
export async function getSelectedBranch(): Promise<string> {
  const raw = (await cookies()).get(BRANCH_COOKIE)?.value;
  const access = await getMyAccess();
  const branches = access.success ? (access.data ?? []) : [];
  const memberOnly = branches.length > 0 && !branches.some((b) => b.role === "OWNER");

  if (raw && raw !== "all" && branches.some((b) => b.salonId === raw)) return raw;
  return memberOnly ? branches[0].salonId : "all";
}

/** The selected branch as a `salonId` filter; `undefined` means every branch. */
export async function getSelectedSalonId(): Promise<string | undefined> {
  const branch = await getSelectedBranch();
  return branch === "all" ? undefined : branch;
}

export async function setSelectedBranch(id: string): Promise<void> {
  const value = id && id !== "all" ? id : "all";

  // A branch the cached list has not heard of (just created, say): refresh the
  // list so the next render can recognise it instead of falling back to "all".
  if (value !== "all") {
    const access = await getMyAccess();
    if (!access.success || !access.data?.some((b) => b.salonId === value)) {
      updateTag(TAGS.ownerAccess);
    }
  }

  (await cookies()).set(BRANCH_COOKIE, value, BRANCH_COOKIE_OPTIONS);
}
