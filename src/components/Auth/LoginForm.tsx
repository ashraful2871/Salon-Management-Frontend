"use client";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useActionState, useEffect, useRef, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import GoogleButton, { OrDivider } from "./GoogleButton";
import AuthShell from "./AuthShell";
import { loginUser } from "@/services/auth/login";
import { toast } from "sonner";

/** What `/login?error=` says, keyed by the code the Google routes put there.
 *  Anything not listed gets the generic line; a cancel says nothing. */
const GOOGLE_ERRORS = new Map<string, string | null>([
  ["google_cancelled", null],
  [
    "GOOGLE_EMAIL_UNVERIFIED",
    "Your Google account's email isn't verified. Verify it with Google or sign up with email.",
  ],
  ["ACCOUNT_UNAVAILABLE", "This account is not active. Contact support."],
  ["GOOGLE_STATE_MISMATCH", "Your Google sign-in expired. Please try again."],
]);
const GOOGLE_ERROR_FALLBACK = "Google sign-in didn't work. Please try again.";

export type DemoLogin = { label: string; email: string; password: string };

/**
 * `redirectTo` is where the customer was headed before the login wall — the
 * booking summary sends its own URL, so signing in drops them back on the
 * half-finished booking instead of the home page. `loginUser` reads it off the
 * form as `redirect`, and the Google button carries it through its own flow.
 */
const LoginForm = ({
  redirectTo,
  googleEnabled = false,
  error,
  demoLogins = null,
}: {
  redirectTo?: string;
  googleEnabled?: boolean;
  /** `?error=` from a failed Google round trip. */
  error?: string;
  /** The Demo Access panel; null (the default) hides it. */
  demoLogins?: DemoLogin[] | null;
}) => {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginUser, null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // One toast per failed round trip, then drop `error` from the URL so a
  // refresh doesn't repeat it. The ref covers Strict Mode's second effect run.
  // The toast waits a tick: this effect runs before the root layout's
  // <Toaster> subscribes, and sonner drops a toast nobody is listening for.
  const shownError = useRef(false);
  useEffect(() => {
    if (!error || shownError.current) return;
    shownError.current = true;

    const message = GOOGLE_ERRORS.has(error)
      ? GOOGLE_ERRORS.get(error)
      : GOOGLE_ERROR_FALLBACK;
    if (message) setTimeout(() => toast.error(message));

    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    router.replace(url.pathname + url.search, { scroll: false });
  }, [error, router]);

  // Show error toast when login fails
  useEffect(() => {
    if (state && !state.success) {
      toast.error(state.message || "Login failed");
    }
  }, [state]);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Enter your details to sign in to your account"
    >
      {demoLogins && (
        <div className="mb-8 p-5 bg-surface border rounded-2xl shadow-sm">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                Demo Access
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {demoLogins.map((demo) => (
                  <Button
                    key={demo.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmail(demo.email);
                      setPassword(demo.password);
                    }}
                    className="text-xs h-9 rounded-full cursor-pointer"
                  >
                    {demo.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {googleEnabled && (
            <>
              <GoogleButton redirect={redirectTo} />
              <OrDivider />
            </>
          )}

          <form action={formAction} className="space-y-5">
            {redirectTo && (
              <input type="hidden" name="redirect" value={redirectTo} />
            )}
            <div>
              <label className="block text-sm font-bold mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-11"
                  required
                  disabled={isPending}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-11 pr-11"
                  required
                  disabled={isPending}
                  autoComplete="current-password"
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
            </div>

            <Button
              loading={isPending}
              type="submit"
              className="w-full rounded-full font-bold"
            >
              Sign in
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground font-medium">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-primary font-bold hover:text-primary-hover transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
    </AuthShell>
  );
};

export default LoginForm;
