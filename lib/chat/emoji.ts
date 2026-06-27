// lib/chat/emoji.ts
//
// Curated emoji + sticker sets for the chat. DELIBERATELY PLATONIC — friendly,
// activity, food, travel, nature and reaction emoji only. No romantic /
// flirtatious symbols (no ❤️ 😍 😘 🥰 💋 💕 etc.), per Companio's strict rule.

export interface EmojiCategory {
  label: string;
  icon: string;   // shown in the picker's category nav
  emojis: string[];
}

// A full, WhatsApp-style keyboard grouped into categories.
export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    label: 'Smileys',
    icon: '😊',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🙂', '🙃',
      '😉', '😊', '😇', '😌', '😋', '😛', '😜', '🤪', '😝', '🤗',
      '🤭', '🤔', '🤓', '🧐', '😎', '🥳', '😮', '😯', '😲', '🥺',
      '😴', '😪', '😶', '🙄', '😬', '😏', '😅', '🤩', '🤠', '🫡',
    ],
  },
  {
    label: 'Gestures',
    icon: '👍',
    emojis: [
      '👍', '👎', '👌', '🤌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈',
      '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝',
      '🙏', '✍️', '💪', '🦾', '🙌', '👏', '🤲', '👐', '🤛', '🤜',
    ],
  },
  {
    label: 'Activities',
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '⛳', '🎯',
      '🎮', '🕹️', '🎲', '🧩', '🎨', '🎭', '🎬', '🎤', '🎧', '🎵',
      '🎶', '🥁', '🎸', '🎹', '🎻', '📷', '📸', '📚', '📖', '✏️',
      '🧘', '🚴', '🏃', '🚶', '🏊', '🧗', '🏆', '🥇', '🎪', '🎟️',
    ],
  },
  {
    label: 'Food',
    icon: '☕',
    emojis: [
      '☕', '🍵', '🧋', '🥤', '🧃', '🍴', '🍽️', '🥗', '🍕', '🍔',
      '🍟', '🌭', '🥪', '🌮', '🌯', '🍜', '🍝', '🍛', '🍲', '🥘',
      '🍱', '🍣', '🍙', '🍚', '🍰', '🎂', '🧁', '🍩', '🍪', '🍫',
      '🍬', '🍿', '🥨', '🥐', '🍞', '🧇', '🥞', '🍳', '🍦', '🍓',
    ],
  },
  {
    label: 'Travel',
    icon: '✈️',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚲', '🛴', '🛵', '🏍️', '✈️', '🚆',
      '🚇', '🚊', '⛴️', '🚢', '🗺️', '🧭', '🏖️', '🏝️', '🏞️', '🌅',
      '🌄', '🌇', '🌆', '🌃', '🌉', '🏙️', '🗼', '🎡', '🎢', '🏕️',
      '⛺', '🔥', '🏔️', '⛰️', '🌋', '🧳', '📍', '🗽', '🎠', '🎆',
    ],
  },
  {
    label: 'Nature',
    icon: '🌸',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦉', '🐝',
      '🦋', '🐞', '🌸', '🌷', '🌹', '🌻', '🌼', '🌳', '🌲', '🌴',
      '🌵', '🍀', '🍁', '🍂', '☀️', '🌙', '⭐', '🌟', '✨', '🌈',
    ],
  },
  {
    label: 'Symbols',
    icon: '✅',
    emojis: [
      '✅', '✔️', '❌', '⭕', '💯', '🔥', '💥', '⚡', '✨', '🎉',
      '🎊', '🎈', '🎁', '🏅', '🏆', '🎯', '💡', '📌', '📍', '⏰',
      '📅', '✉️', '💬', '💭', '👀', '💚', '💙', '💛', '🧡', '🤍',
    ],
  },
];

// Flat list (kept for any consumer that wants every emoji in one array).
export const EMOJIS: string[] = EMOJI_CATEGORIES.flatMap((c) => c.emojis);

// Quick reactions shown on the hover/long-press bar (WhatsApp-style row).
export const QUICK_REACTIONS: string[] = ['👍', '😂', '🙌', '😮', '🙏', '🔥', '👏', '✨'];

export interface Sticker {
  emoji: string;
  caption: string; // '' → a plain big-emoji sticker; otherwise a captioned card
}

// Sticker tray — captioned cards (like WhatsApp/Insta packs) + a few big-emoji
// ones. All friendly + meet-up themed.
export const STICKERS: Sticker[] = [
  { emoji: '👋', caption: 'Hey there!' },
  { emoji: '🚶', caption: 'On my way!' },
  { emoji: '⏰', caption: 'Running late' },
  { emoji: '📍', caption: 'Almost there' },
  { emoji: '☕', caption: 'Coffee?' },
  { emoji: '🎉', caption: "Let's go!" },
  { emoji: '🙏', caption: 'Thank you' },
  { emoji: '💡', caption: 'Great idea!' },
  { emoji: '😄', caption: 'Had so much fun' },
  { emoji: '☀️', caption: 'Good morning' },
  { emoji: '🤗', caption: 'Take care' },
  { emoji: '🙌', caption: 'High five!' },
  { emoji: '📚', caption: 'Bookworm' },
  { emoji: '🎬', caption: 'Movie time' },
  { emoji: '💪', caption: 'Workout?' },
  { emoji: '🌅', caption: 'Sunrise walk' },
  { emoji: '👍', caption: '' },
  { emoji: '🎈', caption: '' },
  { emoji: '✨', caption: '' },
  { emoji: '🏆', caption: '' },
];

/** Compose the text stored for a sticker message. */
export function stickerText(s: Sticker): string {
  return s.caption ? `${s.caption} ${s.emoji}` : s.emoji;
}

/**
 * True when a message is only emoji (1–3 of them) — used to render "jumbomoji"
 * larger, like WhatsApp/iMessage, and to pick the big-emoji sticker style.
 */
export function isEmojiOnly(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const stripped = trimmed.replace(/[\p{Extended_Pictographic}‍️\s]/gu, '');
  if (stripped.length > 0) return false;
  const count = [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(trimmed)].length;
  return count >= 1 && count <= 3;
}
