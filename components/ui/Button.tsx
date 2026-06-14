"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center",
    "font-sans font-semibold tracking-wide",
    "transition-all duration-150",
    "disabled:pointer-events-none disabled:opacity-50",
    "cursor-pointer select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-navy text-white",
          "hover:bg-navy-strong hover:-translate-y-0.5",
          "hover:[box-shadow:var(--shadow-2)]",
          "active:translate-y-0",
          // White ring visible against dark navy bg
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
          "hover:-translate-y-0.5 hover:opacity-95",
          "active:translate-y-0",
          "focus-visible:outline-white",
        ].join(" "),
        aurora: [
          "text-white",
          "[background:var(--grad-aurora)] [box-shadow:var(--glow-violet)]",
          "hover:-translate-y-0.5 hover:opacity-95",
          "active:translate-y-0",
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
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);

Button.displayName = "Button";

export { Button, buttonVariants };
