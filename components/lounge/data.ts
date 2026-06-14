// Mock data for the Lounge feature — strictly platonic.
// No backend; all state lives in client components.

export interface Reaction {
  emoji: string;
  count: number;
  myReact?: boolean;
}

export interface BaseMessage {
  id: string;
  from: string; // 'me' | companionId | arbitrary participant key
  text?: string;
  type?: 'text' | 'voice';
  voiceDuration?: string;
  time: string;
  reactions?: Reaction[];
  dateLabel?: string;
}

export interface LoungeMessage extends BaseMessage {
  authorName: string;
  authorPhoto: string;
}

export interface DirectMessage extends BaseMessage {
  authorName?: string;
  authorPhoto?: string;
}

export interface Lounge {
  id: string;
  name: string;
  emoji: string;
  topic: string;
  memberCount: number;
  onlineCount: number;
  messages: LoungeMessage[];
}

export interface DirectThread {
  companionId: string;
  unread: number;
  messages: DirectMessage[];
}

// ── Photo shortcuts ────────────────────────────────────────────────────────────
const P = {
  ananya:  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=70',
  rohan:   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=70',
  priya:   'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=70',
  zara:    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=70',
  deepika: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&q=70',
  aarav:   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=70',
  ishaan:  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=80&q=70',
  sahil:   'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=80&q=70',
  meena:   'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=80&q=70',
  fatima:  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&q=70',
};

// ── 6 Lounges ─────────────────────────────────────────────────────────────────

