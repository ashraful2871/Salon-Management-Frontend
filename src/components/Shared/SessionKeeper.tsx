import { getSessionExpiry } from "@/services/auth/session";
import SessionKeepAlive from "./SessionKeepAlive";

/**
 * Reads the session's expiry on the server and hands it to the client timer,
 * so the tab knows when to renew without being able to read the httpOnly
 * cookie (it cannot) or poll for it (wasteful).
 *
 * Renders nothing at all for a visitor, which keeps the keep-alive request off
 * the public pages entirely.
 */
const SessionKeeper = async () => {
  const expiresAt = await getSessionExpiry();

  if (expiresAt === null) return null;

  return <SessionKeepAlive initialExpiresAt={expiresAt} />;
};

export default SessionKeeper;
