"use server";

import { redirect } from "next/navigation";
import type { ApiResponse } from "@/lib/api-types";
import type { AuthResult } from "@/lib/auth-types";
import { applySession, extractTokens } from "@/lib/auth-session";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { clearVerifyCookie, readVerifyCookie } from "@/lib/verify-cookie";

const SESSION_EXPIRED = "Your verification session expired.";

/**
 * The code screen's submit. The ticket comes from `sm_verify`, never from the
 * form. A right code signs them in and sends them on; a wrong one comes back
 * as state with the backend's `errorCode` / `details` for the screen to word.
 */
export const verifyOtpAction = async (
  _prev: ApiResponse | null,
  formData: FormData,
): Promise<ApiResponse> => {
  const state = await readVerifyCookie();
  if (!state) {
    return {
      success: false,
      errorCode: "TICKET_EXPIRED",
      message: SESSION_EXPIRED,
    };
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await clientIpHeaders()),
        },
        body: JSON.stringify({
          ticket: state.t,
          code: String(formData.get("code") ?? "").trim(),
        }),
      },
    );

    const result: ApiResponse<AuthResult> = await res.json();

    if (!result.success) {
      // Nothing left to verify with this ticket: drop it so the screen does
      // not keep offering a dead one.
      if (
        result.errorCode === "TICKET_EXPIRED" ||
        result.errorCode === "ALREADY_VERIFIED"
      ) {
        await clearVerifyCookie();
      }
      return {
        success: false,
        message: result.message,
        errorCode: result.errorCode,
        details: result.details,
      };
    }

    const tokens = extractTokens(res, result);
    if (!tokens) throw new Error("Tokens not found in response");

    await applySession(tokens);
    await clearVerifyCookie();
  } catch (error) {
    console.error("verifyOtpAction error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "We couldn't check that code right now. Please try again.",
    };
  }

  redirect(
    state.n ?? (state.k === "register" ? "/?registered=true" : "/?loggedIn=true"),
  );
};
