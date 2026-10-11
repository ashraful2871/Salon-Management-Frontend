"use server";

// The owner's chosen branch: "all", or one salon id. Server components read it
// with `getSelectedBranch()` and pass the id (or nothing, for "all") to their
// services; the branch switcher writes it with `setSelectedBranch`. It only
// narrows what a page asks for - the backend still checks every salonId.

import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { TAGS } from "./cache-tags";
import { getMyAccess } from "@/services/owner/getMyAccess";

const BRANCH_COOKIE = "sm_branch";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** "all", or a salon id the caller still has access to (else "all"). */
export async function getSelectedBranch(): Promise<string> {
  const raw = (await cookies()).get(BRANCH_COOKIE)?.value;
  if (!raw || raw === "all") return "all";

  const access = await getMyAccess();
  const known = access.success && access.data?.some((b) => b.salonId === raw);
  return known ? raw : "all";
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

  (await cookies()).set(BRANCH_COOKIE, value, {
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}
