// app/admin/applications/page.tsx — review companion applications: see the free
// document-check results, then approve (creates the Companion profile) or reject.

import type { Prisma, ApplicationStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionForm } from '@/components/admin/ActionForm';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { AdminPager } from '@/components/admin/AdminPager';
import { AdminEmpty } from '@/components/admin/AdminEmpty';
import { AdminStatusChips } from '@/components/admin/AdminStatusChips';
import {
  ADMIN_PAGE_SIZE,
  parseQ,
  parsePage,
  parseStatus,
  like,
  type AdminListSearchParams,
} from '@/lib/server/adminList';
import { approveApplication, rejectApplication } from '../actions/applications';

export const metadata = { title: "Applications" };


export const dynamic = 'force-dynamic';

const btnGreen = 'text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--color-emerald)] text-white disabled:opacity-50 disabled:cursor-wait';
const btnRed = 'text-xs font-semibold px-3 py-1.5 rounded-full border border-rose-300 text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-wait';
const inp = 'h-8 px-2 text-xs rounded-lg border border-[var(--color-ink)]/15';

// Doubles for the document checks (pending/verified/failed/manual) and, since
// the status filter arrived, the application's own status.
function StatusPill({ s }: { s: string }) {
  const cls = s === 'verified' || s === 'approved' ? 'bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]'
    : s === 'failed' || s === 'rejected' ? 'bg-rose-100 text-rose-700'
    : s === 'manual' || s === 'submitted' ? 'bg-[var(--color-azure)]/10 text-[var(--color-azure)]'
    : 'bg-[var(--color-ink)]/5 text-[var(--color-ink-muted)]';
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cls}`}>{s}</span>;
}

const BASE = '/admin/applications';

const STATUSES = ['draft', 'submitted', 'approved', 'rejected'] as const satisfies readonly ApplicationStatus[];
/** "All" is an explicit value here: with no filter this page means `submitted`. */
const ALL = 'all';

export default async function AdminApplications({ searchParams }: { searchParams: AdminListSearchParams }) {
  const sp = await searchParams;
  const q = parseQ(sp.q);
  const page = parsePage(sp.page);
  // The queue an admin opens this page for is the pending one, so that stays the
  // default; the other statuses are now reachable rather than merely stored.
  // `urlStatus` is only what the URL actually asked for — the links reuse it, so
  // the default stays an absent param instead of `?status=submitted` everywhere.
  const urlStatus = parseStatus(sp.status, [...STATUSES, ALL]);
  const status = urlStatus ?? 'submitted';

  const where: Prisma.CompanionApplicationWhereInput = {
    ...(status === ALL ? {} : { status }),
    ...(q
      ? {
          OR: [
            { name: like(q) },
            { city: like(q) },
            { id: like(q) },
            // Applications carry no email of their own — it lives on the account
            // that submitted them.
            { user: { email: like(q) } },
          ],
        }
      : {}),
  };

  const [apps, total] = await Promise.all([
    prisma.companionApplication.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: ADMIN_PAGE_SIZE,
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      select: {
        id: true, name: true, city: true, rate: true, bio: true, activities: true,
        idUploaded: true, backgroundConsent: true, idDocType: true, idDocMasked: true,
        idVerifyStatus: true, photoVerifyStatus: true, ocrMatched: true, updatedAt: true,
        status: true,
        // Drives the approve confirmation: with a stored portrait the profile
        // goes live immediately, without one it lands hidden.
        photoUrl: true,
        user: { select: { email: true } },
      },
    }),
    prisma.companionApplication.count({ where }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-black text-[var(--color-ink)]" style={{ fontSize: 'var(--text-h2)' }}>
        {status === 'submitted' ? 'Pending applications' : 'Applications'} ({total.toLocaleString('en-IN')})
      </h1>
      <p className="text-xs text-[var(--color-ink-muted)] -mt-3">
        Document checks are automated sanity checks (number format, file integrity, duplicate
        fingerprint) — <strong>not identity proof</strong>. No authority has confirmed anyone here.
        Approving stamps <em>manual</em>: it records that <em>you</em> looked. Always eyeball first.
      </p>

      <AdminStatusChips
        basePath={BASE}
        active={status}
        options={STATUSES}
        q={q}
        allLabel="All"
        allValue={ALL}
        label="Filter applications by status"
      />

      <AdminSearch
        q={q}
        label="Search applications"
        placeholder="Name, email, city or id"
        preserve={{ status: urlStatus }}
      />

      <div className="flex flex-col gap-3">
        {apps.length === 0 && (
          <AdminEmpty
            basePath={BASE}
            q={q}
            status={urlStatus === ALL ? undefined : urlStatus}
            noun="applications"
            emptyLabel="No pending applications."
          />
        )}
        {apps.map((a) => (
          <div key={a.id} className="rounded-2xl bg-white border border-[var(--color-ink)]/10 p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {a.name} <span className="font-normal text-[var(--color-ink-muted)]">· {a.city} · ₹{(a.rate / 100).toFixed(0)}/mtg</span>
                </p>
                {/* The applicant's account email — searchable, so show it. */}
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{a.user?.email ?? '—'}</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{a.bio}</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{a.activities.join(', ')}</p>
              </div>
              {/* Only pending rows used to reach this page; the status filter can
                  now surface approved and rejected ones, so say which is which. */}
              <StatusPill s={a.status} />
            </div>

            {/* Document-check results.
                These are format and integrity checks, not identity proof. The
                pills used to read "verified" on every application because the
                upload route stamped that status unconditionally — so the badge
                an admin leaned on meant nothing. They now read "pending" until
                you approve, which stamps "manual". */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[var(--color-ink-muted)]">
                ID: {a.idDocType ?? '—'} {a.idDocMasked ? `(${a.idDocMasked})` : ''}
              </span>
              <span className="text-[var(--color-ink-muted)]">ID check:</span> <StatusPill s={a.idVerifyStatus} />
              <span className="text-[var(--color-ink-muted)]">Photo:</span> <StatusPill s={a.photoVerifyStatus} />
              {/* Whether we actually HOLD their portrait — which decides whether
                  approving publishes a profile or files a hidden one. The
                  operator should know that before clicking, not from the confirm
                  dialog. */}
              <span
                className="text-[var(--color-ink-muted)]"
                title={
                  a.photoUrl
                    ? 'Stored and blurred. Approving publishes their profile immediately.'
                    : 'No portrait on file. Approving creates a hidden profile you will have to add a photo to.'
                }
              >
                portrait: {a.photoUrl ? 'on file → goes live' : 'missing → stays hidden'}
              </span>
              {a.ocrMatched != null && (
                // Computed by tesseract.js in the APPLICANT'S browser and posted
                // to us. Trivially forged. Never style it as a green tick.
                <span
                  className="text-[var(--color-ink-muted)]"
                  title="Reported by the applicant's own browser. Not verified by us — treat as a hint only."
                >
                  self-reported OCR: {a.ocrMatched ? 'number found on image' : 'number not found'}
                </span>
              )}
              {a.backgroundConsent && <span className="text-[var(--color-emerald)]">bg-consent ✓</span>}
            </div>

            <p className="text-xs text-[var(--color-ink-muted)]">
              Format + file-integrity checks passed, and this document has not been used by another
              applicant. Nothing here proves the person owns the identity — open both images and look.
            </p>

            {/* Admin Eyeball & Image Verification Section */}
            <div className="mt-1 p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Applicant Portrait / Selfie */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  📷 <span>Applicant Portrait / Selfie</span>
                </p>
                {a.photoUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-300 max-h-48 bg-slate-900 flex items-center justify-center">
                    <img
                      src={a.photoUrl}
                      alt={`Portrait of ${a.name}`}
                      className="object-cover w-full h-44 rounded-lg hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="h-28 rounded-lg bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-amber-800 p-2 text-center text-xs">
                    <span className="font-semibold">⚠️ No Selfie/Portrait uploaded</span>
                    <span className="text-[10px] text-amber-600 mt-1">Applicant must upload selfie on Step 2</span>
                  </div>
                )}
              </div>

              {/* ID Document Image */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  🪪 <span>ID Document Image ({a.idDocType ?? 'Aadhaar / PAN'})</span>
                </p>
                {(a as any).idPhotoUrl || a.photoUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-300 max-h-48 bg-slate-900 flex items-center justify-center">
                    <img
                      src={(a as any).idPhotoUrl || a.photoUrl}
                      alt={`ID Document of ${a.name}`}
                      className="object-contain w-full h-44 rounded-lg hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="h-28 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 p-2 text-center text-xs">
                    <span>No ID Document Image attached</span>
                  </div>
                )}
              </div>
            </div>

            {/* Both actions refuse anything that is not "submitted" (they check
                the status server-side), so don't offer them on the rows the
                status filter now makes reachable. */}
            {(a.status === 'submitted' || a.status === 'draft') && (
            <div className="flex flex-wrap items-start gap-2 pt-2 border-t border-[var(--color-ink)]/5">
              <ActionForm
                action={approveApplication}
                submitLabel="Approve → create companion"
                submitClassName={btnGreen}
                // The consequence depends on whether we hold their portrait, so
                // the confirmation has to say which. It used to promise "HIDDEN
                // until you add a real photo" unconditionally — now false for
                // any applicant who uploaded one, and telling an operator a
                // profile is invisible when it is about to be live and bookable
                // is the wrong direction to be wrong in.
                confirm={
                  a.photoUrl
                    ? `Approve ${a.name}? This promotes their account and publishes their profile — LIVE and bookable, with the photo they uploaded.`
                    : `Approve ${a.name}? This promotes their account and creates their profile — HIDDEN, because this application has no stored photo. It does not go live until you add one.`
                }
              >
                <input type="hidden" name="id" value={a.id} />
              </ActionForm>
              <ActionForm action={rejectApplication} submitLabel="Reject" submitClassName={btnRed}>
                <input type="hidden" name="id" value={a.id} />
                <input name="reason" placeholder="Reject reason" className={inp} style={{ width: 130 }} />
              </ActionForm>
            </div>
            )}
          </div>
        ))}
      </div>

      <AdminPager
        basePath={BASE}
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
        q={q}
        status={urlStatus}
        label="Application pages"
      />
    </div>
  );
}
