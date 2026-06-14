// Feed mock data — strictly platonic, activity-focused.
// Types are exported so PostCard subtypes can narrow cleanly.

export type PostType = 'activity' | 'event' | 'photo';

export interface FeedAuthor {
  name: string;
  avatar: string;
  area: string;
}

export interface FeedComment {
  id: string;
  author: string;
  text: string;
}

interface BasePost {
  id: string;
  type: PostType;
  author: FeedAuthor;
  timeAgo: string;
  activityTag: string;
  reactions: number;
  comments: FeedComment[];
}

export interface ActivityPost extends BasePost {
  type: 'activity';
  text: string;
  spotsLeft?: number;
  goingCount: number;
  /** Mock badge: "X joined in the last hour" */
  joinedLastHour?: number;
}

export interface EventPost extends BasePost {
  type: 'event';
  title: string;
  dateTime: string;
  place: string;
  goingCount: number;
  goingAvatars: string[];
  /** Mock badge: "X joined in the last hour" */
  joinedLastHour?: number;
}

export interface PhotoPost extends BasePost {
  type: 'photo';
  caption: string;
  images: string[];
  likeCount: number;
  verifiedMeetup: boolean;
}

export type FeedPost = ActivityPost | EventPost | PhotoPost;

// ── Avatar shortcuts ────────────────────────────────────────────────────────
const AV = {
  ananya: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80',
  rohan:  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
  priya:  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80',
  aarav:  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80',
  zara:   'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80',
  kiran:  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&q=80',
};

