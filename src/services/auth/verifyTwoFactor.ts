"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import type { SignedIn } from "@/lib/auth-types";
import { applySession, extractTokens } from "@/lib/auth-session";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { clearTwoFactorCookie, readTwoFactorCookie } from "@/lib/two-factor-cookie";

const SESSION_EXPIRED = "Your sign-in expired. Please sign in again.";

/**
 * The second step of an admin or agent sign-in. The ticket comes from
 * `sm_2fa`, never from the form; the form sends either `code` (6 digits) or
 * `recoveryCode`. Bare `fetch`, like login, so the Set-Cookie headers can be
 * read and the session re-set on this domain.
 */
export const verifyTwoFactor = async (
  _prev: ApiResponse | null,
  formData: FormData,
): Promise<ApiResponse> => {
  const state = await readTwoFactorCookie();
  if (!state) {
    return { success: false, errorCode: "TICKET_EXPIRED", message: SESSION_EXPIRED };
  }

  const recoveryCode = String(formData.get("recoveryCode") ?? "").trim();
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await clientIpHeaders()),
      },
      body: JSON.stringify(
        recoveryCode ? { ticket: state.t, recoveryCode } : { ticket: state.t, code },
      ),
      cache: "no-store",
    });

    const result: ApiResponse<SignedIn> = await res.json();

    if (!result.success) {
      if (result.errorCode === "TICKET_EXPIRED") await clearTwoFactorCookie();
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
    await clearTwoFactorCookie();
  } catch (error) {
    console.error("verifyTwoFactor error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "We couldn't check that code right now. Please try again.",
    };
  }

  revalidatePath("/", "layout");
  redirect(state.n ?? "/dashboard");
};
