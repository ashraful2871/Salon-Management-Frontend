"use server";

import { serverFetch } from "@/lib/server-fetch";

export interface AiSalonService {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
}

export interface AiSalonMatch {
  id: string;
  name: string;
  description: string | null;
  address: string;
  area: string;
  district: string;
  city: string;
  images: string[];
  rating: number;
  totalReviews: number;
  phone: string;
  /** Cosine similarity to the query, 0-1. Higher is a closer match. */
  similarity: number;
  services: AiSalonService[];
}

interface AiSearchData {
  aiResponse: string;
  salons: AiSalonMatch[];
  query?: string;
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
