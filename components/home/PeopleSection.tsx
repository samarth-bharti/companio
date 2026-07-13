"use client";

import Image from "next/image";
import { Marquee } from "@/components/motion/Marquee";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { LottiePlayer } from "@/components/motion/LottiePlayer";
import { MomentsGrid } from "@/components/home/MomentsGrid";
import { ClipReveal } from "@/components/journey/ClipReveal";

/** Vertical stagger so the scrolling row reads as a gentle wave (some cards raised). */
const OFFSETS = [-26, 26, -26, 26];

function PhotoCard({ src, alt, label, offset }: { src: string; alt: string; label: string; offset: number }) {
  return (
    <div
      className="relative shrink-0 rounded-2xl overflow-hidden"
      style={{ width: 230, height: 290, transform: `translateY(${offset}px)` }}
    >
      <Image src={src} alt={alt} fill sizes="230px" className="object-cover" loading="lazy" />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(20,18,42,0.65) 0%, transparent 55%)" }}
        aria-hidden="true"
      />
      <span
        className="absolute bottom-3 left-3 font-sans font-semibold text-sm px-3 py-1 rounded-pill"
        style={{ background: "rgba(20,18,42,0.72)", color: "#F4F2FF" }}
      >
        {label}
      </span>
    </div>
  );
}

/* Unsplash placeholder photos — platonic activity moments only */
const PHOTOS = [
  {
    src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=480&q=80",
    alt: "Group of friends laughing together on a city street",
    label: "City Walk",
  },
  {
    src: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=480&q=80",
    alt: "Two people working out together at a gym",
    label: "Gym Buddy",
  },
  {
    src: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=480&q=80",
    alt: "Two friends having an animated conversation at a café",
    label: "Café Chat",
  },
  {
    src: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=480&q=80",
    alt: "Friends enjoying a live music concert together",
    label: "Live Concert",
  },
  {
    src: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=480&q=80",
    alt: "Group of people hiking a trail together",
    label: "Hiking Trail",
  },
  {
    src: "https://images.unsplash.com/photo-1523301343968-6a6ebf63c672?w=480&q=80",
    alt: "Friends socialising at a rooftop gathering",
    label: "Rooftop Social",
  },
  {
    src: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=480&q=80",
    alt: "A gallery wall of classical paintings at an art museum",
    label: "Museum Tour",
  },
  {
    src: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=480&q=80",
    alt: "Two friends cooking a meal together in a home kitchen",
    label: "Cooking Together",
  },
  {
    src: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=480&q=80",
    alt: "Person playing an acoustic guitar",
    label: "Jam Session",
  },
  {
    src: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=480&q=80",
    alt: "A full cinema audience watching a film together",
    label: "Movie Night",
  },
  {
    src: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=480&q=80",
    alt: "A board game mid-play on a table",
    label: "Game Night",
  },
  {
    src: "https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=480&q=80",
    alt: "A cyclist riding a scenic mountain road",
    label: "Cycling",
  },
  {
    src: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=480&q=80",
    alt: "A swimmer doing laps in a pool",
    label: "Swim & Sport",
  },
  {
    src: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=480&q=80",
    alt: "A basketball dropping through the hoop at a game",
    label: "Game Day",
  },
  {
    src: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=480&q=80",
    alt: "Paintbrushes and colours on a canvas at an art session",
    label: "Art & Crafts",
  },
  {
    src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=480&q=80",
    alt: "A weekend campsite tent looking out onto a forest",
    label: "Weekend Camping",
  },
  {
    src: "https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=480&q=80",
    alt: "Three friends laughing together on a city street",
    label: "City Hangout",
  },
  {
    src: "https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?w=480&q=80",
    alt: "A group of friends celebrating on a hilltop at sunset",
    label: "Sunset Trek",
  },
] as const;

export function PeopleSection() {
  return (
    <section
      className="relative py-24 md:py-32 overflow-hidden"
      style={{ background: "var(--grad-dark-panel)" }}
      aria-labelledby="people-heading"
    >
      {/* Ambient glow */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[800px] h-96 rounded-full opacity-10 blur-3xl" style={{ background: "var(--color-violet)" }} />

      {/* Birdies — subtle ambient decorative, behind content */}
      <div aria-hidden="true" className="pointer-events-none absolute top-8 right-8 opacity-15 select-none hidden md:block">
        <LottiePlayer src="/lottie/birdies.json" width={180} height={120} loop />
      </div>

      <div className="max-w-7xl mx-auto px-6 mb-16">
        <RevealGroup>
          <Reveal>
            <p className="label-eyebrow mb-4" style={{ color: "var(--color-gold)" }}>
              Real people · Real moments
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <ClipReveal
              id="people-heading"
              text="Life is richer with someone."
              accent="with someone."
              accentStyle={{
                background: 'linear-gradient(135deg, #FFB23E, #7A4FE0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              className="font-display text-h1 leading-tight tracking-tight max-w-3xl mb-5"
              style={{ color: 'var(--color-panel-text)', letterSpacing: '-0.03em' }}
            />
          </Reveal>
          <Reveal delay={0.16}>
            <p className="text-lead max-w-xl" style={{ color: "rgba(244,242,255,0.65)" }}>
              From a dawn city walk to a weekend hike, every activity is better with
              someone warm beside you. Companio connects you with ID-checked companions
              who share your city and your energy.
            </p>
          </Reveal>
        </RevealGroup>
      </div>

      {/* Moments bento grid — 5 Lottie blocks, varied sizes */}
      <MomentsGrid />

      <Marquee speed={56} className="py-12">
        {PHOTOS.map((photo, i) => (
          <PhotoCard key={photo.src} {...photo} offset={OFFSETS[i % OFFSETS.length]} />
        ))}
      </Marquee>

    </section>
  );
}
