"use client";

import {
  ShieldCheck,
  Camera,
  ClipboardCheck,
  Wallet,
  Heart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Stamp, type StampProps } from "./Stamp";
import { cn } from "@/lib/utils";

export interface Credential
  extends Omit<StampProps, "transitionDelay"> {
  icon: LucideIcon;
}

const DEFAULT_CREDENTIALS: Credential[] = [
  { icon: ShieldCheck, label: "ID-matched", tone: "trust", angle: -2 },
  { icon: Camera, label: "Selfie-matched", tone: "trust", angle: 1 },
  { icon: ClipboardCheck, label: "Background-checked", tone: "trust", angle: -3 },
  { icon: Wallet, label: "₹-protected payout", tone: "trust", angle: 2 },
  // Platonic Promise is the signature credential — brass tone, seal-item styling
  { icon: Heart, label: "Platonic Promise", tone: "brass", angle: -1 },
];

interface PassportStackProps {
  credentials?: Credential[];
  onCredentialClick?: (label: string) => void;
  className?: string;
}

export function PassportStack({
  credentials = DEFAULT_CREDENTIALS,
  onCredentialClick,
  className,
}: PassportStackProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-3", className)}
      role="list"
      aria-label="Verification credentials"
    >
      {credentials.map((cred, i) => (
        <div key={cred.label} role="listitem">
          <Stamp
            {...cred}
            transitionDelay={i * 0.12}
            onClick={
              onCredentialClick
                ? () => onCredentialClick(cred.label)
                : cred.onClick
            }
          />
        </div>
      ))}
    </div>
  );
}
