"use client";

import { CheckCircle2, Loader2, Mail, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import AuthShell from "./AuthShell";
import { resendVerification, verifyEmail } from "@/services/auth/verifyEmail";

const showcase = {
  image:
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=1600&fit=crop",
  badge: "Almost There",
  heading: (
    <>
      One click to <br />
      confirm it&apos;s you.
    </>
  ),
  body: "A verified email keeps your bookings, receipts and reminders flowing to the right inbox.",
};

const RESEND_COOLDOWN_SECONDS = 60;

type Status = "verifying" | "success" | "error" | "missing";

const VerifyEmailView = ({ token }: { token: string }) => {
  const [status, setStatus] = useState<Status>(token ? "verifying" : "missing");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  // React 18 StrictMode mounts effects twice in dev; the token is single-use, so
  // a second call would report a false failure.
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;

    verifyEmail(token).then((result) => {
      setMessage(result.message);
      setStatus(result.success ? "success" : "error");
    });
  }, [token]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);

    const result = await resendVerification(email);

    setResending(false);
    // Mirrors the backend's per-user throttle so the button can't be hammered.
    setCooldown(RESEND_COOLDOWN_SECONDS);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  if (status === "verifying") {
    return (
      <AuthShell
        title="Verifying your email"
        subtitle="This only takes a moment"
        showcase={showcase}
      >
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <p className="text-sm text-slate-600 font-medium">
            Confirming your link...
          </p>
        </div>
      </AuthShell>
    );
  }

  if (status === "success") {
    return (
      <AuthShell
        title="Email verified"
        subtitle="Your account is fully set up"
        showcase={showcase}
      >
        <div className="space-y-6">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex gap-4">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              {message}
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
      title={status === "missing" ? "Link is incomplete" : "Link didn't work"}
      subtitle="Send yourself a fresh verification email"
      showcase={showcase}
    >
      <div className="space-y-6">
        <div className="p-5 bg-white border border-red-200 rounded-2xl shadow-sm flex gap-4">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-red-50 flex items-center justify-center">
            <TriangleAlert className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            {status === "missing"
              ? "This verification link is missing its token. Open it straight from your email."
              : message}
          </p>
        </div>

        <div>
          <label
            htmlFor="resend-email"
            className="block text-sm font-bold text-slate-700 mb-2"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="resend-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="pl-11 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-primary focus-visible:border-primary shadow-sm"
              autoComplete="email"
            />
          </div>
        </div>

        <Button
          onClick={handleResend}
          disabled={!email || resending || cooldown > 0}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold shadow-premium hover:shadow-glow transition-all duration-300 cursor-pointer"
        >
          {resending
            ? "Sending..."
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend verification email"}
        </Button>

        <div className="text-center">
          <Link
            href="/login"
            className="text-slate-500 font-medium hover:text-primary transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthShell>
  );
};

export default VerifyEmailView;
