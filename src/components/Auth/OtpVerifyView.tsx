"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "../ui/input-otp";
import AuthShell from "./AuthShell";
import type { ApiResponse } from "@/lib/api-types";
import { verifyOtpAction } from "@/services/auth/verifyOtp";
import { resendOtpAction } from "@/services/auth/resendOtp";
import { startOverAction } from "@/services/auth/startOver";

const showcase = {
  image:
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=1600&fit=crop",
  badge: "One Last Step",
  heading: (
    <>
      Six digits <br />
      and you&apos;re in.
    </>
  ),
  body: "The code proves this inbox is yours, so booking confirmations, receipts and reminders always reach you.",
};

/** What the error line under the boxes says, and where focus goes next. */
type Notice = {
  text: string;
  focus: "code" | "resend" | null;
  /** Set when the ticket is gone (expired or already used): the label of the
   *  link to /login, the only way on from here. */
  signIn: string | null;
};

const CODE_LENGTH = 6;

const mmss = (seconds: number | null) => {
  if (seconds === null) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const secondsUntil = (at: number, now: number | null) =>
  now === null ? null : Math.max(0, Math.ceil((at - now) / 1000));

const noticeFor = (result: ApiResponse): Notice => {
  switch (result.errorCode) {
    case "OTP_INVALID": {
      const left = result.details?.attemptsLeft;
      return {
        text:
          typeof left === "number"
            ? `That code isn't right. ${left} ${left === 1 ? "attempt" : "attempts"} left.`
            : "That code isn't right.",
        focus: "code",
        signIn: null,
      };
    }
    case "OTP_EXPIRED":
    case "OTP_LOCKED":
    case "OTP_NONE":
      return { text: result.message, focus: "resend", signIn: null };
    case "TICKET_EXPIRED":
      return {
        text: "Your verification session expired.",
        focus: null,
        signIn: "Sign in again",
      };
    case "ALREADY_VERIFIED":
      return { text: result.message, focus: null, signIn: "Go to sign in" };
    default:
      return { text: result.message, focus: "code", signIn: null };
  }
};

type Props = {
  maskedEmail: string;
  /** Epoch ms: when the current code stops working. */
  expiresAt: number;
  /** Epoch ms: when "Send a new code" unlocks. */
  resendAt: number;
};

/**
 * The 6-digit code screen. The ticket never reaches this component: it lives
 * in the httpOnly `sm_verify` cookie and the server actions read it there.
 */
const OtpVerifyView = ({ maskedEmail, expiresAt, resendAt }: Props) => {
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [deadlines, setDeadlines] = useState({ expiresAt, resendAt });
  const [isResending, startResend] = useTransition();

  const formRef = useRef<HTMLFormElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const resendRef = useRef<HTMLButtonElement>(null);

  // Null until mounted, so the server's clock never has to match the
  // browser's; ticks from a timer callback rather than the effect body.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const fail = (result: ApiResponse) => {
    if (result.errorCode === "ALREADY_VERIFIED") {
      toast.info("This email is already verified. Sign in to continue.");
    }
    setCode("");
    setNotice(noticeFor(result));
  };

  // A right code redirects from inside the action and never comes back here.
  const [, formAction, isVerifying] = useActionState(
    async (prev: ApiResponse | null, formData: FormData) => {
      const result = await verifyOtpAction(prev, formData);
      if (!result.success) fail(result);
      return result;
    },
    null,
  );

  // Focus moves after the error is on screen and the boxes are enabled again.
  useEffect(() => {
    if (notice?.focus === "code") codeRef.current?.focus();
    if (notice?.focus === "resend") resendRef.current?.focus();
  }, [notice]);

  const dead = Boolean(notice?.signIn);
  const expiresIn = secondsUntil(deadlines.expiresAt, now);
  const resendIn = secondsUntil(deadlines.resendAt, now);
  const canResend = resendIn === 0 && !isResending && !dead;

  const handleResend = () => {
    if (!canResend) return;
    startResend(async () => {
      const result = await resendOtpAction();

      if (result.success && result.data) {
        const at = Date.now();
        setDeadlines({
          expiresAt: at + result.data.expiresIn * 1000,
          resendAt: at + result.data.resendIn * 1000,
        });
        setCode("");
        setNotice(null);
        toast.success(`A new code is on its way to ${maskedEmail}.`);
        codeRef.current?.focus();
        return;
      }

      const retryAfter = result.details?.retryAfter;
      if (typeof retryAfter === "number") {
        setDeadlines((d) => ({ ...d, resendAt: Date.now() + retryAfter * 1000 }));
      }
      fail(result);
    });
  };

  return (
    <AuthShell
      title="Check your email"
      subtitle={
        <>
          We sent a 6-digit code to{" "}
          <strong className="text-slate-900 break-all">{maskedEmail}</strong>.{" "}
          {expiresIn === 0 ? (
            "That code has expired, so send yourself a new one below."
          ) : (
            <>
              It expires in{" "}
              <span className="tabular-nums font-bold text-slate-700">
                {mmss(expiresIn)}
              </span>
              .
            </>
          )}
        </>
      }
      showcase={showcase}
    >
      <div className="space-y-6">
        <form ref={formRef} action={formAction} className="space-y-5">
          <input type="hidden" name="code" value={code} />

          <div>
            <label
              htmlFor="otp-code"
              className="block text-sm font-bold text-slate-700 mb-2"
            >
              Verification code
            </label>
            <InputOTP
              id="otp-code"
              ref={codeRef}
              maxLength={CODE_LENGTH}
              inputMode="numeric"
              pattern={REGEXP_ONLY_DIGITS}
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(value) => {
                setCode(value);
                if (notice && !dead) setNotice(null);
              }}
              onComplete={() => formRef.current?.requestSubmit()}
              disabled={isVerifying || dead}
              aria-invalid={notice ? true : undefined}
              aria-describedby="otp-feedback"
              containerClassName="justify-center"
            >
              <InputOTPGroup>
                {[0, 1, 2].map((i) => (
                  <InputOTPSlot key={i} index={i} aria-invalid={!!notice} />
                ))}
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                {[3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} aria-invalid={!!notice} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div id="otp-feedback" aria-live="polite" aria-atomic="true">
            {notice && (
              <div className="p-4 bg-white border border-red-200 rounded-2xl shadow-sm flex gap-3">
                <TriangleAlert className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  {notice.text}
                  {notice.signIn && (
                    <>
                      {" "}
                      <Link
                        href="/login"
                        className="font-bold text-primary hover:text-primary-600 underline-offset-4 hover:underline"
                      >
                        {notice.signIn}
                      </Link>
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={code.length !== CODE_LENGTH || isVerifying || dead}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold shadow-premium hover:shadow-glow transition-all duration-300 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </form>

        <div className="space-y-1 text-center text-sm text-slate-500 font-medium">
          <p>
            Didn&apos;t get it?{" "}
            <button
              ref={resendRef}
              type="button"
              onClick={handleResend}
              aria-disabled={!canResend}
              className="font-bold text-primary hover:text-primary-600 underline-offset-4 hover:underline aria-disabled:text-slate-400 aria-disabled:no-underline aria-disabled:cursor-not-allowed cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {isResending
                ? "Sending..."
                : resendIn === 0
                  ? "Send a new code"
                  : `Send a new code in ${mmss(resendIn)}`}
            </button>
          </p>
          <p className="text-xs text-slate-400">
            It can take a minute. Check your spam or promotions folder too.
          </p>
        </div>

        <form action={startOverAction} className="text-center text-sm text-slate-500 font-medium">
          Wrong email?{" "}
          <button
            type="submit"
            className="font-bold text-slate-700 hover:text-primary underline-offset-4 hover:underline cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Start over
          </button>
        </form>
      </div>
    </AuthShell>
  );
};

export default OtpVerifyView;
