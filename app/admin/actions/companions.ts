'use server';

// Admin → companion mutations. Gate → validate → mutate → log → revalidate,
// and always return a message the operator can read.

import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/server/admin';
import { storePhotoFromUrl, photoStoreConfigured } from '@/lib/server/photoStore';
import {
  adminAction,
  succeeded,
  failed,
  field,
  describeZod,
  type ActionState,
} from '@/lib/server/adminAction';
import { adminEditCompanionBody, adminBanBody } from '@/lib/server/validation';

const PATH = '/admin/companions';

/** Split a comma-separated form field into a clean string[] (undefined if absent). */
function list(f: FormData, k: string): string[] | undefined {
  const raw = f.get(k);
  if (raw === null) return undefined;
  const items = String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return items;
}

/** Parse a numeric form field, or undefined when the field wasn't submitted. */
function num(f: FormData, k: string): number | undefined {
  const raw = f.get(k);
  if (raw === null || String(raw).trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN; // NaN fails zod, surfacing a real message
}

/** Turn "companion name" into a URL-safe, stable id. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export async function createCompanion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const name = field(formData, 'name');
    const city = field(formData, 'city');
    const area = field(formData, 'area');
    const bio = field(formData, 'bio');
    if (!name || !city || !area || !bio) {
      return failed('Name, city, area and bio are all required.');
    }

    // The id used to be typed by hand: one typo and the profile was unreachable
    // and un-deletable through the UI. Derive it, and make collisions explicit.
    const id = field(formData, 'id') || slugify(name);
    if (!id) return failed('Could not derive an id from that name — set one explicitly.');

    const { prisma } = await import('@/lib/prisma');
    const clash = await prisma.companion.findUnique({ where: { id }, select: { id: true } });
    if (clash) return failed(`A companion with id "${id}" already exists.`);

    const hourlyRate = Math.max(0, Number(formData.get('hourlyRate')) || 50000);

    // A photo is REQUIRED, and there is no default.
    //
    // This used to fall back to a fixed Unsplash portrait — so a companion
    // created without one went live wearing a stock photograph of an unrelated
    // stranger, over their real, ID-verified name. Members pay for a pass to see
    // exactly this photo. Every argument against a catalogue of invented people
    // applies just as hard to one invented face on a real profile.
    const photoInput = field(formData, 'photo');
    if (!photoInput) {
      return failed('A photo URL is required — a profile must show the actual person.');
    }

    // Ingest it onto our own storage rather than hotlinking, and blur it here.
    //
    // A hotlinked portrait is a URL somebody else can repoint or delete, on a
    // host next/image refuses (next.config.ts allows our blob and nothing else),
    // and — the part that matters — one we cannot destroy, so the locked card
    // would have no blurred variant to show and would fall back to a placeholder.
    // Pasting a link is the operator's convenience; owning the bytes is the
    // product's requirement.
    // No blob store means no ingest, which means a hotlinked URL that next/image
    // will refuse (400, broken card) and that we could not blur even if it
    // rendered. Refuse with the reason rather than write a row that is
    // guaranteed to look broken and leak an unblurred face.
    if (!photoStoreConfigured()) {
      return failed(
        'Photo storage is not configured, so a portrait cannot be ingested or blurred. ' +
          'Set BLOB_READ_WRITE_TOKEN and try again.',
      );
    }

    let photo: string;
    let photoBlurred: string;
    try {
      const stored = await storePhotoFromUrl(photoInput, id);
      photo = stored.url;
      photoBlurred = stored.blurUrl;
    } catch (err) {
      return failed(
        err instanceof Error
          ? `Could not fetch that photo: ${err.message}`
          : 'Could not fetch that photo.',
      );
    }

    const accent = field(formData, 'accent') || '#5b5bd6';
    const firstName = name.split(' ')[0];
    const lastInitial = name.split(' ')[1]?.[0];
    const maskedName = lastInitial ? `${firstName} ${lastInitial}.` : firstName;

    await prisma.companion.create({
      data: {
        id,
        name,
        firstName,
        maskedName,
        city,
        area,
        bio,
        hourlyRate,
        ratePerMeeting: hourlyRate,
        photo,
        photoBlurred,
        accent,
        // These drive the explore card and the match sort. Creating a companion
        // with all three empty renders a blank tile, so accept them up front.
        activities: list(formData, 'activities') ?? [],
        languages: list(formData, 'languages') ?? [],
        suggestions: list(formData, 'suggestions') ?? [],
        availability: field(formData, 'availability') || 'Available tomorrow',
      },
    });
    await logAdminAction(adminId, 'createCompanion', 'companion', id);
    revalidatePath(PATH);
    return succeeded(`Companion "${name}" created with id ${id}.`);
  });
}

export async function editCompanion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing companion id.');

    const parsed = adminEditCompanionBody.safeParse({
      name: field(formData, 'name') || undefined,
      city: field(formData, 'city') || undefined,
      area: field(formData, 'area') || undefined,
      age: num(formData, 'age'),
      hourlyRate: num(formData, 'hourlyRate'),
      bio: field(formData, 'bio') || undefined,
      photo: field(formData, 'photo') || undefined,
      accent: field(formData, 'accent') || undefined,
      activities: list(formData, 'activities'),
      languages: list(formData, 'languages'),
      suggestions: list(formData, 'suggestions'),
      availability: field(formData, 'availability') || undefined,
      matchScore: num(formData, 'matchScore'),
    });
    if (!parsed.success) return failed(describeZod(parsed.error));
    if (Object.keys(parsed.data).length === 0) return failed('Nothing to change.');

    const { prisma } = await import('@/lib/prisma');
    // Keep the derived display names in step with the name the admin typed.
    const data: Record<string, unknown> = { ...parsed.data };

    // A changed photo must be re-ingested and re-blurred TOGETHER. Writing the
    // new `photo` while leaving the old `photoBlurred` in place would leave a
    // locked card showing a blurred copy of the previous face — a photo the
    // companion has just replaced, still being served to everyone who has not
    // paid. The two columns are one fact and are always written as a pair.
    //
    // Only re-ingest when the URL actually changed: the edit form posts the
    // current value back on every save, and re-uploading an unchanged portrait
    // on every unrelated edit is pure cost.
    if (parsed.data.photo && photoStoreConfigured()) {
      const current = await prisma.companion.findUnique({
        where: { id },
        select: { photo: true, photoBlurred: true },
      });
      if (parsed.data.photo !== current?.photo || !current?.photoBlurred) {
        try {
          const stored = await storePhotoFromUrl(parsed.data.photo, id);
          data.photo = stored.url;
          data.photoBlurred = stored.blurUrl;
        } catch (err) {
          return failed(
            err instanceof Error
              ? `Could not fetch that photo: ${err.message}`
              : 'Could not fetch that photo.',
          );
        }
      }
    }

    if (parsed.data.name) {
      const firstName = parsed.data.name.split(' ')[0];
      const lastInitial = parsed.data.name.split(' ')[1]?.[0];
      data.firstName = firstName;
      data.maskedName = lastInitial ? `${firstName} ${lastInitial}.` : firstName;
    }

    await prisma.companion.update({ where: { id }, data });
    await logAdminAction(adminId, 'editCompanion', 'companion', id, JSON.stringify(parsed.data));
    revalidatePath(PATH);
    return succeeded('Companion updated.');
  });
}

export async function suspendCompanion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing companion id.');
    const { prisma } = await import('@/lib/prisma');
    await prisma.companion.update({ where: { id }, data: { suspended: true } });
    await logAdminAction(adminId, 'suspendCompanion', 'companion', id);
    revalidatePath(PATH);
    return succeeded('Companion suspended — hidden from explore, the map, and new bookings.');
  });
}

export async function unsuspendCompanion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing companion id.');
    const { prisma } = await import('@/lib/prisma');
    await prisma.companion.update({ where: { id }, data: { suspended: false } });
    await logAdminAction(adminId, 'unsuspendCompanion', 'companion', id);
    revalidatePath(PATH);
    return succeeded('Companion is visible again.');
  });
}

export async function banCompanion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing companion id.');
    const parsed = adminBanBody.safeParse({ reason: field(formData, 'reason') || undefined });
    if (!parsed.success) return failed(describeZod(parsed.error));
    const { prisma } = await import('@/lib/prisma');
    await prisma.companion.update({
      where: { id },
      data: { bannedAt: new Date(), banReason: parsed.data.reason ?? null, suspended: true },
    });
    await logAdminAction(adminId, 'banCompanion', 'companion', id, parsed.data.reason);
    revalidatePath(PATH);
    return succeeded('Companion banned and removed from the marketplace.');
  });
}

export async function unbanCompanion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing companion id.');
    const { prisma } = await import('@/lib/prisma');
    await prisma.companion.update({
      where: { id },
      data: { bannedAt: null, banReason: null, suspended: false },
    });
    await logAdminAction(adminId, 'unbanCompanion', 'companion', id);
    revalidatePath(PATH);
    return succeeded('Ban lifted. The profile is live again.');
  });
}

export async function deleteCompanion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing companion id.');
    const { prisma } = await import('@/lib/prisma');
    const { eraseCompanion } = await import('@/lib/server/erase');
    const result = await eraseCompanion(prisma, id);
    if (!result.ok) {
      return failed(
        `Cannot delete: this companion has ${result.bookings} booking${
          result.bookings === 1 ? '' : 's'
        }. Deleting would destroy the record of a real meetup. Ban them instead.`,
      );
    }
    await logAdminAction(adminId, 'deleteCompanion', 'companion', id);
    revalidatePath(PATH);
    return succeeded('Companion permanently deleted.');
  });
}

export async function setVerified(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing companion id.');
    const verified = formData.get('verified') === 'true';
    const { prisma } = await import('@/lib/prisma');
    await prisma.companion.update({ where: { id }, data: { verified } });
    await logAdminAction(adminId, 'setVerified', 'companion', id, String(verified));
    revalidatePath(PATH);
    return succeeded(verified ? 'Marked as ID-verified.' : 'Verification removed.');
  });
}

export async function setPremium(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return adminAction(async (adminId) => {
    const id = field(formData, 'id');
    if (!id) return failed('Missing companion id.');
    const premium = formData.get('premium') === 'true';
    const { prisma } = await import('@/lib/prisma');
    await prisma.companion.update({ where: { id }, data: { premium } });
    await logAdminAction(adminId, 'setPremium', 'companion', id, String(premium));
    revalidatePath(PATH);
    return succeeded(premium ? 'Moved to the premium tier.' : 'Removed from the premium tier.');
  });
}
