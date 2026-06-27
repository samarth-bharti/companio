// Pure data — no logic beyond the two exported helpers.
// 14 Mumbai companions. topMatch:true on id:'ananya' only.
// Bio, suggestions, reviews are strictly platonic per §1.5.

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
  rating: number;
  reviews: number;
  ratePerMeeting: number;
  bio: string;
  suggestions: string[];  // "What we'd do" — 3 city-specific ideas
  photo: string;          // Unsplash portrait URL
  accent: string;         // one of the four theme hex values
  sameGenderNote?: boolean;
  topMatch?: boolean;     // exactly one true (id:'ananya')
  // ── Presence + smart-match fields (mock) ────────────────────────────────────
  availableNow: boolean;   // ~5 true across the dataset
  availability: string;    // e.g. "Free now" | "Free this evening" | …
  distanceKm: number;      // mock 1–12 km
  matchScore: number;      // mock 60–98 compatibility score
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
    rating: 4.9,
    reviews: 124,
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
    reviewsList: [
      {
        name: 'Shreya M.',
        city: 'Mumbai',
        stars: 5,
        text: 'One of the most natural conversations I have had in months. Ananya knows every hidden café in Bandra and made the walk feel like an actual adventure.',
      },
      {
        name: 'Faisal K.',
        city: 'Mumbai',
        stars: 5,
        text: 'Took the museum tour with her, she asked thoughtful questions and never made me feel rushed. Exactly the kind of company I was looking for.',
      },
      {
        name: 'Pooja R.',
        city: 'Pune',
        stars: 4,
        text: 'Lovely company, she was running a few minutes late but messaged ahead so I was not waiting anxiously. The walk itself was worth every minute.',
      },
    ],
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
    rating: 4.8,
    reviews: 87,
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
    reviewsList: [
      {
        name: 'Arjun S.',
        city: 'Mumbai',
        stars: 5,
        text: 'Rohan showed up on time and kept the pace exactly where I needed it. The street-food detour after was the best part, he knows spots I had walked past for years without noticing.',
      },
      {
        name: 'Nidhi V.',
        city: 'Mumbai',
        stars: 5,
        text: 'Gym sessions can feel lonely when you are new to a city. Having Rohan there made the whole routine enjoyable and consistent.',
      },
      {
        name: 'Siddharth L.',
        city: 'Mumbai',
        stars: 4,
        text: 'Good company for the run, he suggested a slightly longer route than planned, which I did not mind, though a heads-up beforehand would have been helpful.',
      },
    ],
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
    rating: 4.9,
    reviews: 102,
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
    reviewsList: [
      {
        name: 'Tara B.',
        city: 'Mumbai',
        stars: 5,
        text: 'Priya has a way of pointing out details you would have walked right past. The Sassoon Dock walk was a completely new side of Mumbai for me.',
      },
      {
        name: 'Meera J.',
        city: 'Delhi',
        stars: 5,
        text: 'I was visiting Mumbai for a week and wanted a proper local perspective. Priya delivered that and more, warm, patient, and genuinely interested in showing the city.',
      },
      {
        name: 'Kavya P.',
        city: 'Bengaluru',
        stars: 4,
        text: 'Great company overall, she arrived a couple of minutes after me but called ahead. The photography walk itself was exactly what I had hoped for.',
      },
    ],
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
    rating: 4.7,
    reviews: 56,
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
    reviewsList: [
      {
        name: 'Riya C.',
        city: 'Mumbai',
        stars: 5,
        text: 'The conversation never had a dull moment. Aarav is the kind of person who listens properly and then says something worth hearing back.',
      },
      {
        name: 'Vikram N.',
        city: 'Hyderabad',
        stars: 5,
        text: 'Was in Mumbai for three days and wanted to explore without feeling like a tourist. Aarav made the whole thing feel effortless.',
      },
      {
        name: 'Sunita G.',
        city: 'Mumbai',
        stars: 4,
        text: 'Very pleasant afternoon. He suggested a café that was a bit farther than I expected, would have been good to know the distance beforehand, but the place itself was worth it.',
      },
    ],
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
    rating: 4.8,
    reviews: 73,
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
    reviewsList: [
      {
        name: 'Kabir M.',
        city: 'Mumbai',
        stars: 5,
        text: 'Zara made the beach run feel like something I would want to do every week. We ended up talking for another hour over breakfast.',
      },
      {
        name: 'Anita T.',
        city: 'Chennai',
        stars: 5,
        text: 'I had never done street food properly in Mumbai and she turned it into a full experience. Every stall was a story.',
      },
      {
        name: 'Dev R.',
        city: 'Mumbai',
        stars: 4,
        text: 'Really good company at the gig, she ran a few minutes late because of the traffic, texted me before I even noticed. Concert was great.',
      },
    ],
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
    rating: 4.9,
    reviews: 210,
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
    reviewsList: [
      {
        name: 'Sunita A.',
        city: 'Mumbai',
        stars: 5,
        text: 'My father loved spending the afternoon with Kiran. He was patient, funny, and genuinely interested in my father\'s stories. We will be booking again.',
      },
      {
        name: 'Ramesh V.',
        city: 'Mumbai',
        stars: 5,
        text: 'After my wife passed I found the quiet difficult. Kiran just walked with me and talked when I wanted to talk. Exactly what I needed.',
      },
      {
        name: 'Nalini S.',
        city: 'Pune',
        stars: 4,
        text: 'Wonderful companion for my mother, he was a few minutes late to the meeting point but called ahead and she was completely at ease. The walk itself was lovely.',
      },
    ],
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
    rating: 4.7,
    reviews: 49,
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
    reviewsList: [
      {
        name: 'Nikhil B.',
        city: 'Mumbai',
        stars: 5,
        text: 'Ishaan took the gym session seriously without making it feel like a competition. Exactly what I needed to get back into the habit.',
      },
      {
        name: 'Preeti H.',
        city: 'Mumbai',
        stars: 5,
        text: 'I had been putting off going to gigs alone for months. He made the whole evening feel natural and genuinely fun.',
      },
      {
        name: 'Ajay D.',
        city: 'Delhi',
        stars: 4,
        text: 'Great company, the gym session was a little shorter than I had expected but the conversation after made up for it.',
      },
    ],
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
    rating: 4.9,
    reviews: 167,
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
    reviewsList: [
      {
        name: 'Lakshmi R.',
        city: 'Mumbai',
        stars: 5,
        text: 'My mother had been hesitant about trying Companio but after one afternoon with Meena she was asking when they could meet again.',
      },
      {
        name: 'Deepa N.',
        city: 'Chennai',
        stars: 5,
        text: 'Meena made me feel like I had found a friend in a city I barely knew. The Matunga filter coffee is now the first thing I recommend to anyone visiting.',
      },
      {
        name: 'Padma K.',
        city: 'Mumbai',
        stars: 4,
        text: 'Lovely afternoon at the bookshop, she got absorbed in a section and we lost track of time a little, which I did not mind but worth knowing she is someone who loses herself in books happily.',
      },
    ],
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
    rating: 4.8,
    reviews: 61,
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
    reviewsList: [
      {
        name: 'Ritu M.',
        city: 'Mumbai',
        stars: 5,
        text: 'Sahil found angles in Versova that I had completely missed despite living nearby. A genuinely eye-opening walk.',
      },
      {
        name: 'Debashish P.',
        city: 'Kolkata',
        stars: 5,
        text: 'The fishing village at dawn was unlike anything I had seen. He has a quiet way of pointing things out that makes you feel like you are actually seeing a place for the first time.',
      },
      {
        name: 'Mira S.',
        city: 'Mumbai',
        stars: 4,
        text: 'Lovely company, the run was a bit longer than described but he checked in throughout and the street food at the end was absolutely worth it.',
      },
    ],
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
    rating: 4.8,
    reviews: 88,
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
    reviewsList: [
      {
        name: 'Suresh L.',
        city: 'Mumbai',
        stars: 5,
        text: 'Deepika knows how to read the mood and pace the outing accordingly. We went slowly and it was exactly right.',
      },
      {
        name: 'Ananya V.',
        city: 'Bengaluru',
        stars: 5,
        text: 'A fellow South Indian in a new city who made me feel at home. The filter coffee conversation lasted two hours and did not feel like it.',
      },
      {
        name: 'Nitin K.',
        city: 'Mumbai',
        stars: 4,
        text: 'Good evening at the gallery, she arrived slightly after me but had already texted ahead. The walk along the Sea Face after was a great call.',
      },
    ],
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
    rating: 4.7,
    reviews: 44,
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
    reviewsList: [
      {
        name: 'Roshan T.',
        city: 'Mumbai',
        stars: 5,
        text: 'I had no idea Chembur had this much to offer. Arjun took me to places that were not on any list and every one of them was good.',
      },
      {
        name: 'Vinod S.',
        city: 'Mumbai',
        stars: 5,
        text: 'A reliable gym partner who does not hover or give unsolicited advice. Just solid company and a good session.',
      },
      {
        name: 'Geeta M.',
        city: 'Navi Mumbai',
        stars: 4,
        text: 'The street food walk was great, one of the stalls he planned to take me to was closed, but he pivoted immediately to somewhere better.',
      },
    ],
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
    rating: 4.8,
    reviews: 38,
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
    reviewsList: [
      {
        name: 'Hina A.',
        city: 'Mumbai',
        stars: 5,
        text: 'Fatima was exactly the kind of running companion I had been hoping to find, encouraging without being pushy, and the creek route was beautiful.',
      },
      {
        name: 'Leila N.',
        city: 'Mumbai',
        stars: 5,
        text: 'The photography walk was a revelation. She noticed things I had walked past a hundred times and pointed them out in a way that made me see the whole street differently.',
      },
      {
        name: 'Sana P.',
        city: 'Mumbai',
        stars: 4,
        text: 'Really enjoyable morning, it was her first Companio meetup so things felt a little tentative at the start, but she settled in quickly and the run itself was great.',
      },
    ],
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
    rating: 4.7,
    reviews: 57,
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
    reviewsList: [
      {
        name: 'Alisha R.',
        city: 'Mumbai',
        stars: 5,
        text: 'Two hours at the bookshop and neither of us wanted to leave. Vivek reads widely and asks good questions, the kind of company that is genuinely stimulating.',
      },
      {
        name: 'Mihir J.',
        city: 'Ahmedabad',
        stars: 5,
        text: 'Was in Mumbai for work and wanted to spend an evening doing something real. Prithvi Theatre with Vivek was exactly that.',
      },
      {
        name: 'Prerna S.',
        city: 'Mumbai',
        stars: 4,
        text: 'Great conversation, he does most of the talking initially, which some people might find a lot, but once I pushed back a little the dynamic became much more balanced and fun.',
      },
    ],
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
    rating: 4.9,
    reviews: 18,
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
    reviewsList: [
      {
        name: 'Rekha P.',
        city: 'Mumbai',
        stars: 5,
        text: 'Nisha took my grandmother on the neighbourhood walk and my grandmother talked about it for a week afterwards. Warmth you cannot manufacture.',
      },
      {
        name: 'Arun K.',
        city: 'Mumbai',
        stars: 5,
        text: 'The museum visit was her idea and it was a genuinely wonderful afternoon. She knows how to make a place feel personal.',
      },
      {
        name: 'Jyoti S.',
        city: 'Nagpur',
        stars: 4,
        text: 'Lovely company, she is newer to Companio so the first few minutes were a little quiet, but once we started walking she was completely at ease and the conversation flowed naturally.',
      },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getCompanion(id: string): Companion | undefined {
  return COMPANIONS.find((c) => c.id === id);
}

export const TOP_MATCH_ID = 'ananya';

/** Number of companions with availableNow: true — static mock value. */
export const FREE_NOW_COUNT = COMPANIONS.filter((c) => c.availableNow).length;