export const LOUNGES: Lounge[] = [
  {
    id: 'runners',
    name: 'Mumbai Morning Runners',
    emoji: '🏃',
    topic: 'Early runs, scenic routes, post-run chai spots around Mumbai',
    memberCount: 38,
    onlineCount: 9,
    messages: [
      { id: 'r1', from: 'rohan', authorName: 'Rohan', authorPhoto: P.rohan, text: 'Versova beach at 6 AM tomorrow, who is in?', time: '7:02 AM', dateLabel: 'Today' },
      { id: 'r2', from: 'zara', authorName: 'Zara', authorPhoto: P.zara, text: 'I am in! The light is incredible there at dawn.', time: '7:04 AM', reactions: [{ emoji: '🔥', count: 3 }] },
      { id: 'r3', from: 'sahil', authorName: 'Sahil', authorPhoto: P.sahil, text: 'Count me in too. I will bring the coconut water stall tip.', time: '7:06 AM' },
      { id: 'r4', from: 'rohan', authorName: 'Rohan', authorPhoto: P.rohan, text: 'Perfect. Meeting at the parking lot entry. 5:55 to warm up.', time: '7:09 AM' },
      { id: 'r5', from: 'fatima', authorName: 'Fatima', authorPhoto: P.fatima, text: 'Wish I could join but I have the Malad creek run tomorrow. Same time next week?', time: '7:12 AM', reactions: [{ emoji: '👍', count: 2 }] },
      { id: 'r6', from: 'zara', authorName: 'Zara', authorPhoto: P.zara, text: 'Fatima, yes! Let\'s also do a combined route one weekend.', time: '7:14 AM' },
      { id: 'r7', from: 'sahil', authorName: 'Sahil', authorPhoto: P.sahil, text: 'Anyone tried the Bandra bandstand stretch for intervals? The path is long and flat.', time: '7:18 AM' },
      { id: 'r8', from: 'rohan', authorName: 'Rohan', authorPhoto: P.rohan, text: 'Yes, great for tempo runs. The sea breeze keeps it cooler too.', time: '7:20 AM', reactions: [{ emoji: '❤️', count: 4 }] },
      { id: 'r9', from: 'fatima', authorName: 'Fatima', authorPhoto: P.fatima, text: 'Adding that to my list. See you all on the next group run!', time: '7:22 AM' },
    ],
  },
  {
    id: 'cafe',
    name: 'Café & Conversation',
    emoji: '☕',
    topic: 'Best cafés, slow afternoons, long talks, Mumbai\'s hidden coffee gems',
    memberCount: 54,
    onlineCount: 14,
    messages: [
      { id: 'c1', from: 'ananya', authorName: 'Ananya', authorPhoto: P.ananya, text: 'Found a tiny place in Kala Ghoda that does filter coffee properly. Irani-style but South Indian beans.', time: '2:15 PM', dateLabel: 'Today', reactions: [{ emoji: '😄', count: 5 }] },
      { id: 'c2', from: 'meena', authorName: 'Meena', authorPhoto: P.meena, text: 'Please share the name! Café Madras in Matunga is my usual but always open to a new one.', time: '2:18 PM' },
      { id: 'c3', from: 'aarav', authorName: 'Aarav', authorPhoto: P.aarav, text: 'I went to Kala Ghoda Café last Sunday, the reading corner upstairs is very good for a long afternoon.', time: '2:21 PM', reactions: [{ emoji: '👍', count: 3 }] },
      { id: 'c4', from: 'ananya', authorName: 'Ananya', authorPhoto: P.ananya, text: 'It is on Ropewalk Lane, no signboard, just a door with a small chai cup painted on it.', time: '2:24 PM' },
      { id: 'c5', from: 'deepika', authorName: 'Deepika', authorPhoto: P.deepika, text: 'I love places with no signboard. The best ones never need one.', time: '2:26 PM', reactions: [{ emoji: '❤️', count: 6 }] },
      { id: 'c6', from: 'meena', authorName: 'Meena', authorPhoto: P.meena, text: 'Aarav, what do you order at Kala Ghoda Café? I always second-guess myself there.', time: '2:30 PM' },
      { id: 'c7', from: 'aarav', authorName: 'Aarav', authorPhoto: P.aarav, text: 'Cold brew and the banana bread. Skip the croissants, they are good but the banana bread is special.', time: '2:33 PM', reactions: [{ emoji: '🙌', count: 4 }] },
      { id: 'c8', from: 'ananya', authorName: 'Ananya', authorPhoto: P.ananya, text: 'Anyone up for a café crawl this Saturday? Two or three spots in Bandra, ending at Prithvi?', time: '2:37 PM' },
      { id: 'c9', from: 'deepika', authorName: 'Deepika', authorPhoto: P.deepika, text: 'Yes, put me down for Saturday. I will suggest the third stop.', time: '2:39 PM', reactions: [{ emoji: '🔥', count: 2 }] },
      { id: 'c10', from: 'aarav', authorName: 'Aarav', authorPhoto: P.aarav, text: 'I am in. 10 AM start?', time: '2:41 PM' },
    ],
  },
  {
    id: 'trekkers',
    name: 'Weekend Trekkers',
    emoji: '⛰️',
    topic: 'Day treks near Mumbai, Sanjay Gandhi NP, Matheran, Karnala & more',
    memberCount: 29,
    onlineCount: 7,
    messages: [
      { id: 't1', from: 'ishaan', authorName: 'Ishaan', authorPhoto: P.ishaan, text: 'Karnala Fort next Saturday, 2 hrs from CST, easy-moderate trail. Anybody?', time: '8:45 AM', dateLabel: 'Today' },
      { id: 't2', from: 'sahil', authorName: 'Sahil', authorPhoto: P.sahil, text: 'I have been meaning to do Karnala for months. How long is the trail?', time: '8:48 AM' },
      { id: 't3', from: 'ishaan', authorName: 'Ishaan', authorPhoto: P.ishaan, text: 'About 3 km up. Summit has a ruined fort, worth it. Leave by 7 AM to beat the heat.', time: '8:51 AM', reactions: [{ emoji: '👍', count: 5 }] },
      { id: 't4', from: 'rohan', authorName: 'Rohan', authorPhoto: P.rohan, text: 'I can join. What is the meet point, Panvel station?', time: '8:55 AM' },
      { id: 't5', from: 'ishaan', authorName: 'Ishaan', authorPhoto: P.ishaan, text: 'Yes, Panvel platform 1 at 7:15. We share an auto to the trailhead.', time: '8:58 AM' },
      { id: 't6', from: 'fatima', authorName: 'Fatima', authorPhoto: P.fatima, text: 'What shoes are needed? I only have light running shoes.', time: '9:02 AM' },
      { id: 't7', from: 'sahil', authorName: 'Sahil', authorPhoto: P.sahil, text: 'Running shoes work fine for Karnala, trail is rocky but not technical.', time: '9:04 AM', reactions: [{ emoji: '🙌', count: 3 }] },
      { id: 't8', from: 'ishaan', authorName: 'Ishaan', authorPhoto: P.ishaan, text: 'Bring 1.5 L water and a snack. There is a stall at the base but nothing on the trail.', time: '9:07 AM' },
      { id: 't9', from: 'rohan', authorName: 'Rohan', authorPhoto: P.rohan, text: 'I will pack extra energy bars. Anyone need a rain jacket? Forecast looks clear but Panvel is unpredictable.', time: '9:10 AM', reactions: [{ emoji: '❤️', count: 2 }] },
    ],
  },
  {
    id: 'gym',
    name: 'Gym Buddies',
    emoji: '💪',
    topic: 'Workout plans, gym spots, form tips, accountability without pressure',
    memberCount: 21,
    onlineCount: 5,
    messages: [
      { id: 'g1', from: 'rohan', authorName: 'Rohan', authorPhoto: P.rohan, text: 'Anyone tried the gym at Andheri Sports Complex? The weights section is actually well maintained.', time: '6:30 AM', dateLabel: 'Today' },
      { id: 'g2', from: 'ishaan', authorName: 'Ishaan', authorPhoto: P.ishaan, text: 'Yes, I trained there last month. Avoid peak hours (7-9 AM), otherwise it is fine.', time: '6:33 AM' },
      { id: 'g3', from: 'rohan', authorName: 'Rohan', authorPhoto: P.rohan, text: 'Good to know. I usually go at 6 so peak is not an issue.', time: '6:35 AM', reactions: [{ emoji: '💪', count: 4 }] },
      { id: 'g4', from: 'ishaan', authorName: 'Ishaan', authorPhoto: P.ishaan, text: 'Accountability check, who hit their weekly target this week?', time: '6:40 AM' },
      { id: 'g5', from: 'rohan', authorName: 'Rohan', authorPhoto: P.rohan, text: '4 of 4 sessions. Skipped nothing.', time: '6:41 AM', reactions: [{ emoji: '🔥', count: 6 }] },
      { id: 'g6', from: 'fatima', authorName: 'Fatima', authorPhoto: P.fatima, text: '3 of 4 for me, missed Friday but did an extra long run instead.', time: '6:44 AM', reactions: [{ emoji: '👍', count: 3 }] },
      { id: 'g7', from: 'ishaan', authorName: 'Ishaan', authorPhoto: P.ishaan, text: 'That counts. Rest is also training.', time: '6:46 AM' },
      { id: 'g8', from: 'rohan', authorName: 'Rohan', authorPhoto: P.rohan, text: 'Question, anybody warming up properly? I see a lot of people skip it completely.', time: '6:50 AM' },
      { id: 'g9', from: 'ishaan', authorName: 'Ishaan', authorPhoto: P.ishaan, text: '10 minutes minimum. Dynamic stretches, not static. Static after training.', time: '6:52 AM', reactions: [{ emoji: '🙌', count: 5 }] },
    ],
  },
  {
    id: 'foodies',
    name: 'Bandra Foodies',
    emoji: '🍜',
    topic: 'The best eats in Bandra, from tapris to sit-down, all budgets',
    memberCount: 67,
    onlineCount: 19,
    messages: [
      { id: 'f1', from: 'ananya', authorName: 'Ananya', authorPhoto: P.ananya, text: 'The pav bhaji cart behind St. Andrews is back after the monsoon. Queue starts at 7.', time: '6:05 PM', dateLabel: 'Today', reactions: [{ emoji: '😄', count: 8 }] },
      { id: 'f2', from: 'zara', authorName: 'Zara', authorPhoto: P.zara, text: 'I have been waiting for this news for three months.', time: '6:07 PM', reactions: [{ emoji: '❤️', count: 5 }] },
      { id: 'f3', from: 'deepika', authorName: 'Deepika', authorPhoto: P.deepika, text: 'Is the malai kulfi place on Hill Road still open? I walked by last weekend and it looked closed.', time: '6:09 PM' },
      { id: 'f4', from: 'ananya', authorName: 'Ananya', authorPhoto: P.ananya, text: 'Still open, they just moved 3 doors down. New sign says "Kulfi Corner" now.', time: '6:12 PM' },
      { id: 'f5', from: 'zara', authorName: 'Zara', authorPhoto: P.zara, text: 'Anyone for a spontaneous Bandra food walk this Sunday evening?', time: '6:15 PM', reactions: [{ emoji: '🔥', count: 7 }] },
      { id: 'f6', from: 'ananya', authorName: 'Ananya', authorPhoto: P.ananya, text: 'Yes, start at Linking Road tapri for chai, end at the pav bhaji cart?', time: '6:17 PM' },
      { id: 'f7', from: 'deepika', authorName: 'Deepika', authorPhoto: P.deepika, text: 'Perfect route. I will add the new Thai place on Chapel Road as a dinner backup.', time: '6:20 PM', reactions: [{ emoji: '👍', count: 4 }] },
      { id: 'f8', from: 'zara', authorName: 'Zara', authorPhoto: P.zara, text: 'Sunday 5 PM at Linking Road junction then. RSVP here so I know how many.', time: '6:22 PM' },
      { id: 'f9', from: 'ananya', authorName: 'Ananya', authorPhoto: P.ananya, text: 'Count me in. And I know a shortcut through the lanes that avoids the Sunday traffic.', time: '6:25 PM', reactions: [{ emoji: '🙌', count: 3 }] },
    ],
  },
  {
    id: 'books',
    name: 'Bookworms',
    emoji: '📚',
    topic: 'What we are reading, recommendations, swap, and slow Kitab Khana afternoons',
    memberCount: 43,
    onlineCount: 11,
    messages: [
      { id: 'b1', from: 'aarav', authorName: 'Aarav', authorPhoto: P.aarav, text: 'Finished Tenth of December by George Saunders last night. Short stories but each one hits hard.', time: '9:10 PM', dateLabel: 'Yesterday' },
      { id: 'b2', from: 'meena', authorName: 'Meena', authorPhoto: P.meena, text: 'I loved that collection. "The Semplica Girl Diaries" in particular.', time: '9:14 PM', reactions: [{ emoji: '❤️', count: 4 }] },
      { id: 'b3', from: 'ananya', authorName: 'Ananya', authorPhoto: P.ananya, text: 'Adding it to the list. I just started Manto\'s selected stories, incredible and uncomfortable in the best way.', time: '9:18 PM' },
      { id: 'b4', from: 'aarav', authorName: 'Aarav', authorPhoto: P.aarav, text: 'Manto is essential. Which translation are you reading?', time: '9:20 PM' },
      { id: 'b5', from: 'ananya', authorName: 'Ananya', authorPhoto: P.ananya, text: 'Muhammad Umar Memon\'s. Found it at Kitab Khana, only one copy left when I picked it up.', time: '9:23 PM', reactions: [{ emoji: '🙌', count: 3 }] },
      { id: 'b6', from: 'meena', authorName: 'Meena', authorPhoto: P.meena, text: 'Is anyone interested in a monthly meetup at Strand? First Sunday, 3 PM?', time: '9:28 PM', reactions: [{ emoji: '🔥', count: 5 }] },
      { id: 'b7', from: 'aarav', authorName: 'Aarav', authorPhoto: P.aarav, text: 'That would be wonderful. We each bring one book we have been wanting to talk about.', time: '9:30 PM' },
      { id: 'b8', from: 'ananya', authorName: 'Ananya', authorPhoto: P.ananya, text: 'I am in. Strand has that back corner with the chairs, perfect for this.', time: '9:32 PM', reactions: [{ emoji: '👍', count: 6 }] },
      { id: 'b9', from: 'meena', authorName: 'Meena', authorPhoto: P.meena, text: 'First Sunday of next month then. I will post a reminder here a week before.', time: '9:35 PM' },
    ],
  },
];

