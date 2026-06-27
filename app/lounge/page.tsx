import { notFound } from 'next/navigation';

// Lounge (the social layer) is PARKED for now: hidden from users, no backend.
// The implementation lives in components/lounge/** — to re-enable, restore the
// original page body (Nav + LoungeClient + Footer) and the nav links.
export default function LoungePage() {
  notFound();
}
