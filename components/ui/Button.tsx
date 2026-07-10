"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Transform (hover pop / tap press) is handled by Framer below so it springs
// instead of tweening; CSS here only animates colour / shadow / opacity.
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center",
    "font-sans font-semibold tracking-wide",
    "transition-[background-color,box-shadow,opacity,color,border-color] duration-200",
    "disabled:pointer-events-none disabled:opacity-50",
    "cursor-pointer select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-navy text-white",
          "hover:bg-navy-strong hover:[box-shadow:var(--shadow-2)]",
          "focus-visible:outline-white",
        ].join(" "),
        secondary: [
          "border-2 border-brass text-brass-ink bg-transparent",
          "hover:bg-trust-wash",
        ].join(" "),
        ghost: [
          "text-ink-muted bg-transparent",
          "hover:underline underline-offset-4",
        ].join(" "),
        cta: [
          "text-white",
          "[background:var(--grad-cta)] [box-shadow:var(--glow-azure)]",
          "hover:opacity-95",
          "focus-visible:outline-white",
        ].join(" "),
        aurora: [
          "text-white",
          "[background:var(--grad-aurora)] [box-shadow:var(--glow-violet)]",
          "hover:opacity-95",
          "focus-visible:outline-white",
        ].join(" "),
      },
      size: {
        sm: "h-9 min-w-[44px] px-4 text-sm rounded-xl",
        md: "h-11 min-w-[44px] px-6 text-base rounded-xl",
        lg: "h-13 min-w-[44px] px-8 text-base rounded-xl",
        xl: "h-14 min-w-[44px] px-10 text-lg rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends HTMLMotionProps<"button">,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, disabled, ...props }, ref) => {
    const reduce = useEffectiveReducedMotion();

    // Only the prominent action buttons get the full pop (hover lift + press);
    // quieter variants (ghost text links, secondary outlines) get just a subtle
    // press so the UI stays calm and human — not bouncy everywhere.
    const prominent =
      variant == null || variant === "primary" || variant === "cta" || variant === "aurora";
    const tactile =
      reduce || disabled
        ? {}
        : prominent
          ? { whileHover: { scale: 1.03 }, whileTap: { scale: 0.96 }, transition: spring.snappy }
          : { whileTap: { scale: 0.98 }, transition: spring.snappy };

    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        className={cn(buttonVariants({ variant, size }), className)}
        {...tactile}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