// ── 5 Direct Threads ───────────────────────────────────────────────────────────

export const DIRECT_THREADS: DirectThread[] = [
  {
    companionId: 'ananya',
    unread: 2,
    messages: [
      { id: 'd_a1', from: 'ananya', text: 'Hey! Saw you booked a city walk for Saturday, so glad.', time: '10:30 AM', dateLabel: 'Today' },
      { id: 'd_a2', from: 'me', text: 'Yes, really looking forward to it! Any tips for what to wear?', time: '10:33 AM' },
      { id: 'd_a3', from: 'ananya', text: 'Comfortable walking shoes, the Kala Ghoda lanes are cobblestone. Light clothes, bring a water bottle.', time: '10:36 AM', reactions: [{ emoji: '👍', count: 1 }] },
      { id: 'd_a4', from: 'me', text: 'Got it. What time exactly are we meeting?', time: '10:38 AM' },
      { id: 'd_a5', from: 'ananya', text: 'The booking says 9 AM at the NGMA entrance. I will be there at 8:55, never late for a walk!', time: '10:40 AM', reactions: [{ emoji: '😄', count: 1 }] },
      { id: 'd_a6', from: 'ananya', type: 'voice', voiceDuration: '0:18', time: '10:42 AM' },
      { id: 'd_a7', from: 'ananya', text: 'That voice note was me describing the first stop, the old customs house archway. Trust me, it is worth it.', time: '10:43 AM' },
    ],
  },
  {
    companionId: 'rohan',
    unread: 0,
    messages: [
      { id: 'd_r1', from: 'me', text: 'Rohan, I wanted to do the morning run this week. What route do you usually take?', time: '6:15 AM', dateLabel: 'Today' },
      { id: 'd_r2', from: 'rohan', text: 'Hey! Usually Versova beach, 5 km loop, flat and scenic. Perfect for your pace.', time: '6:20 AM' },
      { id: 'd_r3', from: 'me', text: 'That sounds great. Is 6 AM too early?', time: '6:22 AM' },
      { id: 'd_r4', from: 'rohan', text: '6 is actually perfect. Best hour at the beach, almost no crowd and the light is something else.', time: '6:25 AM', reactions: [{ emoji: '❤️', count: 1 }] },
      { id: 'd_r5', from: 'rohan', type: 'voice', voiceDuration: '0:34', time: '6:27 AM' },
      { id: 'd_r6', from: 'me', text: 'That tip about the coconut water stall is perfect, I will look for it after the run.', time: '6:30 AM' },
      { id: 'd_r7', from: 'rohan', text: 'You cannot miss it, blue cart, right at the fishing village entry. The owner has been there 20 years.', time: '6:32 AM', reactions: [{ emoji: '🔥', count: 1 }] },
    ],
  },
  {
    companionId: 'priya',
    unread: 1,
    messages: [
      { id: 'd_p1', from: 'priya', text: 'The Sassoon Dock walk is confirmed for Sunday dawn, are you still on?', time: '8:00 PM', dateLabel: 'Yesterday' },
      { id: 'd_p2', from: 'me', text: 'Absolutely on. What time should I be there?', time: '8:05 PM' },
      { id: 'd_p3', from: 'priya', text: '6:15 AM at the dock gate. The fishing boats come in around 6:30, that is the window we want.', time: '8:08 PM' },
      { id: 'd_p4', from: 'me', text: 'Do I need to bring a camera or will my phone work?', time: '8:11 PM' },
      { id: 'd_p5', from: 'priya', text: 'Phone is more than enough, honestly the light does all the work. Just be ready to move quickly between shots.', time: '8:14 PM', reactions: [{ emoji: '📸', count: 1 }] },
      { id: 'd_p6', from: 'priya', type: 'voice', voiceDuration: '0:22', time: '8:17 PM' },
      { id: 'd_p7', from: 'priya', text: 'See you Sunday! It will be one of those mornings you remember.', time: '8:18 PM', reactions: [{ emoji: '❤️', count: 1 }] },
    ],
  },
  {
    companionId: 'zara',
    unread: 0,
    messages: [
      { id: 'd_z1', from: 'me', text: 'Hey Zara, the live music evening sounds great. Which venue are you thinking?', time: '4:00 PM', dateLabel: 'Today' },
      { id: 'd_z2', from: 'zara', text: 'There is a good set at Blue Frog this Friday, an indie act, small crowd. Very chill vibe.', time: '4:05 PM' },
      { id: 'd_z3', from: 'me', text: 'Friday works! What time does it start?', time: '4:07 PM' },
      { id: 'd_z4', from: 'zara', text: 'Doors at 7:30, set starts at 8:30. I always get there early to get a good spot near the stage.', time: '4:10 PM', reactions: [{ emoji: '🎵', count: 1 }] },
      { id: 'd_z5', from: 'zara', type: 'voice', voiceDuration: '0:28', time: '4:12 PM' },
      { id: 'd_z6', from: 'me', text: 'That sounds perfect, meet at the entrance at 7:20?', time: '4:15 PM' },
      { id: 'd_z7', from: 'zara', text: 'Perfect. I will be the one in the yellow jacket, very easy to spot!', time: '4:17 PM', reactions: [{ emoji: '😄', count: 1 }] },
    ],
  },
  {
    companionId: 'deepika',
    unread: 3,
    messages: [
      { id: 'd_d1', from: 'deepika', text: 'I checked the listings for Prithvi, there is a Malayalam play on Saturday with English subtitles. Supposed to be very good.', time: '3:00 PM', dateLabel: 'Today' },
      { id: 'd_d2', from: 'deepika', text: 'The Worli Sea Face walk before would be ideal, 5 PM Sea Face, theatre at 7:30.', time: '3:02 PM' },
      { id: 'd_d3', from: 'deepika', type: 'voice', voiceDuration: '0:41', time: '3:05 PM' },
      { id: 'd_d4', from: 'deepika', text: 'Let me know if you want me to book tickets, I know the box office will sell out.', time: '3:06 PM', reactions: [{ emoji: '🙌', count: 1 }] },
      { id: 'd_d5', from: 'deepika', text: 'Also, after the play, Prithvi Café is open late. Their chai in the courtyard is worth staying for.', time: '3:08 PM', reactions: [{ emoji: '❤️', count: 1 }] },
    ],
  },
];
