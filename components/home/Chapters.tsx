"use client";

import Link from "next/link";
import Image from "next/image";
import {
  MapPin, Dumbbell, CalendarDays, MessageCircle, Heart, ShoppingBag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { PassportCard } from "@/components/ui/PassportCard";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { TiltCard } from "@/components/motion/TiltCard";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

// Placeholder activity photos — replace with owned platonic photography.
// All photos are strictly non-romantic activity/scene shots.
interface Chapter {
  slug: string;
  icon: LucideIcon;
  name: string;
  line: string;
  photo: string;
  photoAlt: string;
}

const CHAPTERS: Chapter[] = [
  {
    slug: "city-guide",
    icon: MapPin,
    name: "City Guide",
    line: "Know the lanes, find the gems.",
    photo: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=480&q=75",
    photoAlt: "A person exploring a vibrant city street market",
  },
  {
    slug: "gym-running",
    icon: Dumbbell,
    name: "Gym & Running",
    line: "Motivation that shows up.",
    photo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=480&q=75",
    photoAlt: "People exercising together in a bright gym",
  },
  {
    slug: "events",
    icon: CalendarDays,
    name: "Events & Plus-One",
    line: "Never walk in alone.",
    photo: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=480&q=75",
    photoAlt: "An enthusiastic crowd enjoying a live cultural event",
  },
  {
    slug: "conversation",
    icon: MessageCircle,
    name: "Conversation & Café",
    line: "Good talk over good coffee.",
    photo: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=480&q=75",
    photoAlt: "Two friends laughing warmly over coffee at a café",
  },
  {
    slug: "elder-company",
    icon: Heart,
    name: "Elder Company",
    line: "Caring presence, no rush.",
    photo: "https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=480&q=75",
    photoAlt: "An older person enjoying a peaceful walk in a park",
  },
  {
    slug: "errands",
    icon: ShoppingBag,
    name: "Errands & City Help",
    line: "An extra pair of trusted hands.",
    photo: "https://images.unsplash.com/photo-1604999333679-b86d54738315?auto=format&fit=crop&w=480&q=75",
    photoAlt: "Two people browsing a local market together",
  },
];

function ChapterCard({ chapter, index }: { chapter: Chapter; index: number }) {
  const Icon = chapter.icon;
  return (
    <Reveal delay={index * 0.07}>
      <TiltCard maxDeg={5} className="w-full h-full">
        <MagneticButton className="w-full h-full">
          <Link
            href={`/explore?category=${chapter.slug}`}
            className="block w-full h-full focus-visible:outline-navy rounded-[--radius-md]"
            aria-label={`${chapter.name}, ${chapter.line}`}
          >
            <PassportCard
              className={cn(
                "overflow-hidden p-0 flex flex-col h-full cursor-pointer group",
                "transition-shadow duration-200",
                "hover:[box-shadow:var(--glow-azure)]"
              )}
            >
              {/* Activity photo strip */}
              <div className="relative w-full h-28 shrink-0 overflow-hidden">
                {/* Placeholder: swap with owned photography once available */}
                <Image
                  src={chapter.photo}
                  alt={chapter.photoAlt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                {/* Gradient fade to card background at bottom */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface/80"
                />
              </div>

              {/* Card content */}
              <div className="p-5 flex flex-col gap-3 flex-1">
                <motion.div
                  whileHover={{ scale: 1.18, rotate: -4 }}
                  transition={{ type: "spring", stiffness: 420, damping: 16 }}
                  className="w-10 h-10 flex items-center justify-center rounded-lg
                             bg-azure-tint text-azure shrink-0"
                >
                  <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                </motion.div>

                <div>
                  <p className="font-sans font-bold text-base text-ink leading-snug mb-1">
                    {chapter.name}
                  </p>
                  <p className="text-sm font-sans text-ink-muted leading-snug">
                    {chapter.line}
                  </p>
                </div>
              </div>
            </PassportCard>
          </Link>
        </MagneticButton>
      </TiltCard>
    </Reveal>
  );
}

export function Chapters() {
  return (
    <section className="py-24 bg-paper" aria-labelledby="chapters-heading">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="text-center mb-12">
          <p className="label-eyebrow text-brass-ink mb-3">Categories</p>
          <h2 id="chapters-heading" className="font-display text-h2 text-navy">
            Pick your chapter.
          </h2>
          <p className="text-lead text-ink-muted mt-4 max-w-lg mx-auto">
            Whatever you need company for, there&apos;s a ID-checked companion for it.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {CHAPTERS.map((chapter, i) => (
            <ChapterCard key={chapter.slug} chapter={chapter} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
