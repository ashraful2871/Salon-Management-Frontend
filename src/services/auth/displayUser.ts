import { cache } from "react";

import { getMe } from "./getMe";
import { getSessionUser, type SessionUser } from "./session";

/**
 * The signed-in user as the header and dashboard show them.
 *
 * The access token carries the account's `name`, but tokens minted before that
 * claim existed only have the email, and `getSessionUser` stands the email
 * prefix in for it. For those, one `/auth/me` read fills in the real name; it
 * stops happening on its own once the token is next refreshed.
 */
export const getDisplayUser = cache(async (): Promise<SessionUser | null> => {
  const user = await getSessionUser();
  if (!user || user.hasName) return user;

  const me = await getMe();
  const name = me.success ? me.data?.name?.trim() : undefined;
  return name ? { ...user, name, hasName: true } : user;
});
