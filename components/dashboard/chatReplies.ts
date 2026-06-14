// Simulated reply pools keyed by companion id. Used by ChatPanel.
export const CONTACT_RE = /(?:\+?91[-\s]?)?[6-9]\d{9}|[\w.+\-]+@[\w\-]+\.[a-z]{2,}/i;

export const REPLIES: Record<string, string[]> = {
  ananya:  ["That sounds great, Saturday morning works. Marine Drive at 7?",   "Perfect! I know a filter coffee spot at Colaba Causeway."],
  rohan:   ["That sounds good, Versova beach at 6 works.",                      "Street food tour sounds perfect. Vada pav stall opens at 8."],
  priya:   ["Sassoon Dock at 7 AM it is. The light is extraordinary then.",      "Sunday works well, see you at the museum entrance!"],
  aarav:   ["Powai Lake evening walk, yes, perfect.",                           "The Kitab Khana visit was exactly the kind of thing I enjoy too."],
  zara:    ["Juhu beach at 6 AM, see you there!",                               "I'll grab the chaat after the run, the pani puri stall is amazing."],
  kiran:   ["Shivaji Park at 8 AM sounds lovely.",                              "The Irani café is perfect for a long morning chat."],
  ishaan:  ["Lower Parel gym at 7, sounds like a plan.",                       "The Kamala Mills walk after is a great idea."],
  meena:   ["Café Madras at 3 PM? Perfect choice.",                             "I can bring a book recommendation for after the coffee!"],
  sahil:   ["Dawn at the fishing village is my favourite hour. See you there.", "The creek run at 6, the light will be beautiful."],
  deepika: ["Worli Sea Face at sunset, absolutely.",                            "Prithvi Theatre on Friday, I'll check what's on."],
  arjun:   ["RCF Colony walk Saturday, 7 AM works well.",                     "The Chembur market opens early, we can start there."],
  fatima:  ["Malad creek at 6 AM, see you there!",                            "The bakery has been there thirty years. You'll love it."],
  vivek:   ["Flora Fountain and then Kala Ghoda Café, a perfect Sunday.",      "Prithvi on Friday works perfectly."],
  nisha:   ["Vile Parle lanes on Sunday morning, I know every shop.",          "The Nehru Science Centre is a hidden gem. Great choice."],
};

export const DEFAULT_REPLIES = [
  "That sounds great, looking forward to it!",
  "Saturday morning works. See you there!",
  "Perfect, that area is wonderful at that time of day.",
];

export function getReplies(id: string): string[] {
  return REPLIES[id] ?? DEFAULT_REPLIES;
}
