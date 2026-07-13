// The seed companion catalogue: the profiles that exist on day one, before any
// application is approved. `prisma/seed.ts` upserts every entry here into the
// `companions` table, and the app reads that table — never this file — at
// runtime. Treat this as the initial contents of a database, not as the database.
//
// TWO THINGS USED TO BE FALSE HERE AND ARE NOT ANY MORE:
//
//  1. Every profile carried `rating: 4.9` and `reviews: 124`, plus a
//     `reviewsList` of named strangers ("Shreya M., Mumbai") praising a meetup
//     that never happened. Nobody has been rated, so every rating is 0 and every
//     review list is empty. The UI shows a "New" badge instead of stars while
//     `reviews === 0`. Real reviews will come from Booking.review rows and carry
//     the reviewer's actual first name.
//
//  2. Only Mumbai had companions. Every other city rendered these same fourteen
//     people with the local neighbourhood names swapped in, via a helper called
//     localizeArea(). Indore is now genuinely served — its own profiles, its own
//     neighbourhoods, its own coordinates in lib/data/areas.ts. Cities with
//     nobody in them show an empty state inviting the first companion.
//
// `topMatch` is per city: at most one companion in each may set it.
// Bio, suggestions and activities are strictly platonic per §1.5.

export interface Companion {
  id: string;
  name: string;           // full name, shown when unlocked
  firstName: string;
  maskedName: string;     // first 3 letters + '···'
  city: string;
  area: string;
  age?: number;
  activities: string[];
  languages: string[];
  /** 0 until real reviews exist. Never render stars while `reviews === 0`. */
  rating: number;
  /** Count of real reviews. 0 for every seeded profile. */
  reviews: number;
  ratePerMeeting: number;
  bio: string;
  suggestions: string[];  // "What we'd do" — 3 city-specific ideas
  photo: string;          // Unsplash portrait URL
  accent: string;         // one of the four theme hex values
  sameGenderNote?: boolean;
  topMatch?: boolean;     // at most one per city
  /**
   * Whether an operator has actually cleared this person's government ID.
   *
   * DATABASE-OWNED. It is deliberately absent from every authored entry below,
   * so the seed (which spreads authored fields into its update branch) can never
   * write it and re-verify someone an admin un-verified. Absent ⇒ not verified.
   *
   * The "Verified" badge renders off this and nothing else. It used to be
   * hardcoded markup on every card, which told members that 22 seeded profiles
   * had passed an ID check that none of them had been through.
   */
  verified?: boolean;
  availableNow: boolean;
  availability: string;    // e.g. "Free now" | "Free this evening" | …
  distanceKm: number;
  matchScore: number;      // compatibility score used for the default sort
  reviewsList: {
    name: string;
    city: string;
    stars: number;
    text: string;
  }[];
}

// ── Accent palette rotation ───────────────────────────────────────────────────
const AZURE   = '#2E6BFF';
const VIOLET  = '#7A4FE0';
const GOLD    = '#FFB23E';
const EMERALD = '#1FAE6B';

// ── Dataset ───────────────────────────────────────────────────────────────────

