// app/admin/applications/page.tsx — review companion applications: see the free
// document-check results, then approve (creates the Companion profile) or reject.

import { prisma } from '@/lib/prisma';
import { ActionForm } from '@/components/admin/ActionForm';
import { approveApplication, rejectApplication } from '../actions/applications';

export const dynamic = 'force-dynamic';

const btnGreen = 'text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--color-emerald)] text-white disabled:opacity-50 disabled:cursor-wait';
const btnRed = 'text-xs font-semibold px-3 py-1.5 rounded-full border border-rose-300 text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-wait';
const inp = 'h-8 px-2 text-xs rounded-lg border border-[var(--color-ink)]/15';

function StatusPill({ s }: { s: string }) {
  const cls = s === 'verified' ? 'bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]'
    : s === 'failed' ? 'bg-rose-100 text-rose-700'
    : s === 'manual' ? 'bg-[var(--color-azure)]/10 text-[var(--color-azure)]'
    : 'bg-[var(--color-ink)]/5 text-[var(--color-ink-muted)]';
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cls}`}>{s}</span>;
}

export default async function AdminApplications() {
  const apps = await prisma.companionApplication.findMany({
    where: { status: 'submitted' },
    orderBy: { updatedAt: 'desc' },
    take: 200,
    select: {
      id: true, name: true, city: true, rate: true, bio: true, activities: true,
      idUploaded: true, backgroundConsent: true, idDocType: true, idDocMasked: true,
      idVerifyStatus: true, photoVerifyStatus: true, ocrMatched: true, updatedAt: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-black text-[var(--color-ink)]" style={{ fontSize: 'var(--text-h2)' }}>
        Pending applications ({apps.length})
      </h1>
      <p className="text-xs text-[var(--color-ink-muted)] -mt-3">
        Document checks are automated sanity checks (number format, file integrity, duplicate
        fingerprint) — <strong>not identity proof</strong>. No authority has confirmed anyone here.
        Approving stamps <em>manual</em>: it records that <em>you</em> looked. Always eyeball first.
      </p>

      <div className="flex flex-col gap-3">
        {apps.length === 0 && <p className="text-[var(--color-ink-muted)]">No pending applications.</p>}
        {apps.map((a) => (
          <div key={a.id} className="rounded-2xl bg-white border border-[var(--color-ink)]/10 p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {a.name} <span className="font-normal text-[var(--color-ink-muted)]">· {a.city} · ₹{(a.rate / 100).toFixed(0)}/mtg</span>
                </p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{a.bio}</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{a.activities.join(', ')}</p>
              </div>
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

            <div className="flex flex-wrap items-start gap-2 pt-2 border-t border-[var(--color-ink)]/5">
              <ActionForm
                action={approveApplication}
                submitLabel="Approve → create companion"
                submitClassName={btnGreen}
                confirm={`Approve ${a.name}? This creates a live companion profile and promotes their account.`}
              >
                <input type="hidden" name="id" value={a.id} />
              </ActionForm>
              <ActionForm action={rejectApplication} submitLabel="Reject" submitClassName={btnRed}>
                <input type="hidden" name="id" value={a.id} />
                <input name="reason" placeholder="Reject reason" className={inp} style={{ width: 130 }} />
              </ActionForm>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
