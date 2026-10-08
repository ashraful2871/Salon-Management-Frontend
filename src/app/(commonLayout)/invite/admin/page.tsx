import Link from "next/link";
import type { Metadata } from "next";
import { MailCheck, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AcceptInvitationForm } from "@/components/Admin/invite/AcceptInvitationForm";
import { previewInvitation } from "@/services/admin/invitations/previewInvitation";
import { signOutTo } from "@/services/auth/signOutTo";
import type { InvitationPreview } from "@/services/admin/types";

export const metadata: Metadata = {
  title: "Team invitation",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

const roleText = (p: InvitationPreview) =>
  p.kind === "ADMIN"
    ? `an admin (${(p.adminRole ?? "ANALYST").replace(/_/g, " ").toLowerCase()})`
    : `an area agent for ${[p.area, p.district].filter(Boolean).join(", ") || "your area"}`;

/**
 * Where an admin or agent invitation link lands. Three states for a live
 * invitation: signed out (sign in or register with the invited address),
 * signed in as someone else (switch account), or the right account (accept,
 * then sign in again and set up 2FA).
 */
export default async function AdminInvitePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).token;
  const token = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const result = token ? await previewInvitation(token) : null;
  const invite = result?.success ? result.data : undefined;
  const returnTo = `/invite/admin?token=${encodeURIComponent(token)}`;

  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-lg items-center px-4 py-16">
      <div className="w-full space-y-6 rounded-2xl border bg-surface p-6 shadow-sm sm:p-8">
        {!invite ? (
          <Notice title="This invitation link doesn't work">
            {result?.message && token
              ? result.message
              : "The link is incomplete. Open it again from the invitation email."}
          </Notice>
        ) : invite.status !== "PENDING" ? (
          <Notice title="This invitation is no longer open">
            {invite.status === "ACCEPTED"
              ? "It has already been accepted. Sign in to continue."
              : "It has expired or was withdrawn. Ask the person who invited you for a new one."}
          </Notice>
        ) : (
          <>
            <div className="space-y-2">
              <ShieldCheck className="h-8 w-8 text-primary" aria-hidden />
              <h1 className="font-display text-title-lg font-semibold tracking-tight">
                Join the SalonKhuji team
              </h1>
              <p className="text-muted-foreground">
                {invite.inviterName ?? "An admin"} invited{" "}
                <span className="font-medium text-foreground">{invite.maskedEmail}</span> to join
                as {roleText(invite)}.
              </p>
              <p className="text-sm text-muted-foreground">
                Open until {dateFmt.format(new Date(invite.expiresAt))}.
              </p>
            </div>

            {invite.forYou === null ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign in with {invite.maskedEmail} to accept. No account yet? Create one with
                  that address, verify it, then open this link again.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild className="rounded-full font-bold sm:flex-1">
                    <Link href={`/login?redirect=${encodeURIComponent(returnTo)}`}>Sign in</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full sm:flex-1">
                    <Link href="/register">Create an account</Link>
                  </Button>
                </div>
              </div>
            ) : invite.forYou === false ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  You&apos;re signed in with a different account. This invitation is for{" "}
                  {invite.maskedEmail}.
                </p>
                <form action={signOutTo}>
                  <input type="hidden" name="returnTo" value={returnTo} />
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
                  After you accept, you&apos;ll sign in again and set up an authenticator app
                  before you can use the console.
                </p>
                <AcceptInvitationForm token={token} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <TriangleAlert className="h-8 w-8 text-warning" aria-hidden />
      <h1 className="font-display text-title-lg font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{children}</p>
      <Button asChild variant="outline" className="rounded-full">
        <Link href="/">Back to SalonKhuji</Link>
      </Button>
    </div>
  );
}