export const SEED_POSTS: FeedPost[] = [
  {
    id: 'p1', type: 'activity',
    author: { name: 'Rohan Desai', avatar: AV.rohan, area: 'Andheri West' },
    timeAgo: '18 min ago', activityTag: 'Morning Run', reactions: 11,
    goingCount: 5, spotsLeft: 3, joinedLastHour: 3,
    text: 'Forming a Sunday morning trek group to Sanjay Gandhi park, 3 spots left! Starting 6:30 AM from Borivali gate. Easy trail, 2 hrs, chai after.',
    comments: [
      { id: 'c1', author: 'Zara S.', text: 'Joining! Love the Borivali trail.' },
      { id: 'c2', author: 'Nidhi V.', text: 'Count me in for the chai part at minimum 😄' },
    ],
  },
  {
    id: 'p2', type: 'event',
    author: { name: 'Aarav Mehta', avatar: AV.aarav, area: 'Powai' },
    timeAgo: '1 hr ago', activityTag: 'Café Chat', reactions: 8, goingCount: 7, joinedLastHour: 4,
    title: 'Chess + Filter Coffee at Blue Tokai',
    dateTime: 'Sat 15 Jun · 5:00 PM', place: 'Blue Tokai, Powai',
    goingAvatars: [AV.ananya, AV.priya, AV.zara, AV.kiran],
    comments: [
      { id: 'c3', author: 'Riya C.', text: 'Finally! Been wanting to do this for weeks.' },
    ],
  },
  {
    id: 'p3', type: 'photo',
    author: { name: 'Ananya Iyer', avatar: AV.ananya, area: 'Bandra West' },
    timeAgo: '2 hrs ago', activityTag: 'City Walk', reactions: 34,
    likeCount: 34, verifiedMeetup: true,
    caption: 'Kala Ghoda art walk with the most curious group of people. Three hours felt like thirty minutes. Come for the art, stay for the conversations ✨',
    images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=640&q=80'],
    comments: [
      { id: 'c4', author: 'Meera J.', text: 'This looks incredible. Missed it again!' },
      { id: 'c5', author: 'Tara B.', text: 'The route Ananya picks is always perfect.' },
    ],
  },
  {
    id: 'p4', type: 'activity',
    author: { name: 'Zara Sheikh', avatar: AV.zara, area: 'Juhu' },
    timeAgo: '3 hrs ago', activityTag: 'Morning Run', reactions: 15,
    goingCount: 4, spotsLeft: 4,
    text: "Sunrise beach run this Saturday at Juhu, who's in? 6 AM sharp at the lifeguard post near JVPD. Flat 5K, all paces welcome, pani puri after 🌅",
    comments: [
      { id: 'c6', author: 'Kabir M.', text: 'Already sold on the pani puri. 6 AM confirmed.' },
    ],
  },
  {
    id: 'p5', type: 'event',
    author: { name: 'Priya Nair', avatar: AV.priya, area: 'Colaba' },
    timeAgo: '4 hrs ago', activityTag: 'Book Browsing', reactions: 19, goingCount: 6,
    title: 'Saturday Bookshop Meetup, Kitab Khana',
    dateTime: 'Sat 15 Jun · 3:30 PM', place: 'Kitab Khana, Fort',
    goingAvatars: [AV.rohan, AV.aarav, AV.kiran],
    comments: [
      { id: 'c7', author: 'Vikram N.', text: 'Kitab Khana on a Saturday is just perfect.' },
      { id: 'c8', author: 'Sunita G.', text: 'Will there be tea? Please say yes.' },
    ],
  },
  {
    id: 'p6', type: 'photo',
    author: { name: 'Kiran Patil', avatar: AV.kiran, area: 'Dadar' },
    timeAgo: '5 hrs ago', activityTag: 'Café Chat', reactions: 22,
    likeCount: 22, verifiedMeetup: true,
    caption: 'Sunday chai + board games at the Irani café. Four strangers, two hours, one very competitive round of Scrabble. This is exactly why I joined Companio.',
    images: ['https://images.unsplash.com/photo-1553481187-be93c21490a9?w=640&q=80'],
    comments: [
      { id: 'c9', author: 'Ramesh V.', text: 'That Scrabble game is legendary now 😂' },
    ],
  },
  {
    id: 'p7', type: 'activity',
    author: { name: 'Ananya Iyer', avatar: AV.ananya, area: 'Bandra West' },
    timeAgo: '6 hrs ago', activityTag: 'Museum', reactions: 9,
    goingCount: 2, spotsLeft: 5,
    text: "Heading to CSMVS this Sunday afternoon, solo museum visits feel lonely. Anyone want to explore together? No agenda, just slow looking and good talk.",
    comments: [
      { id: 'c10', author: 'Priya N.', text: "I've been meaning to go for months. Count me in!" },
    ],
  },
  {
    id: 'p8', type: 'event',
    author: { name: 'Rohan Desai', avatar: AV.rohan, area: 'Andheri West' },
    timeAgo: '8 hrs ago', activityTag: 'Street Food Tour', reactions: 27, goingCount: 9,
    title: 'Versova Street Food Trail, Saturday Night',
    dateTime: 'Sat 15 Jun · 7:30 PM', place: 'Versova Jetty, Andheri',
    goingAvatars: [AV.zara, AV.priya, AV.ananya, AV.aarav],
    comments: [
      { id: 'c11', author: 'Arjun S.', text: "Rohan's food trails are legendary. Not missing this!" },
      { id: 'c12', author: 'Anita T.', text: 'Finally a proper evening plan. Confirmed!' },
    ],
  },
  {
    id: 'p9', type: 'photo',
    author: { name: 'Zara Sheikh', avatar: AV.zara, area: 'Juhu' },
    timeAgo: '10 hrs ago', activityTag: 'Morning Run', reactions: 41,
    likeCount: 41, verifiedMeetup: true,
    caption: "First run of June done! 5K with three of the most motivating people I've met on here. The sky looked like this the whole time. No filter needed 🌤️",
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=640&q=80'],
    comments: [
      { id: 'c13', author: 'Dev R.', text: "That sky!! When's the next one?" },
      { id: 'c14', author: 'Kabir M.', text: 'Wish I was there. Setting an alarm for next Saturday.' },
    ],
  },
  {
    id: 'p10', type: 'event',
    author: { name: 'Kiran Patil', avatar: AV.kiran, area: 'Dadar' },
    timeAgo: 'Yesterday', activityTag: 'Yoga', reactions: 16, goingCount: 12,
    title: 'Sunday Yoga in Shivaji Park, Open to All',
    dateTime: 'Sun 16 Jun · 7:00 AM', place: 'Shivaji Park, Dadar',
    goingAvatars: [AV.ananya, AV.zara, AV.rohan],
    comments: [
      { id: 'c15', author: 'Nalini S.', text: 'The best way to start a Sunday. See you there!' },
    ],
  },
  {
    id: 'p11', type: 'activity',
    author: { name: 'Aarav Mehta', avatar: AV.aarav, area: 'Powai' },
    timeAgo: 'Yesterday', activityTag: 'City Walk', reactions: 13,
    goingCount: 3,
    text: 'Quiet evening walk around Powai Lake, the light hits the water perfectly at 6:30 PM. Low-key, no fixed pace, bring a flask of coffee if you like.',
    comments: [
      { id: 'c16', author: 'Riya C.', text: 'Powai Lake in the evening is so underrated.' },
      { id: 'c17', author: 'Sunita G.', text: 'Flask of coffee, already packing it 😄' },
    ],
  },
  {
    id: 'p12', type: 'photo',
    author: { name: 'Priya Nair', avatar: AV.priya, area: 'Colaba' },
    timeAgo: '2 days ago', activityTag: 'Photography Walk', reactions: 55,
    likeCount: 55, verifiedMeetup: true,
    caption: 'Sassoon Dock at 6 AM with a group that actually got up to make it. The fishing boats, the light, the chai at the end. Honestly perfect.',
    images: ['https://images.unsplash.com/photo-1587474260584-136574528ed5?w=640&q=80'],
    comments: [
      { id: 'c18', author: 'Tara B.', text: "I've done this walk twice now and it never gets old." },
      { id: 'c19', author: 'Meera J.', text: 'The colours in this photo! When is the next one, Priya?' },
    ],
  },
  {
    id: 'p13', type: 'activity',
    author: { name: 'Zara Sheikh', avatar: AV.zara, area: 'Juhu' },
    timeAgo: '2 days ago', activityTag: 'Live Events', reactions: 18,
    goingCount: 6, spotsLeft: 2,
    text: 'Intimate live jazz set at a Bandra venue tonight, 2 spots left if anyone wants to join. 8:30 PM, ₹350 cover, bring good conversation energy.',
    comments: [
      { id: 'c20', author: 'Dev R.', text: 'On my way! Grabbing the last spot.' },
    ],
  },
];
