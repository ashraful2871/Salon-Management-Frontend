import { Scissors, Sparkles } from "lucide-react";
import Link from "next/link";
import React from "react";

type AuthShellProps = {
  title: string;
  subtitle: React.ReactNode;
  /** Right-hand showcase panel copy — hidden below `lg`. */
  showcase: {
    image: string;
    badge: string;
    heading: React.ReactNode;
    body: string;
  };
  children: React.ReactNode;
};

/**
 * The same split layout LoginForm and RegisterForm use, factored out for the
 * password-reset and email-verification screens.
 */
const AuthShell = ({ title, subtitle, showcase, children }: AuthShellProps) => {
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
              {title}
            </h1>
            <p className="text-slate-500 font-medium">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>

      {/* Right Side - Image Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative p-4">
        <div className="w-full h-full rounded-[2.5rem] bg-slate-900 overflow-hidden relative shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={showcase.image}
            alt="Salon Service"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          <div className="absolute inset-0 p-16 flex flex-col justify-end">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-xs font-bold uppercase tracking-wider mb-6 w-fit">
              <Sparkles className="w-4 h-4 text-primary-300" />
              {showcase.badge}
            </div>
            <h2 className="text-4xl lg:text-5xl font-display font-black text-white mb-6 leading-tight">
              {showcase.heading}
            </h2>
            <p className="text-lg text-slate-300 max-w-md font-medium leading-relaxed">
              {showcase.body}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
