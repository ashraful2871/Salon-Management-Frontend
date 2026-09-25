// Server-only: reads the incoming request's headers.

import { headers } from "next/headers";

/**
 * The visitor's own address, for the API's rate limiter. Every call reaches the
 * API from this server, so without it one bucket would serve every visitor.
 * `clientIp()` on the API trusts `X-Client-IP` only when `X-Internal-Key`
 * matches, so both are sent or neither is.
 */
export const clientIpHeaders = async (): Promise<Record<string, string>> => {
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!internalKey) return {};

  const incoming = await headers();
  const ip =
    incoming.get("x-real-ip")?.trim() ||
    incoming.get("x-forwarded-for")?.split(",")[0]?.trim();

  return ip ? { "X-Client-IP": ip, "X-Internal-Key": internalKey } : {};
};
