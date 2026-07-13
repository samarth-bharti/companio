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

/**
 * The activity gallery.
 *
 * Three of these are owned files in public/ rather than Unsplash hotlinks — a gym
 * spot, a pottery table, a rooftop conversation. Owning them matters: an Unsplash
 * URL can change or rate-limit underneath us.
 *
 * The rest of the owned set was deliberately left out. Every photo here has one
 * job: to show two people who are NOT on a date. A man feeding a woman cake off
 * his fork, a couple holding hands through a museum in black tie, a pair in
 * matching hoodies with his arm around her, two people sharing a tent overnight —
 * those say the opposite of "strictly platonic", which is the promise this whole
 * product, and its Terms of Service, rest on. On a paid-companionship site in
 * India, that inference is not a branding problem. It is an existential one.
 *
 * The test for a photo on this page: could you show it to the companion's mother?
 */
const PHOTOS = [
  {
    src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=85",
    alt: "Friends laughing together on a city street",
    label: "City Walk",
  },
  {
    // Owned. She is holding his feet while he does sit-ups: a spot, not a date.
    src: "/gym-buddy.jpg",
    alt: "Two gym partners laughing, one holding the other's feet during sit-ups",
    label: "Gym Buddy",
  },
  {
    src: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&q=85",
    alt: "Two friends in an animated conversation at a cafe",
    label: "Cafe Chat",
  },
  {
    src: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&q=85",
    alt: "Friends enjoying live music together",
    label: "Live Events",
  },
  {
    src: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&q=85",
    alt: "A group of people hiking a trail together",
    label: "Weekend Trek",
  },
  {
    // Owned. Standing apart, mid-conversation, both laughing at the same thing.
    src: "/rooftop-social.jpg",
    alt: "Two people talking and laughing on a rooftop above the city",
    label: "Rooftop Social",
  },
  {
    src: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&q=85",
    alt: "A gallery wall of classical paintings at an art museum",
    label: "Museum",
  },
  {
    // Owned. Both are looking at the clay, not at each other. That is the test.
    src: "/arts-crafts.jpg",
    alt: "Two people shaping pottery together at a craft table",
    label: "Arts & Crafts",
  },
  {
    src: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=600&q=85",
    alt: "Someone playing an acoustic guitar",
    label: "Jam Session",
  },
  {
    src: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&q=85",
    alt: "A board game mid-play on a table",
    label: "Board Games",
  },
  {
    src: "https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=600&q=85",
    alt: "A cyclist riding a scenic road",
    label: "Morning Run",
  },
  {
    src: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=85",
    alt: "Two friends cooking a meal together",
    label: "Street Food Tour",
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
