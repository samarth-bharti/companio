// Quiz question definitions + empathy-echo copy bank.
// No JSX — safe to import from both server and client.

export type QuestionType = 'city' | 'multi' | 'single' | 'comfort' | 'name-input';

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizQuestionDef {
  key: string;
  label: string;       // SegmentedPill label
  title: string;       // big Fraunces heading
  bubble: string;      // conversational avatar bubble
  type: QuestionType;
  options?: QuizOption[];
}

export const QUIZ_STEPS = ['City', 'You', 'Time', 'Listen', 'Languages', 'Comfort', 'Name'] as const;

export const QUESTIONS: QuizQuestionDef[] = [
  {
    key: 'city',
    label: 'City',
    title: 'Where are we meeting people?',
    bubble: 'Which city should we search in?',
    type: 'city',
  },
  {
    key: 'activities',
    label: 'You',
    title: 'What do you miss doing with someone?',
    bubble: 'What kinds of outings feel good with the right company?',
    type: 'multi',
    options: [
      { id: 'walks', label: 'Morning walks' },
      { id: 'gym', label: 'Gym & runs' },
      { id: 'cafe', label: 'Café & chai' },
      { id: 'events', label: 'Live events' },
      { id: 'exploring', label: 'Exploring the city' },
      { id: 'talking', label: 'Just talking' },
    ],
  },
  {
    key: 'time',
    label: 'Time',
    title: 'When are you usually free?',
    bubble: 'When does your calendar actually have room?',
    type: 'single',
    options: [
      { id: 'weekday-eves', label: 'Weekday evenings' },
      { id: 'weekends', label: 'Weekends' },
      { id: 'mornings', label: 'Mornings' },
      { id: 'flexible', label: 'Flexible' },
    ],
  },
  {
    key: 'listen',
    label: 'Listen',
    title: "In good company, you're more of a…",
    bubble: "When you're with someone good, what comes naturally?",
    type: 'single',
    options: [
      { id: 'listener', label: 'A listener' },
      { id: 'talker', label: 'A talker' },
      { id: 'both', label: 'Depends on the day' },
    ],
  },
  {
    key: 'languages',
    label: 'Languages',
    title: 'Which languages feel like home?',
    bubble: "We'll find people you can talk to naturally.",
    type: 'multi',
    options: [
      { id: 'hindi', label: 'Hindi' },
      { id: 'english', label: 'English' },
      { id: 'marathi', label: 'Marathi' },
      { id: 'tamil', label: 'Tamil' },
      { id: 'telugu', label: 'Telugu' },
      { id: 'bengali', label: 'Bengali' },
      { id: 'kannada', label: 'Kannada' },
      { id: 'gujarati', label: 'Gujarati' },
    ],
  },
  {
    key: 'comfort',
    label: 'Comfort',
    title: 'Anything that would make you more comfortable?',
    bubble: 'Your comfort is the whole point. What matters to you?',
    type: 'comfort',
  },
  {
    key: 'name',
    label: 'Name',
    title: 'Last one, what should we call you?',
    bubble: "Almost there. What's your name?",
    type: 'name-input',
  },
];

// ── Answers shape ─────────────────────────────────────────────────────────────

export interface QuizAnswers {
  city: string;
  activities: string[];
  time: string;
  listen: string;
  languages: string[];
  comfort: { sameGender: boolean; publicPlaces: boolean };
  name: string;
}

export const INITIAL_ANSWERS: QuizAnswers = {
  city: 'Mumbai',
  activities: [],
  time: '',
  listen: '',
  languages: [],
  comfort: { sameGender: false, publicPlaces: false },
  name: '',
};

// ── Empathy echoes — Lora italic, warm, never romantic ────────────────────────

export function getEmpathyEcho(key: string, answers: QuizAnswers): string {
  switch (key) {
    case 'city':
      return `${answers.city}, a good city for this. Let's see who's around.`;
    case 'activities': {
      const p = answers.activities;
      if (p.includes('walks') && p.includes('cafe'))
        return "Morning walks and chai, nothing like the city before it wakes up.";
      if (p.includes('walks'))
        return "Morning walks it is, nothing like the city before it wakes up.";
      if (p.includes('gym'))
        return 'A good gym partner makes the whole routine stick. Noted.';
      if (p.includes('cafe'))
        return 'Café conversations are underrated. We know exactly who to find.';
      if (p.includes('events'))
        return "Nobody should skip the gig just because they'd go alone. Agreed.";
      if (p.includes('talking'))
        return "Sometimes that's the whole point. Noted.";
      return "Good. There are people here who'd enjoy exactly that.";
    }
    case 'time': {
      const map: Record<string, string> = {
        mornings: 'Mornings, the best part of the day with good company.',
        'weekday-eves': 'Weekday evenings, a walk or a café catch-up fits perfectly.',
        weekends: 'Weekends give you room to actually go somewhere. Good.',
        flexible: "Flexible works well, we'll find people free across the week.",
      };
      return map[answers.time] ?? "Good to know. We'll find people free when you are.";
    }
    case 'listen': {
      const map: Record<string, string> = {
        listener: "A good listener is rarer than you'd think. Noted.",
        talker: 'Someone who drives the conversation, that has real value.',
        both: "Depends on the day, that's the most honest answer there is.",
      };
      return map[answers.listen] ?? 'Noted.';
    }
    case 'languages': {
      const p = answers.languages;
      if (p.includes('marathi') && p.includes('hindi'))
        return "Marathi and Hindi, we've got plenty of folks who'll feel like home.";
      if (p.includes('tamil'))
        return "Tamil speakers in Mumbai, there are more than you'd expect.";
      if (p.length === 1 && p.includes('english'))
        return 'English works everywhere. Easy.';
      if (p.length > 3)
        return 'That many languages opens a lot of doors. Perfect.';
      return "Good, we'll keep language in mind as we build your list.";
    }
    case 'comfort':
      return answers.comfort.sameGender
        ? 'Noted, same-gender companions only. Always your choice.'
        : 'Noted. Everyone on Companio is ID-verified and meets in public first.';
    case 'name':
      return `Good to meet you, ${answers.name}. Let's find your people.`;
    default:
      return 'Noted.';
  }
}

// Per-step accent colors (azure→violet→gold cycling)
export const STEP_ACCENTS = [
  'var(--color-azure)',
  'var(--color-violet)',
  'var(--color-gold)',
  'var(--color-azure)',
  'var(--color-violet)',
  'var(--color-gold)',
  'var(--color-azure)',
] as const;
