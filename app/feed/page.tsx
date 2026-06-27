import { notFound } from 'next/navigation';

// Feed (the social layer) is PARKED for now: hidden from users, no backend.
// The implementation lives in components/feed/** — to re-enable, restore the
// original page body (Nav + FeedClient + Footer) and the nav links.
export default function FeedPage() {
  notFound();
}
