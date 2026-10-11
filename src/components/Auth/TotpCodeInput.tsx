"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

/**
 * The 6-digit authenticator code, as two groups of three. Used by the sign-in
 * code step, 2FA enrolment and the step-up dialog. `onComplete` fires on the
 * sixth digit so callers can submit without a click.
 */
export default function TotpCodeInput({
  id,
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  describedBy,
  autoFocus = true,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
}) {
  return (
    <InputOTP
      id={id}
      maxLength={6}
      inputMode="numeric"
      pattern={REGEXP_ONLY_DIGITS}
      autoComplete="one-time-code"
      autoFocus={autoFocus}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      aria-invalid={invalid ? true : undefined}
      aria-describedby={describedBy}
      containerClassName="justify-center"
    >
      <InputOTPGroup>
        {[0, 1, 2].map((i) => (
          <InputOTPSlot key={i} index={i} aria-invalid={invalid} />
        ))}
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        {[3, 4, 5].map((i) => (
          <InputOTPSlot key={i} index={i} aria-invalid={invalid} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
