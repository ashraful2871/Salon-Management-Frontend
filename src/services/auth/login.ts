"use server";

import { redirect } from "next/navigation";
import type { ApiResponse } from "@/lib/api-types";
import type { AuthResult } from "@/lib/auth-types";
import { applySession, extractTokens } from "@/lib/auth-session";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { setVerifyCookie } from "@/lib/verify-cookie";

/**
 * A server action: the verification ticket and the visitor's IP must never
 * pass through the browser. `SIGNED_IN` sets the session here;
 * `VERIFICATION_REQUIRED` (an unverified account while the backend's flag is
 * on) parks the ticket in `sm_verify` and goes to the code screen, carrying
 * `redirect` along so the code lands them where they were headed.
 */
export const loginUser = async (
  _currentState: ApiResponse<{ message: string }> | null,
  formData: FormData,
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const redirectTo = formData.get("redirect");

    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await clientIpHeaders()),
      },
      body: JSON.stringify(payload),
    });

    const result: ApiResponse<AuthResult> = await res.json();

    if (!result.success) {
      throw new Error(result.message || "Login failed");
    }

    if (result.data?.status === "VERIFICATION_REQUIRED") {
      await setVerifyCookie(result.data, redirectTo, "login");
      redirect("/verify-email");
    }

    const tokens = extractTokens(res, result);
    if (!tokens) throw new Error("Tokens not found in response");

    await applySession(tokens);

    if (redirectTo) {
      redirect(redirectTo as string);
    } else {
      redirect("/?loggedIn=true");
    }
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("loginUser error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Login Failed. You might have entered incorrect email or password.",
    };
  }
};
