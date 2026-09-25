"use client";

import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import AuthShell from "./AuthShell";
import { resetPassword } from "@/services/auth/resetPassword";

const showcase = {
  image:
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=1600&fit=crop",
  badge: "Account Recovery",
  heading: (
    <>
      Choose a new <br />
      password.
    </>
  ),
  body: "Pick something you haven't used elsewhere. We'll sign you in with it right away.",
};

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
        showcase={showcase}
      >
        <div className="space-y-6">
          <div className="p-5 bg-white border border-red-200 rounded-2xl shadow-sm flex gap-4">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-red-50 flex items-center justify-center">
              <TriangleAlert className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Open the link straight from your email, or request a fresh one.
            </p>
          </div>

          <Link href="/forgot-password" className="block">
            <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold cursor-pointer">
              Request a new link
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (state?.success) {
    return (
      <AuthShell
        title="Password updated"
        subtitle="You can now sign in with your new password"
        showcase={showcase}
      >
        <div className="space-y-6">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex gap-4">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              {state.message}
            </p>
          </div>

          <Link href="/login" className="block">
            <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold shadow-premium hover:shadow-glow transition-all duration-300 cursor-pointer">
              Sign in
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a password you haven't used before"
      showcase={showcase}
    >
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="token" value={token} />

        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-bold text-slate-700 mb-2"
          >
            New password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="newPassword"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              minLength={8}
              className="pl-11 pr-11 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-primary focus-visible:border-primary shadow-sm"
              required
              disabled={isPending}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
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
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            At least 8 characters.
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-bold text-slate-700 mb-2"
          >
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              minLength={8}
              className="pl-11 pr-11 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-primary focus-visible:border-primary shadow-sm"
              required
              disabled={isPending}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
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
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm font-medium">{state.message}</p>
            <Link
              href="/forgot-password"
              className="text-red-700 text-sm font-bold underline mt-1 inline-block"
            >
              Request a new link
            </Link>
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold shadow-premium hover:shadow-glow transition-all duration-300"
        >
          {isPending ? "Updating..." : "Update password"}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-slate-500 font-medium hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
};

export default ResetPasswordForm;
