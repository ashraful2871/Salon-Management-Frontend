/* eslint-disable react-hooks/rules-of-hooks */
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
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { registerUser } from "@/services/auth/registerUser";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
    if (state) {
      if (state.success) {
        toast.success(state.message || "Registration successful");
        router.push("/login");
      } else {
        toast.error(state.message || state.error || "Registration failed. Please try again.");
      }
    }
  }, [state, router]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      
      {/* Left Side - Image Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative p-4">
        <div className="w-full h-full rounded-[2.5rem] bg-slate-900 overflow-hidden relative shadow-2xl">
          <img 
            src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=1600&fit=crop" 
            alt="Salon Journey" 
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          
          <div className="absolute inset-0 p-16 flex flex-col justify-end">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-xs font-bold uppercase tracking-wider mb-6 w-fit">
              <Sparkles className="w-4 h-4 text-primary-300" />
              Start Your Journey
            </div>
            <h2 className="text-4xl lg:text-5xl font-display font-black text-white mb-6 leading-tight">
              Join the elite <br/>salon network.
            </h2>
            <p className="text-lg text-slate-300 max-w-md font-medium leading-relaxed">
              Join thousands of salon owners who trust SalonKhuji to manage their business and grow their clientele.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form Inputs */}
      <div className="flex-1 flex flex-col justify-center p-8 sm:px-12 lg:px-24 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto animate-fade-in py-8">
          
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
              Create account
            </h1>
            <p className="text-slate-500 font-medium">
              Join us and start managing your salon today
            </p>
          </div>

          <form action={formAction} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  defaultValue={state?.inputs?.name as string}
                  className="pl-11 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-primary focus-visible:border-primary shadow-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  defaultValue={state?.inputs?.email as string}
                  className={`pl-11 h-12 bg-white ${
                    state && !state.success && state.message?.toLowerCase().includes("email") 
                      ? "border-red-500 focus-visible:ring-red-500" 
                      : "border-slate-200 focus-visible:ring-primary focus-visible:border-primary"
                  } text-slate-900 placeholder:text-slate-400 rounded-xl shadow-sm`}
                />
              </div>
              {state && !state.success && state.message?.toLowerCase().includes("email") && (
                <p className="text-red-500 text-sm mt-1.5 font-medium">{state.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+8801712345679"
                  required
                  defaultValue={state?.inputs?.phoneNumber as string}
                  className="pl-11 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-primary focus-visible:border-primary shadow-sm"
                />
              </div>
            </div>

            {/* Gender Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Gender
              </label>
              <div className="flex gap-6">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <Input
                    id="gender"
                    name="gender"
                    type="radio"
                    value="MALE"
                    defaultChecked={state?.inputs?.gender === "MALE"}
                    className="w-4 h-4 text-primary border-slate-300 focus:ring-primary accent-primary"
                  />
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Male</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <Input
                    id="gender"
                    name="gender"
                    type="radio"
                    value="FEMALE"
                    defaultChecked={state?.inputs?.gender === "FEMALE"}
                    className="w-4 h-4 text-primary border-slate-300 focus:ring-primary accent-primary"
                  />
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Female</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <Input
                    id="gender"
                    type="radio"
                    name="gender"
                    value="OTHER"
                    defaultChecked={state?.inputs?.gender === "OTHER"}
                    className="w-4 h-4 text-primary border-slate-300 focus:ring-primary accent-primary"
                  />
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Other</span>
                </label>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  defaultValue={state?.inputs?.password as string}
                  className="pl-11 pr-11 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-primary focus-visible:border-primary shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
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
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  defaultValue={state?.inputs?.confirmPassword as string}
                  className="pl-11 pr-11 h-12 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-primary focus-visible:border-primary shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
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
              className="md:col-span-2 w-full h-12 rounded-xl bg-primary hover:bg-primary-600 text-white font-bold shadow-premium hover:shadow-glow transition-all duration-300 mt-2"
              disabled={isPending}
            >
              {isPending ? "Creating Account..." : "Create account"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 font-medium">
              By creating an account, you agree to our{" "}
              <Link href="#" className="text-primary font-bold hover:text-primary-600 transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-primary font-bold hover:text-primary-600 transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-500 font-medium">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary font-bold hover:text-primary-600 transition-colors"
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
