"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";

import type { Block } from "@/lib/assistant-types";

type LoginRequiredBlock = Extract<Block, { type: "login_required" }>;

/** `returnPath` is where the API wants the customer back - the pre-filled
 *  review page, or `/assistant` when the chat itself is the destination. */
const LoginRequired = ({ block }: { block: LoginRequiredBlock }) => {
  const returnTo = block.returnPath?.startsWith("/")
    ? block.returnPath
    : "/assistant";

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5">
      <p className="text-sm leading-relaxed text-foreground">{block.reason}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/login?redirect=${encodeURIComponent(returnTo)}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <LogIn className="h-4 w-4" aria-hidden />
          Sign in
        </Link>
        <Link
          href={`/register?redirect=${encodeURIComponent(returnTo)}`}
          className="inline-flex min-h-11 items-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
};

export default LoginRequired;