export const COMPANIONS: Companion[] = [
  // ── 01 · Ananya Iyer — TOP MATCH ──────────────────────────────────────────
  {
    id: 'ananya',
    name: 'Ananya Iyer',
    firstName: 'Ananya',
    maskedName: 'Ana···',
    city: 'Mumbai',
    area: 'Bandra West',
    age: 27,
    activities: ['City Walk', 'Café Chat', 'Museum'],
    languages: ['Hindi', 'English', 'Tamil'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Ananya grew up walking every lane of Bandra and can turn a 30-minute chai break into a two-hour conversation. She enjoys museum visits and knows Kala Ghoda like the back of her hand, great company for anyone who likes to slow down and actually look at things.',
    suggestions: [
      'A slow wander through the Kala Ghoda art district ending at a filter-coffee spot on Colaba Causeway.',
      'Sunrise at Bandstand promenade, then cutting chai at a local Irani café before the city wakes up.',
      'An afternoon at CSMVS (the old Prince of Wales Museum) followed by a stroll through Horniman Circle garden.',
    ],
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=480&q=80',
    accent: AZURE,
    topMatch: true,
    availableNow: true,
    availability: 'Free now',
    distanceKm: 2.1,
    matchScore: 95,
    reviewsList: [],
  },

  // ── 02 · Rohan Desai ──────────────────────────────────────────────────────
  {
    id: 'rohan',
    name: 'Rohan Desai',
    firstName: 'Rohan',
    maskedName: 'Roh···',
    city: 'Mumbai',
    area: 'Andheri West',
    age: 31,
    activities: ['Gym Buddy', 'Morning Run', 'Street Food Tour'],
    languages: ['Hindi', 'English', 'Marathi'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Rohan is a consistent early riser who treats every morning session as a reset, whether it is a 6 AM run through Versova beach or a gym warm-up. He also has an encyclopedic knowledge of Andheri\'s street-food stalls and makes every outing feel unhurried.',
    suggestions: [
      'An early-morning run along Versova beach followed by freshly squeezed juice at the fishing village.',
      'A street-food walk through the Andheri market lanes, vada pav, misal, and the best pav bhaji cart he knows.',
      'A weekend gym session followed by a slow breakfast at a local Udipi restaurant.',
    ],
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=480&q=80',
    accent: EMERALD,
    availableNow: false,
    availability: 'Free this evening',
    distanceKm: 4.3,
    matchScore: 82,
    reviewsList: [],
  },

  // ── 03 · Priya Nair ───────────────────────────────────────────────────────
  {
    id: 'priya',
    name: 'Priya Nair',
    firstName: 'Priya',
    maskedName: 'Pri···',
    city: 'Mumbai',
    area: 'Colaba',
    age: 29,
    activities: ['City Walk', 'Photography Walk', 'Museum'],
    languages: ['English', 'Malayalam', 'Hindi'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Priya moved to Colaba five years ago and has spent much of that time photographing its quieter corners, the old bungalows, the Sunday antique market, the ferry terminal at dawn. She makes a wonderful companion for anyone who wants to look at the city properly.',
    suggestions: [
      'A Sassoon Dock photo walk at sunrise when the fishing boats come in and the light is extraordinary.',
      'The Sunday Chor Bazaar antique market followed by a slow browse through Colaba Causeway.',
      'An afternoon at the Dr Bhau Daji Lad Museum in Byculla, one of Mumbai\'s most underrated gems.',
    ],
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=480&q=80',
    accent: VIOLET,
    sameGenderNote: true,
    availableNow: true,
    availability: 'Free now',
    distanceKm: 1.8,
    matchScore: 91,
    reviewsList: [],
  },

  // ── 04 · Aarav Mehta ─────────────────────────────────────────────────────
  {
    id: 'aarav',
    name: 'Aarav Mehta',
    firstName: 'Aarav',
    maskedName: 'Aar···',
    city: 'Mumbai',
    area: 'Powai',
    age: 34,
    activities: ['Café Chat', 'Book Browsing', 'City Walk'],
    languages: ['Hindi', 'English', 'Gujarati'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Aarav is a reader who genuinely enjoys talking through ideas over a long cup of coffee. He lives near Powai Lake and knows the quieter walking paths around it that most people never find. A calm and thoughtful companion for anyone who wants conversation that goes somewhere.',
    suggestions: [
      'A leisurely circuit of Powai Lake in the early evening, when the light on the water is at its best.',
      'A browse through Kitab Khana bookshop in Fort followed by chai and a long conversation at a nearby café.',
      'A quiet Sunday morning walk through the NITIE campus, one of Mumbai\'s most peaceful green pockets.',
    ],
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=480&q=80',
    accent: GOLD,
    availableNow: false,
    availability: 'Available tomorrow',
    distanceKm: 6.7,
    matchScore: 74,
    reviewsList: [],
  },

  // ── 05 · Zara Sheikh ─────────────────────────────────────────────────────
  {
    id: 'zara',
    name: 'Zara Sheikh',
    firstName: 'Zara',
    maskedName: 'Zar···',
    city: 'Mumbai',
    area: 'Juhu',
    age: 26,
    activities: ['Morning Run', 'Live Events', 'Street Food Tour'],
    languages: ['Hindi', 'English', 'Urdu'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Zara runs the Juhu beach stretch every morning and knows every good live-music spot from Bandra to Andheri. She brings real energy to any outing and has a gift for making new people feel instantly comfortable in the city.',
    suggestions: [
      'An early Juhu beach run ending at the famous chaat stalls for pani puri and ragda as the beach fills up.',
      'An evening at one of the intimate live-music venues in Bandra, she always knows who is playing.',
      'A street-food circuit through Juhu and Vile Parle hitting the best pav bhaji, bhel, and sev puri stalls.',
    ],
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=480&q=80',
    accent: AZURE,
    availableNow: true,
    availability: 'Free now',
    distanceKm: 3.2,
    matchScore: 88,
    reviewsList: [],
  },

  // ── 06 · Kiran Patil ──────────────────────────────────────────────────────
  {
    id: 'kiran',
    name: 'Kiran Patil',
    firstName: 'Kiran',
    maskedName: 'Kir···',
    city: 'Mumbai',
    area: 'Dadar',
    age: 38,
    activities: ['Elder Company', 'City Walk', 'Café Chat'],
    languages: ['Marathi', 'Hindi', 'English'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Kiran has spent years as a community volunteer in Dadar and has a gentle, unhurried presence that makes every meetup feel easy. He is especially well-suited to longer, slower outings, a walk through a neighbourhood, an afternoon at a park, or a comfortable conversation over tea.',
    suggestions: [
      'A slow morning walk through Shivaji Park, stopping to watch the morning cricket and take in the sea breeze.',
      'An afternoon at Dadar flower market, one of the most vibrant and photogenic corners of the city.',
      'Chai and conversation at a classic Irani café near Dadar station, the kind of place that has not changed in decades.',
    ],
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=480&q=80',
    accent: EMERALD,
    availableNow: false,
    availability: 'Free weekends',
    distanceKm: 8.1,
    matchScore: 67,
    reviewsList: [],
  },

  // ── 07 · Ishaan Choudhary ─────────────────────────────────────────────────
  {
    id: 'ishaan',
    name: 'Ishaan Choudhary',
    firstName: 'Ishaan',
    maskedName: 'Ish···',
    city: 'Mumbai',
    area: 'Lower Parel',
    age: 30,
    activities: ['Gym Buddy', 'Live Events', 'City Walk'],
    languages: ['Hindi', 'English', 'Punjabi'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Ishaan trains at one of the older gyms near Lower Parel and has a relaxed, no-pressure approach that works well for people getting back into a routine. He also follows the city\'s live-music and stand-up circuit closely and is good company at anything from a warehouse gig to an open-air event.',
    suggestions: [
      'A morning workout session followed by a long breakfast at one of the mill-district cafés in Lower Parel.',
      'A walk through the Kamala Mills compound in the evening when the whole neighbourhood comes alive.',
      'Tickets to a stand-up show at Canvas Laugh Club or a gig at the Blue Frog space, he keeps the listings bookmarked.',
    ],
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=480&q=80',
    accent: VIOLET,
    availableNow: false,
    availability: 'Free this evening',
    distanceKm: 5.5,
    matchScore: 78,
    reviewsList: [],
  },

  // ── 08 · Meena Krishnamurthy ─────────────────────────────────────────────
  {
    id: 'meena',
    name: 'Meena Krishnamurthy',
    firstName: 'Meena',
    maskedName: 'Mee···',
    city: 'Mumbai',
    area: 'Matunga',
    age: 43,
    activities: ['Elder Company', 'Café Chat', 'Book Browsing'],
    languages: ['Tamil', 'Hindi', 'English', 'Marathi'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Meena is a retired schoolteacher who brings a calm, attentive warmth to every meetup. She loves long conversations over filter coffee and can spend a happy afternoon in a bookshop without looking at the clock. Ideal company for anyone who wants an unhurried, genuinely present afternoon.',
    suggestions: [
      'Filter coffee and conversation at Café Madras in Matunga, one of Mumbai\'s best South Indian institutions.',
      'A quiet browse at Strand Book Stall in Fort, followed by a walk along the old Fort precinct.',
      'An afternoon in Shivaji Park watching the world go by, with a stop at the Matunga market on the way back.',
    ],
    photo: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=480&q=80',
    accent: GOLD,
    sameGenderNote: true,
    availableNow: true,
    availability: 'Free now',
    distanceKm: 7.4,
    matchScore: 85,
    reviewsList: [],
  },

  // ── 09 · Sahil Bose ──────────────────────────────────────────────────────
  {
    id: 'sahil',
    name: 'Sahil Bose',
    firstName: 'Sahil',
    maskedName: 'Sah···',
    city: 'Mumbai',
    area: 'Versova',
    age: 28,
    activities: ['Photography Walk', 'Morning Run', 'Street Food Tour'],
    languages: ['Bengali', 'Hindi', 'English'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Sahil grew up in Kolkata and brought his love of early mornings and street photography to Versova when he moved two years ago. He knows the fishing village\'s light at every hour and has an instinct for the kind of street-food stop that looks unremarkable but tastes extraordinary.',
    suggestions: [
      'A dawn walk through Versova fishing village when the trawlers are returning and the light turns gold.',
      'A street-food and photography circuit through Lokhandwala market and the lanes behind it.',
      'An early-morning run along the Versova beach stretch ending at a local tapri for cutting chai.',
    ],
    photo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=480&q=80',
    accent: AZURE,
    availableNow: false,
    availability: 'Available tomorrow',
    distanceKm: 9.6,
    matchScore: 71,
    reviewsList: [],
  },

  // ── 10 · Deepika Rao ─────────────────────────────────────────────────────
  {
    id: 'deepika',
    name: 'Deepika Rao',
    firstName: 'Deepika',
    maskedName: 'Dee···',
    city: 'Mumbai',
    area: 'Worli',
    age: 32,
    activities: ['City Walk', 'Live Events', 'Café Chat'],
    languages: ['Kannada', 'Hindi', 'English'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Deepika moved from Bengaluru and brought her filter-coffee habit with her to Worli, where she has found a handful of good spots the locals do not always know about. She is comfortable at everything from a quiet museum afternoon to a crowded weekend concert and brings a calm, grounded energy to both.',
    suggestions: [
      'An evening walk along the Worli Sea Face, watching the Bandra-Worli Sea Link light up at dusk.',
      'A visit to the National Gallery of Modern Art in Fort, followed by a long coffee at a café nearby.',
      'An evening at Prithvi Theatre in Juhu for a play, then chai at the iconic Prithvi Café in the courtyard.',
    ],
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=480&q=80',
    accent: VIOLET,
    availableNow: true,
    availability: 'Free now',
    distanceKm: 4.0,
    matchScore: 92,
    reviewsList: [],
  },

  // ── 11 · Arjun Pillai ────────────────────────────────────────────────────
  {
    id: 'arjun',
    name: 'Arjun Pillai',
    firstName: 'Arjun',
    maskedName: 'Arj···',
    city: 'Mumbai',
    area: 'Chembur',
    age: 36,
    activities: ['City Walk', 'Gym Buddy', 'Street Food Tour'],
    languages: ['Malayalam', 'Hindi', 'English'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Arjun has lived in Chembur his whole life and has a genuine fondness for its underrated food scene and quieter green spaces. He is a steady gym partner and a good person to have on a long walk because he never needs to fill every silence with words.',
    suggestions: [
      'A walk through RCF Colony and the Chembur green belt, one of east Mumbai\'s quietest stretches.',
      'A street-food tour of the Chembur and Ghatkopar markets, from Maharashtra misal to Gujarati farsan.',
      'A morning gym session followed by a South Indian breakfast at one of the classic Chembur Udipi restaurants.',
    ],
    photo: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=480&q=80',
    accent: EMERALD,
    availableNow: false,
    availability: 'Free this evening',
    distanceKm: 11.2,
    matchScore: 63,
    reviewsList: [],
  },

  // ── 12 · Fatima Shaikh ────────────────────────────────────────────────────
  {
    id: 'fatima',
    name: 'Fatima Shaikh',
    firstName: 'Fatima',
    maskedName: 'Fati···',
    city: 'Mumbai',
    area: 'Malad',
    age: 25,
    activities: ['Morning Run', 'Café Chat', 'Photography Walk'],
    languages: ['Hindi', 'Urdu', 'English', 'Marathi'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Fatima is an early-morning person who runs the Malad creek trail most days and has a warm, easy way with new people. She is studying photography on weekends and approaches every walk with a genuine curiosity about what the light is doing and what the city is showing that day.',
    suggestions: [
      'A morning run along the Malad creek followed by fresh coconut water from the stalls near the water.',
      'A photography walk through the Linking Road and Hill Road lanes, focusing on shopfront typography and colour.',
      'Chai and conversation at a local bakery in Malad, she knows the ones that have been there for thirty years.',
    ],
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=480&q=80',
    accent: GOLD,
    sameGenderNote: true,
    availableNow: false,
    availability: 'Free weekends',
    distanceKm: 3.8,
    matchScore: 80,
    reviewsList: [],
  },

  // ── 13 · Vivek Sharma ────────────────────────────────────────────────────
  {
    id: 'vivek',
    name: 'Vivek Sharma',
    firstName: 'Vivek',
    maskedName: 'Viv···',
    city: 'Mumbai',
    area: 'Khar',
    age: 33,
    activities: ['Café Chat', 'Book Browsing', 'Live Events'],
    languages: ['Hindi', 'English', 'Gujarati'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Vivek works in editorial and spends a lot of time reading, thinking, and talking about what he has read. He is a natural at the kind of slow café afternoon where the conversation moves through several entirely different subjects before you notice the light has changed. Good company for a bookshop or a gig.',
    suggestions: [
      'A browse through the secondhand books on the pavement at Flora Fountain followed by coffee at Kala Ghoda Café.',
      'An evening at Prithvi Theatre followed by a long conversation at the Prithvi Café about what you just watched.',
      'A quiet Sunday at the Kitab Khana bookshop on the ground floor of a heritage building in Fort.',
    ],
    photo: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=480&q=80',
    accent: AZURE,
    availableNow: false,
    availability: 'Available tomorrow',
    distanceKm: 2.9,
    matchScore: 76,
    reviewsList: [],
  },

  // ── 14 · Nisha Kulkarni ──────────────────────────────────────────────────
  {
    id: 'nisha',
    name: 'Nisha Kulkarni',
    firstName: 'Nisha',
    maskedName: 'Nis···',
    city: 'Mumbai',
    area: 'Vile Parle',
    age: 40,
    activities: ['City Walk', 'Elder Company', 'Museum'],
    languages: ['Marathi', 'Hindi', 'English', 'Konkani'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Nisha grew up in Vile Parle and has the kind of encyclopedic local knowledge that only comes from decades in one neighbourhood. She is gentle, patient, and particularly good at the slower pace that some outings, and some people, need. Her favourite places tend to be the ones that have not changed in twenty years.',
    suggestions: [
      'A morning walk through the lanes of Vile Parle East stopping at old Maharashtrian sweet shops and the weekly sabzi market.',
      'A visit to the Nehru Science Centre in Worli, one of Mumbai\'s best and most relaxed museums.',
      'An afternoon at ISKCON\'s sprawling temple complex in Juhu, a calm, beautiful space that most Mumbaikars have never properly explored.',
    ],
    photo: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=480&q=80',
    accent: VIOLET,
    availableNow: false,
    availability: 'Free this evening',
    distanceKm: 10.3,
    matchScore: 69,
    reviewsList: [],
  },
  // ═════════════════════════════════════════════════════
  //  INDORE — Madhya Pradesh. Areas map to lib/data/areas.ts INDORE_AREAS.
  // ═════════════════════════════════════════════════════

  // ── 15 · Meghna Joshi — TOP MATCH (Indore) ────────────────────
  {
    id: 'meghna',
    name: 'Meghna Joshi',
    firstName: 'Meghna',
    maskedName: 'Meg···',
    city: 'Indore',
    area: 'Vijay Nagar',
    age: 26,
    activities: ['Street Food Tour', 'Café Chat', 'City Walk'],
    languages: ['Hindi', 'English', 'Marathi'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Meghna has eaten her way across Indore since she was a student, and treats Sarafa as a subject she teaches rather than a place she visits. She is easy company for anyone new to the city, and unhurried about it, happy to sit with one plate of poha for an hour if the conversation is good.',
    suggestions: [
      'Sarafa Bazaar after ten at night, when the jewellers shut and the food stalls open, working slowly from bhutte ka kees to garadu.',
      'Morning poha and jalebi at a Vijay Nagar stall, then a walk through the quiet residential lanes before the traffic starts.',
      'Chappan Dukan on a weekday evening, when you can actually get a table and taste more than one thing.',
    ],
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=480&q=80',
    accent: AZURE,
    topMatch: true,
    availableNow: true,
    availability: 'Free now',
    distanceKm: 3.2,
    matchScore: 94,
    reviewsList: [],
  },

  // ── 16 · Aditya Rathore ──────────────────────────────
  {
    id: 'aditya',
    name: 'Aditya Rathore',
    firstName: 'Aditya',
    maskedName: 'Adi···',
    city: 'Indore',
    area: 'Rajwada',
    age: 30,
    activities: ['City Walk', 'Photography Walk', 'Museum'],
    languages: ['Hindi', 'English'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Aditya reads about the Holkars for fun, and will tell you why the Rajwada burned down three times if you let him. He walks the old city slowly, camera in hand, and is good company for anyone who likes a place explained rather than pointed at.',
    suggestions: [
      'The seven storeys of Rajwada Palace at opening time, before the crowds, then the cloth-market lanes behind it.',
      'Lal Bagh Palace and its wildly European interiors, a twenty-minute walk that reliably turns into two hours.',
      'Krishnapura Chhatris at golden hour, which is the only time the light does the cenotaphs justice.',
    ],
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=480&q=80',
    accent: VIOLET,
    availableNow: false,
    availability: 'Free this weekend',
    distanceKm: 5.6,
    matchScore: 88,
    reviewsList: [],
  },

  // ── 17 · Sanya Kulkarni ──────────────────────────────
  {
    id: 'sanya',
    name: 'Sanya Kulkarni',
    firstName: 'Sanya',
    maskedName: 'San···',
    city: 'Indore',
    area: 'New Palasia',
    age: 24,
    activities: ['Café Chat', 'Book Browsing', 'Live Events'],
    languages: ['Hindi', 'English'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Sanya works in publishing and knows exactly which New Palasia cafes will let you sit for three hours on one coffee. She is a genuinely good listener, and will happily talk for an hour about a book she has not finished.',
    suggestions: [
      'A slow afternoon in a New Palasia cafe with whatever you are both currently reading.',
      'Browsing the secondhand book stalls near MG Road, where the pricing is a negotiation and the stock is a lottery.',
      'An open mic or a small gig, the kind where the audience is thirty people and everyone claps for everyone.',
    ],
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=480&q=80',
    accent: GOLD,
    sameGenderNote: true,
    availableNow: true,
    availability: 'Free now',
    distanceKm: 2.4,
    matchScore: 86,
    reviewsList: [],
  },

  // ── 18 · Kabir Malviya ───────────────────────────────
  {
    id: 'kabir',
    name: 'Kabir Malviya',
    firstName: 'Kabir',
    maskedName: 'Kab···',
    city: 'Indore',
    area: 'Bhawarkuan',
    age: 23,
    activities: ['Gym Buddy', 'Morning Run', 'Café Chat'],
    languages: ['Hindi', 'English'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Kabir is a final-year student near DAVV who has been running the same six-in-the-morning loop for four years. He is the reason three of his friends now run, which tells you the kind of company he is: encouraging, and never smug about it.',
    suggestions: [
      'An easy five-kilometre loop around Pipliyapala Regional Park, at whatever pace you actually run.',
      'A gym session where somebody counts your reps and fixes your form without making it awkward.',
      'Breakfast at a Bhawarkuan stall afterwards, which is the real reason to get up early.',
    ],
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=480&q=80',
    accent: EMERALD,
    availableNow: false,
    availability: 'Free mornings',
    distanceKm: 7.1,
    matchScore: 83,
    reviewsList: [],
  },

  // ── 19 · Ritika Sharma ───────────────────────────────
  {
    id: 'ritika',
    name: 'Ritika Sharma',
    firstName: 'Ritika',
    maskedName: 'Rit···',
    city: 'Indore',
    area: 'Geeta Bhawan',
    age: 29,
    activities: ['Elder Company', 'City Walk', 'Café Chat'],
    languages: ['Hindi', 'English', 'Gujarati'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Ritika spent two years as a care coordinator and is unusually good with people who are lonely and would rather not say so. She reads aloud well, walks at whatever pace you set, and does not fill silences that do not need filling.',
    suggestions: [
      'An unhurried morning in Nehru Park: a bench, and as much or as little conversation as you want.',
      'A trip to the market with someone to carry the bags and talk to on the way there.',
      'An afternoon of tea and the newspaper read out loud, which far more people want than will ask for.',
    ],
    photo: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=480&q=80',
    accent: AZURE,
    sameGenderNote: true,
    availableNow: false,
    availability: 'Free weekdays',
    distanceKm: 4.0,
    matchScore: 81,
    reviewsList: [],
  },

  // ── 20 · Farhan Qureshi ──────────────────────────────
  {
    id: 'farhan',
    name: 'Farhan Qureshi',
    firstName: 'Farhan',
    maskedName: 'Far···',
    city: 'Indore',
    area: 'Khajrana',
    age: 32,
    activities: ['Street Food Tour', 'City Walk', 'Live Events'],
    languages: ['Hindi', 'Urdu', 'English'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Farhan grew up near Khajrana and knows the difference between the four biryani places on the same road, all of which claim to be the original. He is warm, loud, and completely unbothered by queues.',
    suggestions: [
      'A Khajrana food crawl that ends wherever we run out of appetite, which is usually four stops in.',
      'The temple complex on a Wednesday, which is busy in a way that is worth seeing once.',
      'A walk down to Bengali Square for kebabs, taking the long way so there is time to talk.',
    ],
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=480&q=80',
    accent: GOLD,
    availableNow: false,
    availability: 'Free this evening',
    distanceKm: 6.8,
    matchScore: 79,
    reviewsList: [],
  },

  // ── 21 · Nandini Verma ──────────────────────────────
  {
    id: 'nandini',
    name: 'Nandini Verma',
    firstName: 'Nandini',
    maskedName: 'Nan···',
    city: 'Indore',
    area: 'Saket Nagar',
    age: 27,
    activities: ['Museum', 'Book Browsing', 'Photography Walk'],
    languages: ['Hindi', 'English'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Nandini teaches art history part-time and treats a small municipal museum with exactly the same seriousness as a large one. She is the person you want beside you in a gallery, because she asks what you think before telling you what she thinks.',
    suggestions: [
      'The Central Museum on Agra-Bombay Road: small, oddly wonderful, and almost always empty.',
      'A photography walk through the Sarafa lanes before the stalls open, while the shutters are still down.',
      'An afternoon of bookshops around Saket, ending with coffee and whatever we both bought.',
    ],
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=480&q=80',
    accent: VIOLET,
    sameGenderNote: true,
    availableNow: true,
    availability: 'Free now',
    distanceKm: 3.9,
    matchScore: 77,
    reviewsList: [],
  },

  // ── 22 · Vikrant Chouhan ────────────────────────────
  {
    id: 'vikrant',
    name: 'Vikrant Chouhan',
    firstName: 'Vikrant',
    maskedName: 'Vik···',
    city: 'Indore',
    area: 'Rau',
    age: 34,
    activities: ['Morning Run', 'City Walk', 'Gym Buddy'],
    languages: ['Hindi', 'English'],
    rating: 0,
    reviews: 0,
    ratePerMeeting: 499,
    bio: 'Vikrant drives out past Rau every weekend for the hills, and has been trying to persuade people to come with him for years. Steady, unhurried, and the sort who carries an extra bottle of water for whoever forgot theirs.',
    suggestions: [
      'An early walk out past Rau towards the Mhow road, where the city thins out and the air changes.',
      'A weekend hike up to Janapav, which is a genuine climb and worth the early start.',
      'A gym session followed by the long way home on foot, because that is where the talking happens.',
    ],
    photo: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=480&q=80',
    accent: EMERALD,
    availableNow: false,
    availability: 'Free weekends',
    distanceKm: 11.4,
    matchScore: 74,
    reviewsList: [],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
//
// These take a CITY NAME (`'Mumbai'`), matching `Companion.city`, not a City id.
// Callers holding an id should go through `getCity(id).name`.

export function getCompanion(id: string): Companion | undefined {
  return COMPANIONS.find((c) => c.id === id);
}

/** Everyone who actually lists in this city. Empty for cities we do not serve. */
export function companionsInCity(cityName: string): Companion[] {
  return COMPANIONS.filter((c) => c.city === cityName);
}

/** True when at least one companion lists here. */
export function cityIsLive(cityName: string): boolean {
  return COMPANIONS.some((c) => c.city === cityName);
}

/**
 * The one profile shown unblurred to locked visitors in this city — the teaser
 * that the ₹199 unlock buys the rest of. Falls back to the highest match score
 * when no profile in the city sets `topMatch`, so a new city is never all-blur.
 */
export function topMatchIdFor(cityName: string): string | undefined {
  const inCity = companionsInCity(cityName);
  if (!inCity.length) return undefined;
  const flagged = inCity.find((c) => c.topMatch);
  if (flagged) return flagged.id;
  return inCity.reduce((best, c) => (c.matchScore > best.matchScore ? c : best)).id;
}

/** How many companions in this city are marked free right now. */
export function freeNowCountIn(cityName: string): number {
  return companionsInCity(cityName).filter((c) => c.availableNow).length;
}

/** The teaser profile for the default city. Prefer topMatchIdFor(cityName). */
export const TOP_MATCH_ID = 'ananya';
