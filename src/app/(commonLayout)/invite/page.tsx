import Link from "next/link";
import type { Metadata } from "next";
import { MailCheck, Store, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AcceptTeamInvitationForm } from "@/components/Owner/team/AcceptTeamInvitationForm";
import { previewTeamInvitation } from "@/services/team/previewTeamInvitation";
import { signOutTo } from "@/services/auth/signOutTo";
import { ROLE_LABEL } from "@/services/team/team-types";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Team invitation",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Dhaka",
});

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Where a salon team invitation link lands (`/invite?token=&email=`). For a
 * live invitation: signed out (sign in or create an account with the invited
 * address, which comes back here), signed in as someone else (switch
 * account), or the right account (accept, then straight to the dashboard).
 */
export default async function TeamInvitePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = first(params.token)?.trim() ?? "";
  const email = first(params.email)?.trim() ?? "";
  const result = token ? await previewTeamInvitation(token) : null;
  const invite = result?.success ? result.data : undefined;

  const returnTo = `/invite?token=${encodeURIComponent(token)}${email ? `&email=${encodeURIComponent(email)}` : ""}`;
  const withEmail = email ? `email=${encodeURIComponent(email)}&` : "";
  const loginHref = `/login?${withEmail}redirect=${encodeURIComponent(returnTo)}`;
  const registerHref = `/register?${withEmail}redirect=${encodeURIComponent(returnTo)}`;
  const inviter = invite?.inviterName ?? "The salon owner";

  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-lg items-center px-4 py-16">
      <div className="w-full space-y-6 rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
        {!invite ? (
          <Notice title="This invitation link doesn't work">
            {result?.message && token
              ? result.message
              : "The link is incomplete. Open it again from the invitation email."}
          </Notice>
        ) : invite.status === "ACCEPTED" ? (
          <Notice title="This invitation was already accepted" href="/dashboard" cta="Open dashboard">
            Sign in with {invite.maskedEmail} to work at {invite.salon.name}.
          </Notice>
        ) : invite.status !== "PENDING" ? (
          <Notice title="This invitation is no longer open">
            It has {invite.status === "REVOKED" ? "been withdrawn" : "expired"}. Ask {inviter} to send
            a new one.
          </Notice>
        ) : (
          <>
            <div className="space-y-2">
              <Store className="h-8 w-8 text-primary" aria-hidden />
              <h1 className="font-display text-title-lg font-semibold tracking-tight">
                Join {invite.salon.name}
              </h1>
              <p className="text-muted-foreground">
                {inviter} invited you to {invite.salon.name}
                {invite.salon.area ? `, ${invite.salon.area}` : ""} as{" "}
                <span className="font-medium text-foreground">
                  {ROLE_LABEL[invite.role].toLowerCase()}
                </span>
                .
              </p>
              <p className="text-sm text-muted-foreground">
                Open until {dateFmt.format(new Date(invite.expiresAt))}.
              </p>
            </div>

            {invite.forYou === null ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign in with {invite.maskedEmail} to accept. New to {SITE.name}? Create an account
                  with that address; you&apos;ll come back here once it&apos;s verified.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild className="rounded-full font-bold sm:flex-1">
                    <Link href={loginHref}>Sign in</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full sm:flex-1">
                    <Link href={registerHref}>Create account</Link>
                  </Button>
                </div>
              </div>
            ) : invite.forYou === false ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This invitation is for{" "}
                  <span className="font-medium text-foreground">{invite.maskedEmail}</span>, and
                  you&apos;re signed in with a different account.
                </p>
                <form action={signOutTo}>
                  <input type="hidden" name="returnTo" value={loginHref} />
                  <Button type="submit" className="w-full rounded-full font-bold">
                    Switch account
                  </Button>
                </form>
              </div>
            ) : invite.callerEmailVerified === false ? (
              <div className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning-soft p-4">
                <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
                <p className="text-sm">
                  Verify your email address first (from your account settings), then open this
                  link again.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  You&apos;ll go straight to the {invite.salon.name} dashboard.
                </p>
                <AcceptTeamInvitationForm token={token} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Notice({
  title,
  children,
  href = "/",
  cta = `Back to ${SITE.name}`,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="space-y-3">
      <TriangleAlert className="h-8 w-8 text-warning" aria-hidden />
      <h1 className="font-display text-title-lg font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{children}</p>
      <Button asChild variant="outline" className="rounded-full">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}
