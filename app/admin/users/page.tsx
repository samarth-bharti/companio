// app/admin/users/page.tsx — full user management: suspend, ban, role, credits,
// messaging block, delete. All mutations are server-action forms.

import { prisma } from '@/lib/prisma';
import { ageInYears } from '@/lib/server/age';
import { ActionForm } from '@/components/admin/ActionForm';
import {
  suspendUser, unsuspendUser, banUser, unbanUser,
  deleteUser, grantCredits, blockUserMessaging, unblockUserMessaging,
  editUser,
} from '../actions/users';

export const dynamic = 'force-dynamic';

const btn = 'text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-ink)]/20 text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5 disabled:opacity-50 disabled:cursor-wait';
const btnBlue = 'text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--color-azure)] text-white disabled:opacity-50 disabled:cursor-wait';
const btnRed = 'text-xs font-semibold px-3 py-1.5 rounded-full border border-rose-300 text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-wait';
const inp = 'h-8 px-2 text-xs rounded-lg border border-[var(--color-ink)]/15';

function Badge({ label, variant = 'neutral' }: { label: string; variant?: 'neutral' | 'green' | 'red' | 'blue' }) {
  const cls = {
    neutral: 'bg-[var(--color-ink)]/5 text-[var(--color-ink-muted)]',
    green: 'bg-[var(--color-emerald)]/10 text-[var(--color-emerald)]',
    red: 'bg-rose-100 text-rose-700',
    blue: 'bg-[var(--color-azure)]/10 text-[var(--color-azure)]',
  }[variant];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cls}`}>{label}</span>;
}

export default async function AdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      role: true, suspended: true, bannedAt: true, messageBlocked: true, createdAt: true,
      dateOfBirth: true,
      wallet: { select: { credits: true } },
    },
  });
  // One clock for the whole render (see the note in admin/discounts).
  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display font-black text-[var(--color-ink)]" style={{ fontSize: 'var(--text-h2)' }}>
        Users ({users.length})
      </h1>

      <div className="flex flex-col gap-3">
        {users.length === 0 && <p className="text-[var(--color-ink-muted)]">No users yet.</p>}
        {users.map((u) => {
          const isBanned = !!u.bannedAt;
          return (
            <div key={u.id} className="rounded-2xl bg-white border border-[var(--color-ink)]/10 p-4 flex flex-col gap-3">
              {/* Info row */}
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {u.firstName} {u.lastName ?? ''}
                    <span className="text-[var(--color-ink-muted)] font-normal"> · {u.id.slice(-8)}</span>
                  </p>
                  <p className="text-xs text-[var(--color-ink-muted)]">{u.email ?? u.phone ?? '—'} · {u.createdAt.toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge label={u.role} variant={u.role === 'admin' ? 'red' : u.role === 'companion' ? 'blue' : 'neutral'} />
                  {u.suspended && <Badge label="suspended" variant="red" />}
                  {isBanned && <Badge label="banned" variant="red" />}
                  {u.messageBlocked && <Badge label="msg-blocked" variant="neutral" />}
                  {/* No date of birth means this account cannot book or apply
                      (lib/server/age.ts). Surface it — it looks like a bug to
                      the user and an admin needs to know why. */}
                  {u.dateOfBirth
                    ? <Badge label={`${ageInYears(u.dateOfBirth, now)}y`} variant="neutral" />
                    : <Badge label="no DOB" variant="red" />}
                  <Badge label={`${u.wallet?.credits ?? 0} cr`} variant="green" />
                </div>
              </div>

              {/* Actions. Every one is an ActionForm: pending state so a slow
                  Neon round-trip can't be double-submitted (a double "Grant
                  credits" grants twice), and an inline result message. */}
              <div className="flex flex-wrap items-start gap-2 pt-2 border-t border-[var(--color-ink)]/5">
                <ActionForm
                  action={u.suspended ? unsuspendUser : suspendUser}
                  submitLabel={u.suspended ? 'Unsuspend' : 'Suspend'}
                  submitClassName={btn}
                >
                  <input type="hidden" name="id" value={u.id} />
                </ActionForm>

                {isBanned ? (
                  <ActionForm action={unbanUser} submitLabel="Unban" submitClassName={btn}>
                    <input type="hidden" name="id" value={u.id} />
                  </ActionForm>
                ) : (
                  <ActionForm
                    action={banUser}
                    submitLabel="Ban"
                    submitClassName={btnRed}
                    confirm={`Ban ${u.firstName}? They will be signed out and blocked from booking, messaging and paying.`}
                  >
                    <input type="hidden" name="id" value={u.id} />
                    <input name="reason" placeholder="Ban reason" className={inp} style={{ width: 120 }} />
                  </ActionForm>
                )}

                <ActionForm
                  action={u.messageBlocked ? unblockUserMessaging : blockUserMessaging}
                  submitLabel={u.messageBlocked ? 'Unblock msgs' : 'Block msgs'}
                  submitClassName={btn}
                >
                  <input type="hidden" name="id" value={u.id} />
                </ActionForm>

                <ActionForm action={grantCredits} submitLabel="Grant credits" submitClassName={btnBlue}>
                  <input type="hidden" name="userId" value={u.id} />
                  <input name="count" type="number" defaultValue="1" className={inp} style={{ width: 52 }} />
                </ActionForm>

                <ActionForm action={editUser} submitLabel="Set role" submitClassName={btn}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="firstName" value={u.firstName} />
                  <select name="role" defaultValue={u.role} className={`${inp} pr-6`}>
                    <option value="user">user</option>
                    <option value="companion">companion</option>
                    <option value="admin">admin</option>
                  </select>
                </ActionForm>

                {/* Correct a genuine date-of-birth mistake. The action refuses
                    anything under 18 — that is the one rule admin cannot override. */}
                <ActionForm action={editUser} submitLabel="Set DOB" submitClassName={btn}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="firstName" value={u.firstName} />
                  <input
                    name="dateOfBirth"
                    type="date"
                    defaultValue={u.dateOfBirth ? u.dateOfBirth.toISOString().slice(0, 10) : ''}
                    className={inp}
                  />
                </ActionForm>

                <ActionForm
                  action={deleteUser}
                  submitLabel="Delete"
                  submitClassName={btnRed}
                  confirm={`Permanently delete ${u.firstName} and every booking, message and payment record they own? This cannot be undone.`}
                >
                  <input type="hidden" name="id" value={u.id} />
                </ActionForm>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
