// Shared plumbing for the three assistant server actions. Not a service and
// not a server action module itself - it exports plain helpers the `"use
// server"` files call, which is why it lives in `lib/` rather than
// `services/assistant/`.

import { headers } from "next/headers";

import type { AssistantTurn } from "./assistant-types";
import { getCookie } from "@/services/auth/cookiesHandler";

/** The guest key. httpOnly and server-side only: it is the whole of a guest's
 *  claim to their own conversation, so it never reaches the browser. */
export const CHAT_COOKIE = "sm_chat";

export const CHAT_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
};

/**
 * The way back from the gateway. The wallet result pages belong to the
 * SSLCommerz config and cannot carry a chat id, and a desktop top-up opens in
 * a new tab whose sessionStorage is empty — so the conversation id rides here,
 * short-lived, and `/assistant?resume=1` picks it up.
 */
export const CHAT_RESUME_COOKIE = "sm_chat_resume";

export const CHAT_RESUME_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 30,
};

/**
 * Everything a turn needs on the wire: the guest key, and the visitor's own
 * address so the API's rate limiter counts visitors rather than this server
 * (every call reaches the API from Vercel, so without it one bucket would
 * serve everyone). `clientIp()` on the API trusts the header only when the
 * shared key matches, so both are sent or neither is.
 */
export const assistantHeaders = async (): Promise<Record<string, string>> => {
  const out: Record<string, string> = { "Content-Type": "application/json" };

  const key = await getCookie(CHAT_COOKIE);
  if (key) out["X-Assistant-Key"] = key;

  const internalKey = process.env.INTERNAL_API_KEY;
  if (!internalKey) return out;

  const incoming = await headers();
  const ip =
    incoming.get("x-real-ip")?.trim() ||
    incoming.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (ip) {
    out["X-Client-IP"] = ip;
    out["X-Internal-Key"] = internalKey;
  }

  return out;
};

/** The real error in development, one fixed sentence in production. */
export const assistantErrorMessage = (error: unknown) =>
  process.env.NODE_ENV === "development"
    ? (error as Error).message
    : "The assistant is unavailable right now. Please try again.";

/**
 * `GET /conversations/:id` answers with the conversation row, whose id field is
 * `id`; the two POSTs answer with `conversationId`. Normalising here keeps that
 * seam out of every component.
 */
export const normalizeTurn = (
  data: (Partial<AssistantTurn> & { id?: string }) | undefined,
  fallbackId: string,
): AssistantTurn => ({
  conversationId: data?.conversationId ?? data?.id ?? fallbackId,
  anonymousId: data?.anonymousId ?? null,
  state: data?.state ?? { step: "greeting" },
  messages: Array.isArray(data?.messages) ? data.messages : [],
});
