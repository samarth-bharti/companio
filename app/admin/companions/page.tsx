// app/admin/companions/page.tsx — the companion control surface: create, edit
// every field that drives the public site, verify, suspend, ban, delete, and
// link a profile to the account that owns it.
//
// The create/edit/suspend/ban/delete actions existed for months but this page
// never rendered them — an admin could not add a companion at all. It now does.

import { prisma } from '@/lib/prisma';
import { rupees } from '@/lib/server/admin';
import { ActionForm } from '@/components/admin/ActionForm';
import { linkCompanion, unlinkCompanion } from '../actions';

export const metadata = { title: "Companions" };
import {
  createCompanion,
  editCompanion,
  suspendCompanion,
  unsuspendCompanion,
  banCompanion,
  unbanCompanion,
  deleteCompanion,
  setVerified,
  setPremium,
} from '../actions/companions';

export const dynamic = 'force-dynamic';

const inp = 'h-9 px-2 text-xs rounded-lg border border-[var(--color-ink)]/15 w-full';
const btn = 'text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-ink)]/20 text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5 disabled:opacity-50 disabled:cursor-wait';
const btnBlue = 'text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--color-azure)] text-white disabled:opacity-50 disabled:cursor-wait';
const btnRed = 'text-xs font-semibold px-3 py-1.5 rounded-full border border-rose-300 text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-wait';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Badge({ label, tone }: { label: string; tone: 'green' | 'red' | 'blue' | 'neutral' }) {
  const cls = {
    neutral: 'bg-[var(--color-ink)]/5 text-[var(--color-ink-muted)]',
    green: 'bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]',
    red: 'bg-rose-100 text-rose-700',
    blue: 'bg-[var(--color-azure)]/10 text-[var(--color-azure)]',
  }[tone];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cls}`}>{label}</span>;
}

export default async function AdminCompanions() {
  // Admin sees suspended and banned rows too — otherwise there is no way to
  // reverse either. Public reads go through VISIBLE_COMPANION instead.
  const companions = await prisma.companion.findMany({
    orderBy: { name: 'asc' },
    take: 200,
    include: { account: { select: { id: true, email: true, phone: true } } },
  });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display font-black text-[var(--color-ink)]" style={{ fontSize: 'var(--text-h2)' }}>
        Companions ({companions.length})
      </h1>

      {/* ── Create ─────────────────────────────────────────────────────────── */}
      {/* Collapsed by default so the moderation list — the thing an admin opens
          this page for — leads, instead of scrolling past a 12-field form. */}
      <details className="rounded-2xl bg-white border border-[var(--color-ink)]/10 p-5">
        <summary className="text-sm font-bold text-[var(--color-ink)] cursor-pointer select-none">
          Add a companion
        </summary>
        <p className="text-xs text-[var(--color-ink-muted)] mt-1 mb-4">
          Activities, languages and suggestions are comma-separated. Leave the id blank to derive it
          from the name. A profile with no activities renders as an empty card, so fill them in.
        </p>
        <ActionForm action={createCompanion} submitLabel="Create companion" submitClassName={btnBlue} className="flex flex-col gap-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Name *"><input name="name" required className={inp} placeholder="Ananya Iyer" /></Field>
            <Field label="City *"><input name="city" required className={inp} placeholder="Mumbai" /></Field>
            <Field label="Area *"><input name="area" required className={inp} placeholder="Bandra West" /></Field>
            <Field label="Id (optional)"><input name="id" className={inp} placeholder="auto from name" /></Field>
            <Field label="Hourly rate (paise)"><input name="hourlyRate" type="number" defaultValue={50000} className={inp} /></Field>
            <Field label="Accent (#rrggbb)"><input name="accent" className={inp} placeholder="#2E6BFF" /></Field>
            <Field label="Photo URL"><input name="photo" className={inp} placeholder="https://…" /></Field>
            <Field label="Availability"><input name="availability" className={inp} placeholder="Free this evening" /></Field>
            <Field label="Languages"><input name="languages" className={inp} placeholder="Hindi, English" /></Field>
            <Field label="Activities"><input name="activities" className={inp} placeholder="City Walk, Café Chat" /></Field>
            <Field label="Suggestions"><input name="suggestions" className={inp} placeholder="Kala Ghoda walk, Prithvi café" /></Field>
          </div>
          <Field label="Bio *"><textarea name="bio" required rows={2} className={`${inp} h-auto py-2`} /></Field>
        </ActionForm>
      </details>

      {/* ── List ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {companions.length === 0 && (
          <p className="text-[var(--color-ink-muted)]">No companion profiles yet. Add one above.</p>
        )}

        {companions.map((c) => {
          const isBanned = !!c.bannedAt;
          return (
            <div key={c.id} className="rounded-2xl bg-white border border-[var(--color-ink)]/10 p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {c.name} <span className="text-[var(--color-ink-muted)] font-normal">· {c.id}</span>
                  </p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {c.area}, {c.city} · {rupees(c.hourlyRate)}/hr · {c.rating}★ ({c.reviewCount})
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.verified && <Badge label="verified" tone="green" />}
                  {c.premium && <Badge label="premium" tone="blue" />}
                  {c.availableNow && <Badge label="free now" tone="green" />}
                  {c.suspended && !isBanned && <Badge label="suspended" tone="red" />}
                  {isBanned && <Badge label="banned" tone="red" />}
                  {c.activities.length === 0 && <Badge label="no activities" tone="red" />}
                </div>
              </div>

              {/* Edit — only non-empty fields are applied, so this is safe to
                  submit with most boxes left as-is. */}
              <details className="border-t border-[var(--color-ink)]/5 pt-3">
                <summary className="text-xs font-semibold cursor-pointer text-[var(--color-azure)]">Edit profile</summary>
                <ActionForm action={editCompanion} submitLabel="Save changes" submitClassName={btnBlue} className="flex flex-col gap-3 mt-3">
                  <input type="hidden" name="id" value={c.id} />
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Field label="Name"><input name="name" defaultValue={c.name} className={inp} /></Field>
                    <Field label="City"><input name="city" defaultValue={c.city} className={inp} /></Field>
                    <Field label="Area"><input name="area" defaultValue={c.area} className={inp} /></Field>
                    <Field label="Age"><input name="age" type="number" defaultValue={c.age ?? ''} className={inp} /></Field>
                    <Field label="Hourly rate (paise)"><input name="hourlyRate" type="number" defaultValue={c.hourlyRate} className={inp} /></Field>
                    <Field label="Match score (0–100)"><input name="matchScore" type="number" defaultValue={c.matchScore} className={inp} /></Field>
                    <Field label="Accent"><input name="accent" defaultValue={c.accent} className={inp} /></Field>
                    <Field label="Photo URL"><input name="photo" defaultValue={c.photo} className={inp} /></Field>
                    <Field label="Availability"><input name="availability" defaultValue={c.availability} className={inp} /></Field>
                    <Field label="Languages"><input name="languages" defaultValue={c.languages.join(', ')} className={inp} /></Field>
                    <Field label="Activities"><input name="activities" defaultValue={c.activities.join(', ')} className={inp} /></Field>
                    <Field label="Suggestions"><input name="suggestions" defaultValue={c.suggestions.join(', ')} className={inp} /></Field>
                  </div>
                  <Field label="Bio"><textarea name="bio" rows={3} defaultValue={c.bio} className={`${inp} h-auto py-2`} /></Field>
                </ActionForm>
              </details>

              {/* Moderation */}
              <div className="flex flex-wrap items-start gap-2 border-t border-[var(--color-ink)]/5 pt-3">
                <ActionForm action={setVerified} submitLabel={c.verified ? 'Un-verify' : 'Mark verified'} submitClassName={btn}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="verified" value={String(!c.verified)} />
                </ActionForm>

                <ActionForm action={setPremium} submitLabel={c.premium ? 'Remove premium' : 'Make premium'} submitClassName={btn}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="premium" value={String(!c.premium)} />
                </ActionForm>

                <ActionForm
                  action={c.suspended && !isBanned ? unsuspendCompanion : suspendCompanion}
                  submitLabel={c.suspended && !isBanned ? 'Unsuspend' : 'Suspend'}
                  submitClassName={btn}
                >
                  <input type="hidden" name="id" value={c.id} />
                </ActionForm>

                {isBanned ? (
                  <ActionForm action={unbanCompanion} submitLabel="Unban" submitClassName={btn}>
                    <input type="hidden" name="id" value={c.id} />
                  </ActionForm>
                ) : (
                  <ActionForm
                    action={banCompanion}
                    submitLabel="Ban"
                    submitClassName={btnRed}
                    confirm={`Ban ${c.name}? They disappear from explore, the map and bookings. History is kept.`}
                  >
                    <input type="hidden" name="id" value={c.id} />
                    <input name="reason" placeholder="Ban reason" className={`${inp} w-32`} />
                  </ActionForm>
                )}

                <ActionForm
                  action={deleteCompanion}
                  submitLabel="Delete"
                  submitClassName={btnRed}
                  confirm={`Permanently delete ${c.name}? Refused if they have any booking — ban them instead.`}
                >
                  <input type="hidden" name="id" value={c.id} />
                </ActionForm>
              </div>

              {/* Account link */}
              <div className="flex items-center gap-2 flex-wrap border-t border-[var(--color-ink)]/5 pt-3">
                {c.account ? (
                  <>
                    <Badge label={`Linked · ${c.account.email ?? c.account.phone ?? c.account.id}`} tone="green" />
                    <ActionForm action={unlinkCompanion} submitLabel="Unlink" submitClassName={btn}>
                      <input type="hidden" name="userId" value={c.account.id} />
                    </ActionForm>
                  </>
                ) : (
                  <ActionForm action={linkCompanion} submitLabel="Link account" submitClassName={btnBlue}>
                    <input type="hidden" name="companionId" value={c.id} />
                    <input
                      name="userId"
                      placeholder="Account email"
                      aria-label="Account email or user id to link"
                      className={`${inp} w-56`}
                    />
                  </ActionForm>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
