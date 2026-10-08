"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/lib/api-types";
import type { AuthResult } from "@/lib/auth-types";
import { applySession, extractTokens } from "@/lib/auth-session";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { setVerifyCookie } from "@/lib/verify-cookie";
import { setTwoFactorCookie } from "@/lib/two-factor-cookie";

/**
 * A server action: the verification ticket and the visitor's IP must never
 * pass through the browser. `SIGNED_IN` sets the session here;
 * `VERIFICATION_REQUIRED` (an unverified account while the backend's flag is
 * on) parks the ticket in `sm_verify` and goes to the code screen, carrying
 * `redirect` along so the code lands them where they were headed.
 * `TWO_FACTOR_REQUIRED` (an admin or agent with 2FA on) parks the ticket in
 * `sm_2fa` and answers `twoFactor: true`, and the form shows the code step.
 */
export const loginUser = async (
  _currentState: ApiResponse<{ message: string; twoFactor?: boolean }> | null,
  formData: FormData,
): Promise<ApiResponse<{ message: string; twoFactor?: boolean }>> => {
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

    if (result.data?.status === "TWO_FACTOR_REQUIRED") {
      await setTwoFactorCookie(result.data, redirectTo);
      return {
        success: true,
        message: "Enter the code from your authenticator app",
        data: { message: "Enter the code from your authenticator app", twoFactor: true },
      };
    }

    const tokens = extractTokens(res, result);
    if (!tokens) throw new Error("Tokens not found in response");

    await applySession(tokens);

    revalidatePath("/", "layout");

    // Admins and agents go to the dashboard, which sends a not-yet-enrolled
    // account to the 2FA setup page.
    const role = result.data?.status === "SIGNED_IN" ? result.data.user?.role : undefined;
    if (redirectTo) {
      redirect(redirectTo as string);
    } else if (role === "ADMIN" || role === "AGENT") {
      redirect("/dashboard");
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
