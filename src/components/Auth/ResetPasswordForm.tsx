"use client";

import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import AuthShell from "./AuthShell";
import { resetPassword } from "@/services/auth/resetPassword";

const ResetPasswordForm = ({ token }: { token: string }) => {
  const [state, formAction, isPending] = useActionState(resetPassword, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // A link with no token never reaches the API — fail early with a way out.
  if (!token) {
    return (
      <AuthShell
        title="Link is incomplete"
        subtitle="This reset link is missing its token"
      >
        <div className="space-y-6">
          <div className="p-5 bg-surface border border-destructive rounded-2xl shadow-sm flex gap-4">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-destructive/10 flex items-center justify-center">
              <TriangleAlert className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-sm text-foreground font-medium leading-relaxed">
              Open the link straight from your email, or request a fresh one.
            </p>
          </div>

          <Button className="w-full rounded-full font-bold cursor-pointer" asChild>
            <Link href="/forgot-password">
              Request a new link
            </Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (state?.success) {
    return (
      <AuthShell
        title="Password updated"
        subtitle="You can now sign in with your new password"
      >
        <div className="space-y-6">
          <div className="p-5 bg-surface border rounded-2xl shadow-sm flex gap-4">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <p className="text-sm text-foreground font-medium leading-relaxed">
              {state.message}
            </p>
          </div>

          <Button className="w-full rounded-full font-bold cursor-pointer" asChild>
            <Link href="/login">
              Sign in
            </Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a password you haven't used before"
    >
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="token" value={token} />

        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-bold mb-2"
          >
            New password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="newPassword"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              minLength={8}
              className="pl-11 pr-11"
              required
              disabled={isPending}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              tabIndex={-1}
              disabled={isPending}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">
            At least 8 characters.
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-bold mb-2"
          >
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              minLength={8}
              className="pl-11 pr-11"
              required
              disabled={isPending}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              tabIndex={-1}
              disabled={isPending}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {state && !state.success && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
            <p className="text-destructive text-sm font-medium">{state.message}</p>
            <Link
              href="/forgot-password"
              className="text-destructive font-bold underline mt-1 inline-block"
            >
              Request a new link
            </Link>
          </div>
        )}

        <Button
          type="submit"
          loading={isPending}
          className="w-full rounded-full font-bold"
        >
          Update password
        </Button>
      </form>

      <div className="mt-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-muted-foreground font-medium hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
};

export default ResetPasswordForm;
