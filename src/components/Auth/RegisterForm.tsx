"use client";

import { track } from "@/lib/track";
import { Lock, Mail, User, Phone, EyeOff, Eye } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import GoogleButton, { OrDivider } from "./GoogleButton";
import AuthShell from "./AuthShell";
import { registerUser } from "@/services/auth/registerUser";
import { toast } from "sonner";

const RegisterForm = ({ googleEnabled = false }: { googleEnabled?: boolean }) => {
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(registerUser, null);
  const [showPassword, setShowPassword] = useState(false);

  // A successful registration redirects from inside the server action and
  // never comes back as state, so anything that lands here is a failure.
  useEffect(() => {
    if (state && !state.success) {
      toast.error(
        state.message || state.error || "Registration failed. Please try again.",
      );
    }
  }, [state]);

  return (
    <AuthShell
      title="Create account"
      subtitle="Join us and start managing your salon today"
    >

          {googleEnabled && (
            <>
              {/* Capture: the button is a plain link that leaves the page. */}
              <div onClickCapture={() => track("signup_started", "method:google")}>
                <GoogleButton />
              </div>
              <OrDivider />
            </>
          )}

          <form
            action={formAction}
            onSubmit={() => track("signup_started", "method:email")}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            
            {/* Full Name */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-bold mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  defaultValue={state?.inputs?.name as string}
                  className="pl-11"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  defaultValue={state?.inputs?.email as string}
                  className={`pl-11 ${
                    state && !state.success && state.message?.toLowerCase().includes("email")
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                  disabled={isPending}
                />
              </div>
              {state && !state.success && state.message?.toLowerCase().includes("email") && (
                <p className="text-destructive text-sm mt-1.5 font-medium">{state.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-bold mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+8801712345679"
                  required
                  defaultValue={state?.inputs?.phoneNumber as string}
                  className="pl-11"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Gender Selection */}
            <fieldset className="md:col-span-2" disabled={isPending}>
              <legend className="block text-sm font-bold mb-2">Gender</legend>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["MALE", "Male"],
                    ["FEMALE", "Female"],
                    ["OTHER", "Other"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="inline-flex h-11 md:h-10 cursor-pointer items-center gap-2 rounded-full border border-input bg-surface px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground has-checked:border-primary has-checked:bg-primary-soft has-checked:text-foreground has-focus-visible:ring-[3px] has-focus-visible:ring-ring"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={value}
                      defaultChecked={state?.inputs?.gender === value}
                      className="size-4 accent-primary"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  defaultValue={state?.inputs?.password as string}
                  className="pl-11 pr-11"
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  defaultValue={state?.inputs?.confirmPassword as string}
                  className="pl-11 pr-11"
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  tabIndex={-1}
                  disabled={isPending}
                >
                  {showConfirmPassword ? (
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
              className="md:col-span-2 w-full rounded-full font-bold mt-2"
            >
              Create account
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground font-medium">
              By creating an account, you agree to our{" "}
              <Link href="#" className="text-primary font-bold hover:text-primary-hover transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-primary font-bold hover:text-primary-hover transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground font-medium">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary font-bold hover:text-primary-hover transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
    </AuthShell>
  );
};

export default RegisterForm;
