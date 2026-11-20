// Server-only: reads the incoming request's cookies.

import { cookies } from "next/headers";
import { DEVICE_COOKIE } from "@/lib/referral";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `{ "X-Device-Id": <sm_did> }` when the browser has the device cookie the
 * proxy sets, else `{}`. The API hashes it (never stores it raw) for the
 * referral SAME_DEVICE signal: register, the Google start route, `GET
 * /referrals/me` (the referrer's device) and the booking quotes.
 */
export const deviceHeaders = async (): Promise<Record<string, string>> => {
  const id = (await cookies()).get(DEVICE_COOKIE)?.value;
  return id && UUID.test(id) ? { "X-Device-Id": id } : {};
};
