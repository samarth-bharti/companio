'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { ShieldAlert, Loader2, MessageCircle, Send, Copy, Check } from 'lucide-react';
import {
  getCurrentPosition, mapsLink, sosMessage, whatsappLink, smsLink, shareSos,
  getTrustedContact, setTrustedContact, type Coords,
} from '@/lib/safety/sos';

type Phase = 'idle' | 'locating' | 'ready' | 'error';

/**
 * One-tap SOS: captures the user's live location and shares a Google Maps link
 * with a trusted contact via the native share sheet (or WhatsApp / SMS). Fully
 * client-side and free — no backend, no paid maps key.
 */
export function SosButton({ companionName }: { companionName?: string }) {
  const reduced = useEffectiveReducedMotion();
  const [phase, setPhase] = useState<Phase>('idle');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState(() => getTrustedContact());

  const trigger = useCallback(async () => {
    setPhase('locating');
    setError('');
    try {
      const c = await getCurrentPosition();
      setCoords(c);
      setPhase('ready');
      const url = mapsLink(c);
      const text = sosMessage(url, companionName);
      // Prefer the native share sheet on mobile; falls through to the buttons.
      await shareSos(text, url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setPhase('error');
    }
  }, [companionName]);

  const url = coords ? mapsLink(coords) : '';
  const text = coords ? sosMessage(url, companionName) : '';

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked; the link is still visible to copy by hand */ }
  }, [text]);

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(220,38,38,0.25)', background: 'rgba(220,38,38,0.04)' }}>
      <button
        type="button"
        onClick={trigger}
        disabled={phase === 'locating'}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3 px-5 font-sans font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ background: '#dc2626', outlineColor: '#dc2626' }}
      >
        {phase === 'locating'
          ? <><Loader2 size={18} className="animate-spin" aria-hidden /> Getting your location…</>
          : <><ShieldAlert size={18} aria-hidden /> SOS — share my live location</>}
      </button>

      <AnimatePresence initial={false}>
        {phase === 'error' && (
          <motion.p
            initial={reduced ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-3 text-sm" style={{ color: '#dc2626' }} role="alert"
          >
            {error}
          </motion.p>
        )}

        {phase === 'ready' && coords && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-3 space-y-2"
          >
            <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
              Location ready. Send it to someone you trust:
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={whatsappLink(contact?.phone ?? '', text)} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white" style={{ background: '#25D366' }}>
                <MessageCircle size={16} aria-hidden /> WhatsApp{contact ? ` ${contact.name}` : ''}
              </a>
              <a href={smsLink(contact?.phone ?? '', text)}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium" style={{ background: 'var(--color-azure-tint, #eef3ff)', color: 'var(--color-azure)' }}>
                <Send size={16} aria-hidden /> SMS
              </a>
              <button type="button" onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border" style={{ borderColor: 'rgba(0,0,0,0.12)', color: 'var(--color-ink-muted)' }}>
                {copied ? <><Check size={16} aria-hidden /> Copied</> : <><Copy size={16} aria-hidden /> Copy link</>}
              </button>
            </div>
            {!contact && <SaveContact onSave={(c) => { setTrustedContact(c); setContact(c); }} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Tiny inline form to remember a trusted contact for faster future SOS. */
function SaveContact({ onSave }: { onSave: (c: { name: string; phone: string }) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (name && phone) onSave({ name, phone }); }}
      className="mt-2 flex flex-wrap items-center gap-2"
    >
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Trusted contact name"
        className="flex-1 min-w-[120px] rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: 'rgba(0,0,0,0.12)' }} aria-label="Trusted contact name" />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (with code, e.g. 9198…)" inputMode="tel"
        className="flex-1 min-w-[140px] rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: 'rgba(0,0,0,0.12)' }} aria-label="Trusted contact phone" />
      <button type="submit" className="rounded-full px-3 py-1.5 text-sm font-medium" style={{ background: 'var(--color-azure)', color: 'white' }}>Save</button>
    </form>
  );
}
