"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.98] outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover",
        gold: "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover",
        secondary:
          "bg-surface text-foreground border border-border shadow-xs hover:bg-muted",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
      },
      size: {
        sm: "h-9 px-4 text-[13px]",
        default: "h-10 px-5 pointer-coarse:h-11",
        lg: "h-11 px-6 text-[15px]",
        xl: "h-13 px-8 text-base",
        icon: "size-10 pointer-coarse:size-11",
        "icon-sm": "size-9",
      },
    },
    // After the size classes, so a link stays text-sized at every size.
    compoundVariants: [
      { variant: "link", class: "h-auto px-0 pointer-coarse:h-auto" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  // Slot needs a single child, so `loading` is ignored with asChild.
  const busy = loading && !asChild;

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={busy || disabled}
      aria-busy={busy || undefined}
      {...props}
    >
      {busy ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
