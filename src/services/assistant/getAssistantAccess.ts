import { cache } from "react";

import { getSessionUser } from "@/services/auth/session";
import { getAssistantStatus } from "./getAssistantStatus";

export type AssistantAccess = {
  /** Draw the launcher, the entry points and `/assistant` for this visitor. */
  enabled: boolean;
  llm: boolean;
  signedIn: boolean;
};

/**
 * The staged rollout. `ASSISTANT_ALLOWLIST` (server-only, comma-separated
 * emails) shows the assistant to those signed-in accounts alone; empty or
 * unset, to everyone. This is visibility, not access control — the API stays
 * open to anyone who calls it directly, which is fine for a soft launch and is
 * why the kill switch lives on the API instead.
 */
const allowlist = () =>
  (process.env.ASSISTANT_ALLOWLIST ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

/** Memoised per request: the layout and `/assistant` both ask. */
export const getAssistantAccess = cache(async (): Promise<AssistantAccess> => {
  const [status, user] = await Promise.all([
    getAssistantStatus(),
    getSessionUser(),
  ]);

  const list = allowlist();
  const allowed =
    list.length === 0 ||
    (user?.email ? list.includes(user.email.toLowerCase()) : false);

  return {
    enabled: status.enabled && allowed,
    llm: status.llm,
    signedIn: Boolean(user),
  };
});
