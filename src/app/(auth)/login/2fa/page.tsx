import Link from "next/link";
import type { Metadata } from "next";
import AuthShell from "@/components/Auth/AuthShell";
import TwoFactorStep from "@/components/Auth/TwoFactorStep";
import { Button } from "@/components/ui/button";
import { readTwoFactorCookie } from "@/lib/two-factor-cookie";

export const metadata: Metadata = {
  title: "Two-factor sign-in",
  robots: { index: false, follow: false },
};

/**
 * The code step after Google (or an email-code) sign-in for an admin or agent
 * with 2FA on. The password form shows the same step inline. The ticket waits
 * in the `sm_2fa` cookie; without it there is nothing to finish.
 */
export default async function TwoFactorPage() {
  const pending = await readTwoFactorCookie();

  return (
    <AuthShell
      title="Two-factor sign-in"
      subtitle="One more step to keep the admin console safe"
    >
      {pending ? (
        <TwoFactorStep />
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            This sign-in has expired. Sign in again to get a new code step.
          </p>
          <Button asChild className="w-full rounded-full font-bold">
            <Link href="/login">Sign in again</Link>
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
