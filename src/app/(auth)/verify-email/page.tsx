import Link from "next/link";
import { MailQuestionMark } from "lucide-react";
import AuthShell from "@/components/Auth/AuthShell";
import OtpVerifyView from "@/components/Auth/OtpVerifyView";
import { Button } from "@/components/ui/button";
import { readVerifyCookie } from "@/lib/verify-cookie";

export const metadata = {
  title: "Verify email | SalonKhuji",
};

// Reads the `sm_verify` cookie on every request.
export const dynamic = "force-dynamic";

const showcase = {
  image:
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=1600&fit=crop",
  badge: "All Caught Up",
  heading: (
    <>
      No code <br />
      waiting on you.
    </>
  ),
  body: "Sign in or create an account and we'll email a code whenever one is needed.",
};

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
      title={token ? "This link is no longer used" : "Nothing to verify right now"}
      subtitle={
        token
          ? "Sign in to get a code."
          : "There's no verification code waiting for this browser."
      }
      showcase={showcase}
    >
      <div className="space-y-6">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex gap-4">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center">
            <MailQuestionMark className="w-5 h-5 text-slate-500" />
          </div>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            {token
              ? "We now confirm email addresses with a 6-digit code instead of a link. Sign in and we'll send one if your email still needs it."
              : "If you were entering a code, the session may have expired. Sign in again and we'll send a new one if your email still needs it."}
          </p>
        </div>

        <Link href="/login" className="block">
          <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold shadow-premium hover:shadow-glow transition-all duration-300 cursor-pointer">
            Sign in
          </Button>
        </Link>

        <p className="text-center text-slate-500 font-medium">
          New here?{" "}
          <Link
            href="/register"
            className="font-bold text-primary hover:text-primary-600 transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
