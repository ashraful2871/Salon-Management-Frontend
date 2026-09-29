import { Scissors, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import heroImage from "@/assets/hero-salon.jpg";

type AuthShellProps = {
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
};

/**
 * The unified authentication layout used by all auth forms.
 */
const AuthShell = ({ title, subtitle, children }: AuthShellProps) => {
  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:px-12 lg:px-24">
        <div className="w-full max-w-md mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 mb-10 group">
            <div className="w-10 h-10 rounded-xl bg-surface border flex items-center justify-center shadow-sm group-hover:shadow-md">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Salon<span className="text-primary">Khuji</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-title-lg font-semibold mb-3 text-foreground">
              {title}
            </h1>
            <p className="text-muted-foreground font-medium">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>

      {/* Right Side - Image Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative p-4">
        <div className="w-full h-full rounded-2xl bg-black overflow-hidden relative shadow-card">
          <Image
            src={heroImage}
            alt="Salon Service"
            fill
            sizes="50vw"
            className="object-cover opacity-60"
            placeholder="blur"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="absolute inset-0 p-16 flex flex-col justify-end text-white">
            <div className="inline-flex items-center gap-2 mb-8">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-sm">
                <Scissors className="w-6 h-6 text-primary-soft" />
              </div>
              <span className="font-display text-4xl font-semibold tracking-tight text-white">
                Salon<span className="text-primary-soft">Khuji</span>
              </span>
            </div>

            <ul className="space-y-4">
              {[
                "Book appointments with top-rated salons instantly",
                "Manage your salon's schedule and staff effortlessly",
                "Grow your business with smart analytics",
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-primary-soft" />
                  </div>
                  <span className="text-lg font-medium text-white/90">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
