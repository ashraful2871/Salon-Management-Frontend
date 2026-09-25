import type { ApiResponse } from "@/lib/api-types";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export type AssistantStatus = {
  enabled: boolean;
  /** Typed messages may reach Google Gemini; the privacy line says so. */
  llm: boolean;
};

const OFF: AssistantStatus = { enabled: false, llm: false };

/**
 * Whether the assistant is on, asked of the API rather than kept as a second
 * flag here: `ASSISTANT_ENABLED=false` on Render makes this 404, and the
 * launcher disappears everywhere within a minute with nothing to redeploy on
 * Vercel. A down API reads as off, too — a chat that cannot answer is worse
 * than no chat.
 *
 * Bare `fetch`, no cookie: the answer is the same for every visitor, so they
 * all share one cached copy.
 */
export const getAssistantStatus = async (): Promise<AssistantStatus> => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/assistant/status`, {
      next: { revalidate: 60, tags: ["assistant-status"] },
    });
    if (!response.ok) return OFF;

    const result = (await response.json()) as ApiResponse<AssistantStatus>;
    return result.success && result.data?.enabled
      ? { enabled: true, llm: Boolean(result.data.llm) }
      : OFF;
  } catch {
    return OFF;
  }
};
