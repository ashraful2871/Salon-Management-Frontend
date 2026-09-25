"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import type { AuthResult } from "@/lib/auth-types";
import { applySession, extractTokens } from "@/lib/auth-session";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import { setVerifyCookie } from "@/lib/verify-cookie";

/**
 * Registers the user, then one of two things. With the backend's email
 * verification flag on, the API answers `VERIFICATION_REQUIRED`: the ticket
 * goes into `sm_verify` and the code screen takes over. With it off, the API
 * returns the same token pair as /auth/login, so they are signed in on the
 * spot rather than bounced to the login screen to retype what they just typed.
 */
export const registerUser = async (
  _currentState: unknown,
  formData: FormData,
): Promise<any> => {
  let inputs;
  try {
    inputs = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      phoneNumber: formData.get("phoneNumber"),
      gender: formData.get("gender"),
    };

    if (inputs.password !== inputs.confirmPassword) {
      return {
        success: false,
        message: "Passwords do not match.",
        inputs,
      };
    }

    // The form's field is `phoneNumber`; the API reads `phone`.
    const { phoneNumber, ...rest } = inputs;
    const payload = { ...rest, phone: phoneNumber };

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await clientIpHeaders()),
        },
        body: JSON.stringify(payload),
      },
    );

    const result = await res.json();

    if (!result.success) {
      return { ...result, inputs };
    }

    const data = result.data as AuthResult | undefined;
    if (data?.status === "VERIFICATION_REQUIRED") {
      await setVerifyCookie(data, null, "register");
      redirect("/verify-email");
    }

    // The account exists either way — send them to sign in rather than
    // reporting a failure for something that actually succeeded.
    const tokens = extractTokens(res, result);
    if (!tokens) {
      redirect("/login?registered=true");
    }

    await applySession(tokens);

    redirect("/?registered=true");
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("registerUser error:", error);
    return {
      success: false,
      message: "Registration failed. Please try again.",
      inputs,
    };
  }
};
