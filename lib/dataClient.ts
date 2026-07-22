// lib/dataClient.ts
//
// DATA-ACCESS SEAM — the single import boundary between UI and storage.
//
// Why this exists: right now everything reads directly from localStorage via
// lib/journeyState + lib/appState. When we wire a real DB the switch should
// be a one-line env-flag change, not a grep-and-replace across 30 components.
//
// Pattern:
//   DataClient (typed interface)
//     ├── localStorageDataClient  ← today, wraps existing sync fns with Promise.resolve()
//     └── httpDataClient          ← future, fetch('/api/...') calls (stubs only)
//
// Components import `dataClient` (the chosen singleton) and call await dc.getWallet().
// Nothing in this file imports @prisma/client or next-auth — those live in API routes.

import { emitDataChange } from './dataEvents';
import type { Wallet, DemoUser, QuizResult } from './journeyState';
import type {
  Booking,
  ChatMessage,
  AppNotification,
  Plan,
  CompanionApplication,
} from './appState';
import type { Companion } from './data/companions';

// ── DataClient interface ──────────────────────────────────────────────────────

export interface DataClient {
  // ── Companion catalogue ──────────────────────────────────────────────────
  getCompanions(): Promise<Companion[]>;
  getCompanion(id: string): Promise<Companion | undefined>;

  // ── Wallet / credits ──────────────────────────────────────────────────────
  getWallet(): Promise<Wallet>;
  addCredits(count: number): Promise<Wallet>;
  decrementMeeting(): Promise<Wallet>;

  // ── Unlock flag ───────────────────────────────────────────────────────────
  getUnlocked(): Promise<boolean>;
  setUnlocked(v: boolean): Promise<void>;

  // ── Welcomed flag ─────────────────────────────────────────────────────────
  getWelcomed(): Promise<boolean>;
  setWelcomed(v: boolean): Promise<void>;

  // ── User profile ──────────────────────────────────────────────────────────
  getUser(): Promise<DemoUser | null>;
  setUser(u: DemoUser): Promise<void>;
  /** Toggle the same-gender-only preference on its own, without a full profile write. */
  setSameGenderOnly(v: boolean): Promise<void>;

