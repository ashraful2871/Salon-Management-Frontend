import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The shared "something broke" card for error boundaries: what happened, a
 * retry, and a way back to somewhere that works.
 */
export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this page. Please try again.",
  onRetry,
  homeHref,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  homeHref?: string;
  className?: string;
}) {
  const homeLabel = homeHref?.startsWith("/dashboard")
    ? "Go to dashboard"
    : "Go home";

  return (
    <div
      role="alert"
      className={cn("flex min-h-[60vh] items-center justify-center px-4", className)}
    >
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-soft">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-danger-soft">
          <AlertTriangle aria-hidden="true" className="size-7 text-danger" />
        </div>
        <h1 className="font-display text-section font-semibold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{message}</p>
        {(onRetry || homeHref) && (
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            {onRetry && (
              <Button onClick={onRetry}>
                <RefreshCw className="size-4" />
                Try again
              </Button>
            )}
            {homeHref && (
              <Button variant="outline" asChild>
                <Link href={homeHref}>
                  <Home className="size-4" />
                  {homeLabel}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
