"use server";

import { serverFetch } from "@/lib/server-fetch";

interface AiSearchData {
  aiResponse: string;
  salons: Array<Record<string, unknown>>;
}

interface AiSearchResponse {
  success: boolean;
  message: string;
  data?: AiSearchData;
}

export const searchAiSuggestions = async (
  prompt: string,
): Promise<AiSearchResponse> => {
  try {
    const response = await serverFetch.post("/ai/search", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const result: AiSearchResponse = await response.json();
    return result;
  } catch (error) {
    console.error("Error in AI search:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Something went wrong while fetching AI suggestions.",
    };
  }
};