  // ── Bookings ──────────────────────────────────────────────────────────────
  getBookings(): Promise<Booking[]>;
  addBooking(b: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking>;
  updateBooking(id: string, patch: Partial<Booking>): Promise<void>;

  // ── Favorites ─────────────────────────────────────────────────────────────
  getFavorites(): Promise<string[]>;
  toggleFavorite(companionId: string): Promise<string[]>;

  // ── Messages ──────────────────────────────────────────────────────────────
  getThread(companionId: string): Promise<ChatMessage[]>;
  getThreads(): Promise<Record<string, ChatMessage[]>>;
  /** Toggle one emoji reaction on one message. Returns the updated thread. */
  reactToMessage(
    companionId: string,
    messageId: string,
    emoji: string,
  ): Promise<ChatMessage[]>;
  appendMessage(
    companionId: string,
    msg: Omit<ChatMessage, 'id' | 'ts'>,
  ): Promise<ChatMessage>;

  // ── Notifications ─────────────────────────────────────────────────────────
  getNotifications(): Promise<AppNotification[]>;
  addNotification(n: Pick<AppNotification, 'title' | 'body'>): Promise<void>;
  markNotificationsRead(): Promise<void>;

  // ── Plan / subscription ───────────────────────────────────────────────────
  getPlan(): Promise<Plan>;
  setPlan(p: Plan): Promise<void>;

  // ── Companion application ─────────────────────────────────────────────────
  getApplication(): Promise<CompanionApplication | null>;
  saveApplication(a: CompanionApplication): Promise<void>;
}

// ── localStorageDataClient ────────────────────────────────────────────────────
// Thin async wrappers around the existing sync lib functions.
// Zero behaviour change — if it worked before, it works now.

export function makeLocalStorageDataClient(): DataClient {
  return {
    // companion catalogue — import deferred inside fn to keep this file
    // free of top-level side-effects that might trip SSR tree-shaking
    async getCompanions() {
      const { COMPANIONS } = await import('./data/companions');
      const { getApplications } = await import('./appState');
      const apps = getApplications();
      const appCompanions: Companion[] = apps
        .filter((app) => app.name)
        .map((app) => {
          const firstName = app.name.trim().split(' ')[0] || app.name;
          const lastInitial = app.name.trim().split(' ')[1]?.[0];
          const maskedName = lastInitial ? `${firstName} ${lastInitial}.` : `${firstName} ···`;
          const slug = `c-${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
          const cityName = app.city ? (app.city.charAt(0).toUpperCase() + app.city.slice(1).toLowerCase()) : 'Indore';
          const genderVal = (app.gender as any) ?? 'male';
          const defaultAvatar = genderVal === 'male'
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
          const photoUrl = app.photoUrl && app.photoUrl.trim().length > 0 ? app.photoUrl : defaultAvatar;

          return {
            id: slug,
            name: app.name,
            firstName,
            maskedName,
            city: cityName,
            area: cityName,
            age: 24,
            activities: app.activities && app.activities.length ? app.activities : ['City Walk', 'Café Chat'],
            languages: ['English', 'Hindi'],
            rating: 4.9,
            reviews: 1,
            ratePerMeeting: app.rate || 49900,
            hourlyRate: app.rate || 49900,
            bio: app.bio || 'Friendly companion passionate about city walks and deep conversations.',
            suggestions: ['Explore historic spots', 'Café meetup', 'City stroll'],
            photo: photoUrl,
            photoBlurred: undefined,
            accent: '#2E6BFF',
            gender: genderVal,
            verified: true,
            availableNow: true,
            availability: 'Available today',
            distanceKm: 2,
            matchScore: 95,
            reviewsList: [],
          };
        });

      const list = [...appCompanions];
      for (const c of COMPANIONS) {
        if (!list.some((item) => item.id === c.id)) {
          list.push(c);
        }
      }
      return list;
    },
    async getCompanion(id) {
      const companions = await this.getCompanions();
      return companions.find((c) => c.id === id || c.id === `c-${id.toLowerCase()}`);
    },

    // wallet
    async getWallet() {
      const { getWallet } = await import('./journeyState');
      return getWallet();
    },
    async addCredits(count) {
      const { addCredits } = await import('./appState');
      const { getWallet } = await import('./journeyState');
      addCredits(count);
      return getWallet();
    },
    async decrementMeeting() {
      const { decrementMeeting } = await import('./journeyState');
      return decrementMeeting();
    },

    // unlock
    async getUnlocked() {
      const { getUnlocked } = await import('./journeyState');
      return getUnlocked();
    },
    async setUnlocked(v) {
      const { setUnlocked } = await import('./journeyState');
      setUnlocked(v);
    },

    // welcomed
    async getWelcomed() {
      const { getWelcomed } = await import('./journeyState');
      return getWelcomed();
    },
    async setWelcomed(v) {
      const { setWelcomed } = await import('./journeyState');
      setWelcomed(v);
    },

    // user
    async getUser() {
      const { getUser } = await import('./journeyState');
      return getUser();
    },
    async setUser(u) {
      const { setUser } = await import('./journeyState');
      setUser(u);
    },
    async setSameGenderOnly(v) {
      const { getUser, setUser } = await import('./journeyState');
      const u = getUser();
      if (u) setUser({ ...u, sameGenderOnly: v });
    },

    // bookings
    async getBookings() {
      const { getBookings } = await import('./appState');
      return getBookings();
    },
    /**
     * Creating a booking is one operation, not three.
     *
     * `POST /api/bookings` spends the credit, writes the ledger row, creates the
     * booking and notifies — all inside one transaction. The local client used
     * to do only the third of those, leaving BookingWizard to call
     * decrementMeeting() and addNotification() itself. Which meant that in http
     * mode the wizard decremented the wallet a second time, client-side, on top
     * of the server's spend.
     *
     * Both clients now mean the same thing by `addBooking`, so no caller has to
     * know which one it is talking to.
     */
    async addBooking(b) {
      const { addBooking, addNotification } = await import('./appState');
      const { getWallet, decrementMeeting } = await import('./journeyState');
      if (b.usedCredit) {
        if (getWallet().credits <= 0) throw new Error('insufficient_credits');
        decrementMeeting();
      }
      const booking = addBooking(b);
      addNotification({
        title: 'Meetup confirmed',
        body: `Your ${b.activity} on ${b.dateISO} is booked. Free to cancel any time before you meet.`,
      });
      return booking;
    },
    async updateBooking(id, patch) {
      const { updateBooking } = await import('./appState');
      updateBooking(id, patch);
    },

    // favorites
    async getFavorites() {
      const { getFavorites } = await import('./appState');
      return getFavorites();
    },
    async toggleFavorite(companionId) {
      const { toggleFavorite } = await import('./appState');
      return toggleFavorite(companionId);
    },

    // messages
    async getThread(companionId) {
      const { getThread } = await import('./appState');
      return getThread(companionId);
    },
    async getThreads() {
      const { getThreads } = await import('./appState');
      return getThreads();
    },
    async appendMessage(companionId, msg) {
      const { appendMessage } = await import('./appState');
      return appendMessage(companionId, msg);
    },
    async reactToMessage(companionId, messageId, emoji) {
      const { reactToMessage } = await import('./appState');
      return reactToMessage(companionId, messageId, emoji);
    },

    // notifications
    async getNotifications() {
      const { getNotifications } = await import('./appState');
      return getNotifications();
    },
    async addNotification(n) {
      const { addNotification } = await import('./appState');
      addNotification(n);
    },
    async markNotificationsRead() {
      const { markNotificationsRead } = await import('./appState');
      markNotificationsRead();
    },

    // plan
    async getPlan() {
      const { getPlan } = await import('./appState');
      return getPlan();
    },
    async setPlan(p) {
      const { setPlan } = await import('./appState');
      setPlan(p);
    },

    // application
    async getApplication() {
      const { getApplication } = await import('./appState');
      return getApplication();
    },
    async saveApplication(a) {
      const { saveApplication } = await import('./appState');
      saveApplication(a);
    },
  };
}

// ── httpDataClient ────────────────────────────────────────────────────────────
// Real fetch('/api/...') implementation, used when NEXT_PUBLIC_DATA_CLIENT=http.
// Each method mirrors the DataClient interface, so flipping the flag needs no
// call-site changes.
//
// PAID actions are special: addCredits / setUnlocked / setPlan('plus') are NOT
// free setters server-side (those endpoints return 403 by design). The real
// grant happens only after a Razorpay payment — POST /api/razorpay/create-order
// { kind } → checkout → /api/razorpay/verify → settlePurchase(). Wiring the
// checkout into these methods is the Stage-3 data-layer task; until then they
// target the hardened endpoints and will throw if called in http mode.

export function makeHttpDataClient(): DataClient {
  async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    // Writes must surface failures — a 401/403/500 means the action did not
    // happen, and the caller needs to know (the UI gates these behind auth).
    if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
    return res.json() as Promise<T>;
  }

  // Strict read — throws on any non-2xx. For data that is always expected
  // (e.g. the public companion catalogue).
  async function get<T>(path: string): Promise<T> {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
    return res.json() as Promise<T>;
  }

  // Tolerant read — a 401 (signed out) returns the same default the
  // localStorage client gives a fresh user, so flipping to http mode never
  // crashes a page for an unauthenticated visitor. Other errors still throw.
  async function getOr<T>(path: string, fallback: T): Promise<T> {
    const res = await fetch(path);
    if (res.status === 401) return fallback;
    if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`);
    return res.json() as Promise<T>;
  }

  return {
    async getCompanions() {
      return get<Companion[]>('/api/companions');
    },
    async getCompanion(id) {
      // 404 → undefined, mirroring the local getCompanion for an unknown id.
      const res = await fetch(`/api/companions/${id}`);
      if (res.status === 404) return undefined;
      if (!res.ok) throw new Error(`HTTP ${res.status} /api/companions/${id}`);
      return res.json() as Promise<Companion>;
    },

    async getWallet() {
      // Matches WALLET_DEFAULT in journeyState.ts.
      return getOr<Wallet>('/api/wallet', { credits: 2, used: 0 });
    },
    async addCredits(count) {
      return post<Wallet>('/api/wallet/add-credits', { count });
    },
    async decrementMeeting() {
      return post<Wallet>('/api/wallet/decrement', {});
    },

    async getUnlocked() {
      return getOr<boolean>('/api/user/unlocked', false);
    },
    async setUnlocked(v) {
      await post('/api/user/unlocked', { value: v });
    },

    async getWelcomed() {
      return getOr<boolean>('/api/user/welcomed', false);
    },
    async setWelcomed(v) {
      await post('/api/user/welcomed', { value: v });
    },

    async getUser() {
      return getOr<DemoUser | null>('/api/user', null);
    },
    async setUser(u) {
      await post('/api/user', u);
    },
    async setSameGenderOnly(v) {
      // The route needs firstName (it is the one required field), so the
      // preference rides along with the profile the server already has.
      const current = await getOr<DemoUser | null>('/api/user', null);
      if (!current) return;
      await post('/api/user', { ...current, sameGenderOnly: v });
    },

    async getBookings() {
      return getOr<Booking[]>('/api/bookings', []);
    },
    async addBooking(b) {
      return post<Booking>('/api/bookings', b);
    },
    async updateBooking(id, patch) {
      await post(`/api/bookings/${id}`, patch);
    },

    async getFavorites() {
      return getOr<string[]>('/api/favorites', []);
    },
    async toggleFavorite(companionId) {
      return post<string[]>('/api/favorites/toggle', { companionId });
    },

    async getThread(companionId) {
      return getOr<ChatMessage[]>(`/api/messages/${companionId}`, []);
    },
    async getThreads() {
      return getOr<Record<string, ChatMessage[]>>('/api/messages', {});
    },
    async appendMessage(companionId, msg) {
      return post<ChatMessage>(`/api/messages/${companionId}`, msg);
    },
    async reactToMessage(companionId, messageId, emoji) {
      return post<ChatMessage[]>(`/api/messages/${companionId}/react`, { messageId, emoji });
    },

    async getNotifications() {
      return getOr<AppNotification[]>('/api/notifications', []);
    },
    async addNotification(n) {
      await post('/api/notifications', n);
    },
    async markNotificationsRead() {
      await post('/api/notifications/read', {});
    },

    async getPlan() {
      return getOr<Plan>('/api/subscription', null);
    },
    async setPlan(p) {
      await post('/api/subscription', { plan: p });
    },

    async getApplication() {
      return getOr<CompanionApplication | null>('/api/application', null);
    },
    async saveApplication(a) {
      await post('/api/application', a);
    },
  };
}

// ── Change notification ───────────────────────────────────────────────────────
// Every mutation announces which slice it touched, so useData() subscribers
// re-read instead of showing a stale value until the next hard reload. Applied
// as a decorator, once, rather than sprinkled through each method of each
// client — otherwise the two implementations drift and one forgets to emit.
//
// Emission happens AFTER the underlying call resolves: in http mode that means
// after the server confirmed the write, so a rejected mutation never triggers a
// re-read that would just restore the old value.

/** Which slices each mutation invalidates. */
const MUTATION_EFFECTS = {
  addCredits: ['wallet'],
  decrementMeeting: ['wallet'],
  setUnlocked: ['unlocked'],
  setWelcomed: ['welcomed'],
  setUser: ['user'],
  // A booking may spend a credit, so the wallet is stale too.
  addBooking: ['bookings', 'wallet'],
  updateBooking: ['bookings'],
  toggleFavorite: ['favorites'],
  appendMessage: ['messages'],
  reactToMessage: ['messages'],
  addNotification: ['notifications'],
  markNotificationsRead: ['notifications'],
  setPlan: ['plan'],
  saveApplication: ['application'],
} as const satisfies Partial<Record<keyof DataClient, readonly DataKeyOf[]>>;

type DataKeyOf = Parameters<typeof emitDataChange>[0];

export function withChangeEvents(client: DataClient): DataClient {
  const wrapped = { ...client } as Record<string, unknown>;
  for (const [method, keys] of Object.entries(MUTATION_EFFECTS)) {
    const original = client[method as keyof DataClient] as (...a: unknown[]) => Promise<unknown>;
    wrapped[method] = async (...args: unknown[]) => {
      const result = await original(...args);
      for (const key of keys) emitDataChange(key);
      return result;
    };
  }
  return wrapped as unknown as DataClient;
}

// ── Singleton export ──────────────────────────────────────────────────────────
// NEXT_PUBLIC_DATA_CLIENT is read at module-init time (build-time inlined by Next).
// Default: 'local' so the app works with zero config today.
// Flip to 'http' once real API routes are implemented and DATABASE_URL is set.

const clientMode =
  (process.env.NEXT_PUBLIC_DATA_CLIENT as 'local' | 'http' | undefined) ?? 'local';

export const dataClient: DataClient = withChangeEvents(
  clientMode === 'http' ? makeHttpDataClient() : makeLocalStorageDataClient(),
);

/**
 * True when this build talks to the real API and the data lives in Postgres.
 * The account panel needs it: "download a copy of your data" means an export
 * from the server in http mode, and a dump of this browser's localStorage in
 * local demo mode — and telling a demo visitor we hold data we do not would be
 * a lie in the one place the law cares about.
 */
export function isServerBacked(): boolean {
  return clientMode === 'http';
}

/** Every localStorage key this app owns. Used by the local-mode data wipe. */
export function localStorageKeys(): string[] {
  if (typeof window === 'undefined') return [];
  return Object.keys(localStorage).filter((k) => k.startsWith('companio'));
}
