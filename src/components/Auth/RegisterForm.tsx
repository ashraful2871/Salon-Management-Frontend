/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import {
  ArrowRight,
  Lock,
  Mail,
  Scissors,
  User,
  Phone,
  EyeOff,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { registerUser } from "@/services/auth/registerUser";
import { toast } from "sonner";
import { redirect, useRouter } from "next/navigation";

const RegisterForm = () => {
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(registerUser, null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  if (state?.password !== state?.confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  useEffect(() => {
    if (state?.message) {
      toast.success(state?.message || "Registration successful");
      router.push("/login");
    }

    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=1600&fit=crop)",
          }}
        >
          <div className="absolute inset-0 gradient-hero opacity-80" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center text-primary-foreground">
            <h2 className="text-4xl font-display font-bold mb-4">
              Start Your Journey
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-md">
              Join thousands of salon owners who trust Glamour to manage their
              business and grow their clientele.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form Inputs */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in py-8">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-gold">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              Glamour
            </span>
          </Link>

          <div className="mb-6">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Create Account
            </h1>
            <p className="text-muted-foreground">
              Join us and start managing your salon today
            </p>
          </div>

          <form action={formAction} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  className="pl-12 h-12"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  className="pl-12 h-12"
                />
              </div>
            </div>

            {/* Phone Number - Added */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+8801712345679"
                  required
                  className="pl-12 h-12"
                />
              </div>
            </div>

            {/* Gender Selection - Added (Radio Buttons) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Gender
              </label>
              <div className="flex gap-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Input
                    id="gender"
                    name="gender"
                    type="radio"
                    value="MALE"
                    className="w-4 h-4 text-primary border-muted-foreground focus:ring-primary accent-primary"
                  />
                  <span className="text-sm">Male</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Input
                    id="gender"
                    name="gender"
                    type="radio"
                    value="FEMALE"
                    className="w-4 h-4 text-primary border-muted-foreground focus:ring-primary accent-primary"
                  />
                  <span className="text-sm">Female</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Input
                    id="gender"
                    type="radio"
                    name="gender"
                    value="OTHER"
                    className="w-4 h-4 text-primary border-muted-foreground focus:ring-primary accent-primary"
                  />
                  <span className="text-sm">Other</span>
                </label>
              </div>
            </div>

            {/* Role Checkbox - Added */}
            <div className="flex items-center space-x-2 p-1">
              <Input
                type="checkbox"
                id="salonOwner"
                name="isSalonOwner"
                className="w-4 h-4 rounded border-muted-foreground text-primary focus:ring-primary accent-primary cursor-pointer"
              />
              <label
                htmlFor="salonOwner"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Register as Salon Owner
              </label>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="pl-12 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground " />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="pl-12 h-12"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
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
              type="submit"
              variant="gold"
              size="lg"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? "Creating Account..." : "Create Account"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link href="#" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
