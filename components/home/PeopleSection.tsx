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
    src: "/city-walk.jpg",
    alt: "A couple walking together down a busy neon-lit city street at dusk",
    label: "City Walk",
  },
  {
    src: "/gym-buddy.jpg",
    alt: "A couple smiling and assisting each other during a workout in the gym",
    label: "Gym Buddy",
  },
  {
    src: "/cafe-chat.jpg",
    alt: "A couple looking at each other warmly and chatting at a café window table",
    label: "Café Chat",
  },
  {
    src: "/live-concert.jpg",
    alt: "A couple dancing and enjoying a live concert under vibrant stage lights",
    label: "Live Concert",
  },
  {
    src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=480&q=80",
    alt: "A happy duo looking out at mountain peaks on a hiking trail",
    label: "Hiking Trail",
  },
  {
    src: "/rooftop-social.jpg",
    alt: "A couple smiling and conversing on a balcony with city skyline background",
    label: "Rooftop Social",
  },
  {
    src: "/museum-tour.webp",
    alt: "A couple walking hand-in-hand through a museum's classical sculpture gallery",
    label: "Museum Tour",
  },
  {
    src: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=480&q=80",
    alt: "A couple laughing and cooking a meal together in the kitchen",
    label: "Cooking Together",
  },
  {
    src: "/jam-session.jpg",
    alt: "A couple smiling and playing acoustic guitar together during a jam session",
    label: "Jam Session",
  },
  {
    src: "/movie-night.jpg",
    alt: "A couple eating popcorn and enjoying a movie night together in a cinema",
    label: "Movie Night",
  },
  {
    src: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=480&q=80",
    alt: "A couple smiling while cycling side-by-side on a scenic road",
    label: "Cycling",
  },
  {
    src: "/swim-sport.jpg",
    alt: "A couple swimming and snorkeling together underwater in clear blue water",
    label: "Swim & Sport",
  },
  {
    src: "/game-day.jpg",
    alt: "Two friends playing console video games together with controllers",
    label: "Game Day",
  },
  {
    src: "/arts-crafts.jpg",
    alt: "A couple smiling and shaping clay pottery together at a table",
    label: "Art & Crafts",
  },
  {
    src: "/weekend-camping.jpg",
    alt: "A couple making coffee together inside their camping tent",
    label: "Weekend Camping",
  },
  {
    src: "/city-hangout.jpg",
    alt: "A couple walking arm-in-arm down a city sidewalk",
    label: "City Hangout",
  },
  {
    src: "https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?w=480&q=80",
    alt: "A couple celebrating together on a peak at sunset",
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

      {/* Bottom fade to the WaveBridge colour (#0F1120). The section bg is a
          diagonal gradient, so its bottom edge is uneven (purple on one side);
          this evens it out so the section meets the wave with no two-tone seam. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48"
        style={{ background: "linear-gradient(to bottom, rgba(15,17,32,0) 0%, #0F1120 100%)" }}
      />

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
              someone warm beside you. Companio connects you with verified companions
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
