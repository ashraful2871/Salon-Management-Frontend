"use server";

import { getSessionUser } from "../auth/session";

/**
 * The caller's role, or `undefined` for a visitor.
 *
 * The verification and renewal now live in `getSessionUser`, which is what
 * stopped this returning `undefined` - and the dashboard sidebar collapsing to
 * its guest state - an hour after sign-in. A token past its expiry is renewed
 * here rather than read as "not signed in".
 */
export const getUserRoles = async () => {
  const user = await getSessionUser();

  return user?.role;
};
