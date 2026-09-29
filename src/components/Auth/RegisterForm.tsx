"use client";

import {
  Lock,
  Mail,
  Scissors,
  User,
  Phone,
  EyeOff,
  Eye,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
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
              <GoogleButton />
              <OrDivider />
            </>
          )}

          <form action={formAction} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-2">Full Name</label>
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
              <label className="block text-sm font-bold mb-2">Email Address</label>
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
              <label className="block text-sm font-bold mb-2">Phone Number</label>
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
            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-3">Gender</label>
              <div className="flex gap-6">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <Input
                    id="gender"
                    name="gender"
                    type="radio"
                    value="MALE"
                    defaultChecked={state?.inputs?.gender === "MALE"}
                    className="w-4 h-4 text-primary accent-primary"
                    disabled={isPending}
                  />
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Male</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <Input
                    id="gender"
                    name="gender"
                    type="radio"
                    value="FEMALE"
                    defaultChecked={state?.inputs?.gender === "FEMALE"}
                    className="w-4 h-4 text-primary accent-primary"
                    disabled={isPending}
                  />
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Female</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <Input
                    id="gender"
                    type="radio"
                    name="gender"
                    value="OTHER"
                    defaultChecked={state?.inputs?.gender === "OTHER"}
                    className="w-4 h-4 text-primary accent-primary"
                    disabled={isPending}
                  />
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Other</span>
                </label>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold mb-2">Password</label>
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
              <label className="block text-sm font-bold mb-2">Confirm Password</label>
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
