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

/** ADMIN/AGENT with 2FA on: the password was right, the authenticator code
 *  is still owed. `ticket` only ever lives in `sm_2fa`. */
export type TwoFactorRequired = {
  status: "TWO_FACTOR_REQUIRED";
  ticket: string;
  expiresIn: number;
};

/**
 * Google sign-in only, when the flow carried an invite code: whether it was
 * attached. `REFERRAL_NOT_NEW_ACCOUNT` means the Google account was already
 * ours; any other reason is a refused code (the account is ready either way).
 */
export type ReferralOutcome = {
  applied: boolean;
  reason?: "REFERRAL_NOT_NEW_ACCOUNT" | "REFERRAL_PROGRAM_OFF" | "REFERRAL_CODE_INVALID" | "REFERRAL_SELF";
};

export type AuthResult = (SignedIn | VerificationRequired | TwoFactorRequired) & {
  referral?: ReferralOutcome;
};

/** `resend-otp` success: fresh timings for the code screen. */
export type OtpTimings = {
  expiresIn: number;
  resendIn: number;
};
