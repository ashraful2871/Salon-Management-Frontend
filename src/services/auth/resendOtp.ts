"use server";

import type { ApiResponse } from "@/lib/api-types";
import type { OtpTimings } from "@/lib/auth-types";
import { clientIpHeaders } from "@/lib/client-ip-headers";
import {
  clearVerifyCookie,
  readVerifyCookie,
  updateVerifyTimings,
} from "@/lib/verify-cookie";

/**
 * "Send a new code". A success resets both timers in `sm_verify` so a reload
 * shows the new deadlines; a throttled send (429 `OTP_THROTTLED`) comes back
 * with `details.retryAfter` seconds for the button's countdown.
 */
export const resendOtpAction = async (): Promise<ApiResponse<OtpTimings>> => {
  const state = await readVerifyCookie();
  if (!state) {
    return {
      success: false,
      errorCode: "TICKET_EXPIRED",
      message: "Your verification session expired.",
    };
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/resend-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await clientIpHeaders()),
        },
        body: JSON.stringify({ ticket: state.t }),
      },
    );

    const result: ApiResponse<OtpTimings> = await res.json();

    if (!result.success || !result.data) {
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

    const { expiresIn, resendIn } = result.data;
    await updateVerifyTimings(expiresIn, resendIn);

    return {
      success: true,
      message: result.message,
      data: { expiresIn, resendIn },
    };
  } catch (error) {
    console.error("resendOtpAction error:", error);
    return {
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "We couldn't send a new code right now. Please try again.",
    };
  }
};
