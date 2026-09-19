"use server";

import { serverFetch } from "@/lib/server-fetch";
import type { ApiResponse } from "@/lib/api-types";

/**
 * Creating an agent used to be a bare `serverFetch.post` inside the modal
 * component. That put the call in the browser, where `serverFetch` cannot do
 * its job - the `Cookie` header it authenticates with is one the browser
 * refuses to send - so the API saw an unauthenticated request and refused it.
 * As a server action the cookie, and the token renewal behind it, are back.
 */

export type CreateAgentPayload = {
  name: string;
  email: string;
  password: string;
  division: string;
  district: string;
  area: string;
};

export const createAgent = async (
  payload: CreateAgentPayload,
): Promise<ApiResponse<null>> => {
  try {
    const response = await serverFetch.post("/agents/create", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result: ApiResponse<null> = await response.json();
    return result;
  } catch (error) {
    console.error("createAgent error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Failed to create agent.",
    };
  }
};
