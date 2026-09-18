"use client";

import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import AuthShell from "./AuthShell";
import { forgotPassword } from "@/services/auth/forgotPassword";

const ForgotPasswordForm = () => {
  const [state, formAction, isPending] = useActionState(forgotPassword, null);

  const sent = state?.success === true;

  return (
    <AuthShell
      title={sent ? "Check your inbox" : "Forgot password?"}
      subtitle={
        sent
          ? "We've sent you a link to get back into your account"
          : "Enter your email and we'll send you a reset link"
      }
      showcase={{
        image:
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=1600&fit=crop",
        badge: "Account Recovery",
        heading: (
          <>
            Back in, <br />
            in a minute.
          </>
        ),
        body: "Reset links are single-use and expire after 15 minutes, so your account stays yours alone.",
      }}
    >
      {sent ? (
        <div className="space-y-6">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex gap-4">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
              <MailCheck className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              {state?.message}
              <br />
              <span className="text-slate-400">
                The link expires in 15 minutes. Check your spam folder if it
                doesn&apos;t arrive.
              </span>
            </p>
          </div>

          <Link href="/login" className="block">
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl border-slate-200 font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <form action={formAction} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-slate-700 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-11 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-primary focus-visible:border-primary shadow-sm"
                  required
                  disabled={isPending}
                  autoComplete="email"
                />
              </div>
            </div>

            {state && !state.success && (
              <p className="text-red-500 text-sm font-medium">
                {state.message}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold shadow-premium hover:shadow-glow transition-all duration-300"
            >
              {isPending ? "Sending..." : "Send reset link"}
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
        </>
      )}
    </AuthShell>
  );
};

export default ForgotPasswordForm;
