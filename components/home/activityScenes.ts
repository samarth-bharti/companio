/**
 * The five scenes of the "one day, with company" chapter, shared by the desktop
 * horizontal scene (ActivityChapter) and the phone carousel
 * (ActivityChapterMobile) so the two renderings can never drift apart.
 */

export interface Scene {
  eyebrow: string;
  title: string;
  hook: string;
  photo: { src: string; alt: string };
  chips: string[];
  dark?: boolean;
}

/** Day-phase backgrounds, dawn → golden hour. Indexes match SCENES. */
export const GRADIENTS = [
  'linear-gradient(140deg,#FFF3E0,#FFE0B0)',
  'linear-gradient(140deg,#EBF1FF,#CFE0FF)',
  'linear-gradient(140deg,#FFF8EC,#F3E8D6)',
  'linear-gradient(140deg,#1E1840,#2E1F5E)',
  'linear-gradient(140deg,#FFF3E0,#E6F5EE)',
];

export const SCENES: Scene[] = [
  {
    eyebrow: 'Dawn',
    title: 'City Walk',
    hook: 'Start the day with a walk and someone who actually knows the lanes.',
    photo: {
      src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80',
      alt: 'Group of friends laughing together on a city street',
    },
    chips: ['Marine Drive loop', 'Cutting chai', 'Old-city lanes'],
    dark: false,
  },
  {
    eyebrow: 'Morning',
    title: 'Gym Buddy',
    hook: 'The partner who actually shows up. Every time.',
    photo: {
      src: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80',
      alt: 'Two people working out together at a gym',
    },
    chips: ['Spotting partner', '5k runs', 'Post-workout smoothie'],
    dark: false,
  },
  {
    eyebrow: 'Midday',
    title: 'Café Chat',
    hook: 'Two cups of chai, one long conversation. No rush.',
    photo: {
      src: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200&q=80',
      alt: 'Two friends having an animated conversation at a café',
    },
    chips: ['Filter coffee', 'Book swap', 'People-watching'],
    dark: false,
  },
  {
    eyebrow: 'Evening',
    title: 'Events',
    hook: "Nobody should skip the gig just because they'd go alone.",
    photo: {
      src: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&q=80',
      alt: 'Friends enjoying a live music concert together',
    },
    chips: ['Live gigs', 'Stand-up nights', 'Theatre'],
    dark: true,
  },
  {
    eyebrow: 'Golden hour',
    title: 'Elder Company',
    hook: 'An unhurried afternoon. A patient ear. Warm, familiar company.',
    photo: {
      src: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&q=80',
      alt: 'Two adults in a warm, supportive conversation across a table',
    },
    chips: ['Park benches', 'Old stories', 'Evening walks'],
    dark: false,
  },
];
