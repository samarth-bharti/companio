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

// These are credentials the product hands out, so each one has to be a thing it
// actually does. "Selfie-matched" and "Background-checked" were not: there is no
// biometric match and no background-check vendor. "₹-protected payout" was not
// either — nothing is escrowed, and paid meetups are switched off entirely until
// the payment-aggregator licence lands.
const DEFAULT_CREDENTIALS: Credential[] = [
  { icon: ShieldCheck, label: "Government ID on file", tone: "trust", angle: -2 },
  { icon: Camera, label: "Photo reviewed by a person", tone: "trust", angle: 1 },
  { icon: ClipboardCheck, label: "Approved by hand", tone: "trust", angle: -3 },
  { icon: Wallet, label: "Refund within 7 days", tone: "trust", angle: 2 },
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
