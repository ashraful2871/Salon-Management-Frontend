"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Scissors,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useActionState, useEffect, useRef, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import GoogleButton, { OrDivider } from "./GoogleButton";
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
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center p-8 sm:px-12 lg:px-24">
        <div className="w-full max-w-sm mx-auto animate-fade-in">
          <Link href="/" className="inline-flex items-center gap-2 mb-10 group">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display text-2xl font-black text-slate-900 tracking-tight">
              Salon<span className="text-primary">Khuji</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight mb-3">
              Welcome back
            </h1>
            <p className="text-slate-500 font-medium">
              Enter your details to sign in to your account
            </p>
          </div>

          {demoLogins && (
            <div className="mb-8 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
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
                    className="text-xs h-9 bg-slate-50 hover:bg-slate-100 hover:text-primary border-slate-200 cursor-pointer"
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
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-11 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-primary focus-visible:border-primary shadow-sm"
                  required
                  disabled={isPending}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-11 pr-11 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-primary focus-visible:border-primary shadow-sm"
                  required
                  disabled={isPending}
                  autoComplete="current-password"
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
            </div>

            <Button
              disabled={isPending}
              type="submit"
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold shadow-premium hover:shadow-glow transition-all duration-300"
            >
              {isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 font-medium">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-primary font-bold hover:text-primary-600 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative p-4">
        <div className="w-full h-full rounded-[2.5rem] bg-slate-900 overflow-hidden relative shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=1600&fit=crop"
            alt="Salon Service"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          <div className="absolute inset-0 p-16 flex flex-col justify-end">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-xs font-bold uppercase tracking-wider mb-6 w-fit">
              <Sparkles className="w-4 h-4 text-primary-300" />
              Premium Experience
            </div>
            <h2 className="text-4xl lg:text-5xl font-display font-black text-white mb-6 leading-tight">
              Manage your <br />
              salon empire.
            </h2>
            <p className="text-lg text-slate-300 max-w-md font-medium leading-relaxed">
              Access powerful tools to grow your business, track appointments,
              and delight your clients every single day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
