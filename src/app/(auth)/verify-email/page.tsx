import Link from "next/link";
import AuthShell from "@/components/Auth/AuthShell";
import OtpVerifyView from "@/components/Auth/OtpVerifyView";
import { Button } from "@/components/ui/button";
import { readVerifyCookie } from "@/lib/verify-cookie";

export const metadata = {
  title: "Verify email",
};

// Reads the `sm_verify` cookie on every request.
export const dynamic = "force-dynamic";

// removed showcase

/**
 * A pending verification in `sm_verify` (set by register or login) shows the
 * 6-digit code screen. `?token=` is an emailed link from before codes; those
 * are no longer honoured, so it only points the visitor back to sign-in.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const pending = token ? null : await readVerifyCookie();
  if (pending) {
    return (
      <OtpVerifyView
        maskedEmail={pending.e}
        expiresAt={pending.x}
        resendAt={pending.r}
      />
    );
  }

  return (
    <AuthShell
      title={
        token ? "This link is no longer used" : "Nothing to verify right now"
      }
      subtitle={
        token
          ? "Sign in to get a code."
          : "There's no verification code waiting for this browser."
      }
    >
      <div className="space-y-6">
        <div className="p-5 bg-surface border border-border rounded-2xl shadow-sm flex gap-4">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-muted flex items-center justify-center">
            <span className="text-xl leading-none">📧</span>
          </div>
          <p className="text-sm text-foreground font-medium leading-relaxed">
            {token
              ? "We now confirm email addresses with a 6-digit code instead of a link. Sign in and we'll send one if your email still needs it."
              : "If you were entering a code, the session may have expired. Sign in again and we'll send a new one if your email still needs it."}
          </p>
        </div>

        <Button
          className="w-full rounded-full font-bold shadow-premium"
          asChild
        >
          <Link href="/login">Sign in</Link>
        </Button>

        <p className="text-center text-muted-foreground font-medium">
          New here?{" "}
          <Link
            href="/register"
            className="font-bold text-primary hover:text-primary-hover transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
