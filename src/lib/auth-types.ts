// The two answers register, login and verify-otp can give. Which one comes
// back depends on the backend's REQUIRE_EMAIL_VERIFICATION flag and on whether
// the account's email is verified, so every caller handles both.

/** Tokens issued: the same pair (and Set-Cookie headers) login always sent. */
export type SignedIn = {
  status: "SIGNED_IN";
  accessToken: string;
  refreshToken: string;
  user?: Record<string, unknown>;
};

/** A code was emailed. `ticket` is opaque and only ever lives in `sm_verify`;
 *  `expiresIn` / `resendIn` are seconds from now. */
export type VerificationRequired = {
  status: "VERIFICATION_REQUIRED";
  ticket: string;
  maskedEmail: string;
  expiresIn: number;
  resendIn: number;
};

export type AuthResult = SignedIn | VerificationRequired;

/** `resend-otp` success: fresh timings for the code screen. */
export type OtpTimings = {
  expiresIn: number;
  resendIn: number;
};
