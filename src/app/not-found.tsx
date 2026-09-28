import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Renders outside the public layout (no navbar), so it brings its own way home.
export default function NotFound() {
  return (
    <div className="grid min-h-[100svh] place-items-center bg-background bg-glow-soft px-4">
      <div className="w-full max-w-md text-center">
        <Link
          href="/"
          aria-label="SalonKhuji home"
          className="inline-block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Image
            src="/salon-logo.png"
            alt="SalonKhuji"
            width={1534}
            height={326}
            sizes="160px"
            className="h-8 w-auto"
          />
        </Link>
        <p className="mt-10 text-overline font-semibold uppercase tracking-[0.06em] text-primary">
          404
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          The link may be old, or the page has moved.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" className="w-full sm:w-auto" asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
            <Link href="/salons">Browse salons</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
