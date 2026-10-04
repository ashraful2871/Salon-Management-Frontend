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
    >
      {sent ? (
        <div className="space-y-6">
          <div className="p-5 bg-surface border rounded-2xl shadow-sm flex gap-4">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
              <MailCheck className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-foreground font-medium leading-relaxed">
              {state?.message}
              <br />
              <span className="text-muted-foreground">
                The link expires in 15 minutes. Check your spam folder if it
                doesn&apos;t arrive.
              </span>
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full rounded-full font-bold cursor-pointer"
            asChild
          >
            <Link href="/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <form action={formAction} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-11"
                  required
                  disabled={isPending}
                  autoComplete="email"
                />
              </div>
            </div>

            {state && !state.success && (
              <p className="text-destructive text-sm font-medium">
                {state.message}
              </p>
            )}

            <Button
              type="submit"
              loading={isPending}
              className="w-full rounded-full font-bold"
            >
              Send reset link
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
        </>
      )}
    </AuthShell>
  );
};

export default ForgotPasswordForm;
