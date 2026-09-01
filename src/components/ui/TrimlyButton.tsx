"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const trimlyButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap uppercase font-heading tracking-wider transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary/90",
        dark: "bg-charcoal text-white hover:bg-charcoal/90",
        outline:
          "border-2 border-primary text-primary hover:bg-primary hover:text-white",
        outlineLight:
          "border-2 border-white/70 text-white hover:bg-white hover:text-primary",
        white: "bg-white text-primary hover:bg-primary hover:text-white",
      },
      size: {
        default: "h-12 px-8 text-lg",
        sm: "h-10 px-6 text-base",
        lg: "h-14 px-12 text-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

interface TrimlyButtonProps
  extends HTMLMotionProps<"button">,
    VariantProps<typeof trimlyButtonVariants> {
  asChild?: boolean;
}

const TrimlyButton = React.forwardRef<HTMLButtonElement, TrimlyButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      const Comp = Slot as React.ElementType;
      return (
        <Comp
          data-slot="button"
          className={cn(trimlyButtonVariants({ variant, size, className }))}
          {...props}
        />
      );
    }

    return (
      <motion.button
        ref={ref}
        whileHover={{ y: -2 }}
        whileTap={{ y: 0, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        data-slot="button"
        className={cn(trimlyButtonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
TrimlyButton.displayName = "TrimlyButton";

export { TrimlyButton, trimlyButtonVariants };