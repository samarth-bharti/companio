'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { ReactNode } from 'react';
import type { ActionState } from '@/lib/server/adminAction';

/**
 * A <form> for an admin server action that actually tells you what happened.
 *
 * Admin pages stay server components; they hand their server action to this
 * wrapper, which owns the useActionState/useFormStatus plumbing. Two things
 * every admin form needs and none of them had:
 *
 *  1. Pending state — mutations take ~700ms against Neon. Without it operators
 *     double-submit, and a double-submitted "grant credits" grants twice.
 *  2. A result message — success and failure both render inline, next to the
 *     button that caused them.
 *
 * `confirm` guards irreversible actions (delete, ban) behind a browser confirm.
 */

type ServerAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function Submit({
  label,
  className,
  confirm,
  danger,
}: {
  label: string;
  className?: string;
  confirm?: string;
  danger?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={
        className ??
        `text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-wait ${
          danger
            ? 'border-red-300 text-red-700 hover:bg-red-50'
            : 'border-[var(--color-ink)]/15 text-[var(--color-ink)] hover:bg-black/5'
        }`
      }
    >
      {pending ? 'Working…' : label}
    </button>
  );
}

export function ActionForm({
  action,
  submitLabel,
  children,
  confirm,
  danger,
  className,
  submitClassName,
}: {
  action: ServerAction;
  submitLabel: string;
  /** Hidden inputs and any editable fields. */
  children?: ReactNode;
  /** When set, the browser asks this before submitting. */
  confirm?: string;
  danger?: boolean;
  className?: string;
  submitClassName?: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className={className ?? 'inline-flex flex-col gap-1'}>
      {children}
      <Submit label={submitLabel} className={submitClassName} confirm={confirm} danger={danger} />
      {state && (
        <p
          role="status"
          aria-live="polite"
          className="text-xs leading-snug max-w-[22rem]"
          style={{ color: state.ok ? '#157A4A' : '#C0392B' }}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
