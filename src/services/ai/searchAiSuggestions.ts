"use server";

import { serverFetch } from "@/lib/server-fetch";

export const searchAiSuggestions = async (prompt: string) => {
  try {
    const response = await serverFetch.post("/ai/search", {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.log("Error in AI search:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong while fetching AI suggestions.",
    };
  }
};
