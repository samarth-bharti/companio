"use client";

import { motion, type Variants } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StampProps {
  icon: LucideIcon;
  label: string;
  date?: string;
  tone?: "trust" | "brass";
  /** Rotation in degrees; gives the hand-stamped tilt feel. Default –3. */
  angle?: number;
  onClick?: () => void;
  /** Stagger delay in seconds (set by PassportStack). */
  transitionDelay?: number;
}

export function Stamp({
  icon: Icon,
  label,
  date,
  tone = "trust",
  angle = -3,
  onClick,
  transitionDelay = 0,
}: StampProps) {
  const shouldReduce = useEffectiveReducedMotion();

  const variants: Variants = {
    hidden: {
      opacity: 0,
      scale: shouldReduce ? 1 : 0.6,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: shouldReduce
        ? { duration: 0.25, delay: transitionDelay }
        : {
            type: "spring",
            stiffness: 300,
            damping: 15,
            delay: transitionDelay,
          },
    },
  };

  const colorCls =
    tone === "trust"
      ? "border-trust text-trust"
      : "border-brass text-brass-ink";

  return (
    <motion.div
      style={{ rotate: angle }}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.6 }}
      className={cn(
        "inline-flex flex-col items-center gap-1.5",
        "border-2 rounded-lg px-3 py-2.5 select-none",
        colorCls,
        onClick &&
          "cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline-2"
      )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Verified: ${label}${date ? ` (${date})` : ""}`}
      onClick={onClick}
      onKeyDown={
        onClick ? (e) => e.key === "Enter" && onClick() : undefined
      }
    >
      <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
      <span className="font-sans font-bold text-xs tracking-widest uppercase leading-none">
        {label}
      </span>
      {date && (
        <span className="font-sans text-xs opacity-60 leading-none">{date}</span>
      )}
    </motion.div>
  );
}
