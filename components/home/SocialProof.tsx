"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Marquee } from "@/components/motion/Marquee";
import { Reveal } from "@/components/motion/Reveal";

// Placeholder reviewer avatars from Unsplash — replace with owned photos.
// All portraits are non-romantic, non-suggestive profile-style images.
interface Review {
  id: string;
  name: string;
  city: string;
  rating: number;
  quote: string;
  avatar: string; // Unsplash URL
}

const REVIEWS: Review[] = [
  {
    id: "r1",
    name: "Priya Menon",
    city: "Mumbai",
    rating: 5,
    quote: "Took a long walk along Marine Drive with a companion who knew every story behind every building. It felt like having a wise local friend.",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?auto=format&fit=crop&w=64&h=64&q=80",
  },
  {
    id: "r2",
    name: "Arjun Sharma",
    city: "Bengaluru",
    rating: 5,
    quote: "My companion joined me at a networking event and kept the conversation natural all evening. Zero awkwardness. Highly recommended.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64&q=80",
  },
  {
    id: "r3",
    name: "Divya Nair",
    city: "Delhi",
    rating: 5,
    quote: "I was worried it would feel transactional. It didn't. She was warm, funny, and genuinely good company at Lodi Garden.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=64&h=64&q=80",
  },
  {
    id: "r4",
    name: "Rohit Gupta",
    city: "Pune",
    rating: 5,
    quote: "My elderly mother wanted a companion for her morning walks. The companion is patient, reliable, and she looks forward to it every day.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64&q=80",
  },
  {
    id: "r5",
    name: "Aisha Khan",
    city: "Hyderabad",
    rating: 5,
    quote: "New to the city and wanted to explore Charminar properly. The companion turned a tourist trip into a real neighbourhood experience.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=80",
  },
  {
    id: "r6",
    name: "Suresh Iyer",
    city: "Chennai",
    rating: 5,
    quote: "The background-check and ID verification gave my family peace of mind. For me, it was just an excellent afternoon.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64&q=80",
  },
  {
    id: "r7",
    name: "Kavya Reddy",
    city: "Bengaluru",
    rating: 5,
    quote: "I moved to Bengaluru for work and barely knew anyone. My companion introduced me to three fantastic neighbourhoods. Now it feels like home.",
    avatar: "https://images.unsplash.com/photo-1547212371-a5a42a418dd4?auto=format&fit=crop&w=64&h=64&q=80",
  },
  {
    id: "r8",
    name: "Nikhil Joshi",
    city: "Mumbai",
    rating: 5,
    quote: "Came for the gym partnership, stayed for the motivation. Having someone reliable waiting at 6 AM genuinely changed my fitness routine.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=64&h=64&q=80",
  },
  {
    id: "r9",
    name: "Meera Pillai",
    city: "Kochi",
    rating: 5,
    quote: "My daughter booked this for me after I retired. I never expected it, but my companion has honestly become a real friend.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=64&h=64&q=80",
  },
];

function StarRow({ count }: { count: number }) {
  return (
    <span aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ color: "var(--color-marigold)" }} aria-hidden="true">★</span>
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <motion.article
      whileHover={{ y: -5, boxShadow: "var(--shadow-lift)" }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      className="flex flex-col gap-4 w-80 shrink-0 p-6 rounded-[--radius-md]
                 bg-surface border border-edge [box-shadow:var(--shadow-1)]
                 cursor-default"
    >
      <div className="flex items-center gap-3">
        {/* Placeholder avatar photo — replace with real member photography */}
        <div
          className="w-11 h-11 shrink-0 rounded-full overflow-hidden border-2"
          style={{ borderColor: "var(--color-brass)" }}
        >
          <Image
            src={review.avatar}
            alt={review.name}
            width={44}
            height={44}
            className="object-cover w-full h-full"
          />
        </div>
        <div>
          <p className="font-sans font-semibold text-sm text-ink leading-tight">{review.name}</p>
          <p className="font-sans text-xs text-ink-muted">{review.city}</p>
        </div>
      </div>

      <blockquote className="font-serif text-[0.95rem] leading-relaxed text-ink-muted">
        &ldquo;{review.quote}&rdquo;
      </blockquote>

      <div className="flex items-center gap-2">
        <StarRow count={review.rating} />
        <span className="flex items-center gap-1 text-xs font-sans text-trust">
          <CheckCircle2 size={12} strokeWidth={2} aria-hidden="true" />
          Verified meetup
        </span>
      </div>
    </motion.article>
  );
}

export function SocialProof() {
  return (
    <section className="py-24 bg-paper overflow-hidden" aria-labelledby="social-heading">
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <Reveal className="text-center mb-6">
          <p className="label-eyebrow text-brass-ink mb-3">Reviews</p>
          <h2 id="social-heading" className="font-display text-h2 text-navy">
            Company people actually trust.
          </h2>
        </Reveal>

        {/* Live social proof stat strip */}
        <Reveal delay={0.1} className="flex justify-center">
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-pill
                       border border-edge bg-oat"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ background: "var(--color-trust)" }}
              />
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ background: "var(--color-trust)" }}
              />
            </span>
            <p className="text-sm font-sans font-medium text-ink-muted">
              <strong className="text-ink">1,240 meetups</strong> completed this month · 12 cities · 4.9★ average
            </p>
          </div>
        </Reveal>
      </div>

      {/* Marquee — pauses on hover, off on reduced-motion */}
      <Marquee speed={48} className="py-4">
        {REVIEWS.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </Marquee>
    </section>
  );
}
