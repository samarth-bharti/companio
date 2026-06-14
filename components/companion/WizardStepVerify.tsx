'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ScanStatus = 'idle' | 'scanning' | 'ok';

export interface VerifyData {
  photoFile: File | null;
  idFile: File | null;
  backgroundConsent: boolean;
  platonicAck: boolean;
}

interface Props {
  data: VerifyData;
  onChange: (patch: Partial<VerifyData>) => void;
}

export function WizardStepVerify({ data, onChange }: Props) {
  const [photoStatus, setPhotoStatus] = useState<ScanStatus>(data.photoFile ? 'ok' : 'idle');
  const [idStatus, setIdStatus] = useState<ScanStatus>(data.idFile ? 'ok' : 'idle');
  const photoRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);

  const handleFile = (type: 'photo' | 'id', file: File | undefined) => {
    if (!file) return;
    if (type === 'photo') {
      setPhotoStatus('scanning');
      onChange({ photoFile: file });
      setTimeout(() => setPhotoStatus('ok'), 800);
    } else {
      setIdStatus('scanning');
      onChange({ idFile: file });
      setTimeout(() => setIdStatus('ok'), 800);
    }
  };

  return (
    <div>
      <h2 className="font-display text-h2 mb-1" style={{ color: 'var(--color-ink)' }}>
        Quick verification
      </h2>
      <p className="font-sans text-sm mb-2" style={{ color: 'var(--color-ink-muted)' }}>
        Verification builds trust with members and keeps the platform safe for everyone.
      </p>
      <p
        className="inline-block font-sans text-xs px-3 py-1 rounded-pill mb-8"
        style={{ background: 'rgba(46,107,255,0.08)', color: 'var(--color-azure-deep)' }}
      >
        Demo mode, nothing is uploaded or stored
      </p>

      {/* Upload tiles */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <UploadTile
          id="wiz-photo"
          inputRef={photoRef}
          label="Profile photo"
          hint="A clear, friendly photo"
          accept="image/*"
          file={data.photoFile}
          status={photoStatus}
          onChange={(f) => handleFile('photo', f)}
        />
        <UploadTile
          id="wiz-id"
          inputRef={idRef}
          label="Government ID"
          hint="Aadhaar, PAN, or passport"
          accept="image/*,.pdf"
          file={data.idFile}
          status={idStatus}
          onChange={(f) => handleFile('id', f)}
        />
      </div>

      {/* Consent checkboxes */}
      <div className="space-y-4">
        <CheckRow
          id="wiz-bg-consent"
          checked={data.backgroundConsent}
          onChange={(v) => onChange({ backgroundConsent: v })}
          required
        >
          I consent to a background-check as part of verification.{' '}
          <Link href="/safety" className="underline underline-offset-4" style={{ color: 'var(--color-azure-deep)' }}>
            Learn about safety
          </Link>
        </CheckRow>

        <CheckRow
          id="wiz-platonic"
          checked={data.platonicAck}
          onChange={(v) => onChange({ platonicAck: v })}
          required
        >
          I understand and agree that all meetups on Companio are strictly platonic. Zero
          tolerance for anything else, this is non-negotiable and grounds for immediate removal.
        </CheckRow>
      </div>
    </div>
  );
}

/* ─── sub-components ─────────────────────────────────────────────────────── */

interface UploadTileProps {
  id: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  status: ScanStatus;
  onChange: (f: File | undefined) => void;
}

function UploadTile({ id, inputRef, label, hint, accept, file, status, onChange }: UploadTileProps) {
  const isOk = status === 'ok';
  const isScanning = status === 'scanning';

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0])}
        aria-label={label}
      />
      <label
        htmlFor={id}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl p-6 cursor-pointer',
          'transition-colors min-h-[120px]',
        )}
        style={{
          border: `2px dashed ${isOk ? '#1FAE6B' : 'rgba(46,107,255,0.25)'}`,
          background: isOk ? 'rgba(31,174,107,0.06)' : 'rgba(46,107,255,0.03)',
        }}
      >
        {isScanning ? (
          <Loader2 size={22} className="animate-spin" style={{ color: 'var(--color-azure)' }} />
        ) : isOk ? (
          <CheckCircle2 size={22} style={{ color: '#1FAE6B' }} />
        ) : (
          <Upload size={22} style={{ color: 'var(--color-azure)' }} />
        )}
        <span className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
          {label}
        </span>
        {file && isOk ? (
          <span className="font-sans text-xs text-center" style={{ color: '#157A4A' }}>
            Looks good, {file.name}
          </span>
        ) : (
          <span className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
            {isScanning ? 'Checking…' : hint}
          </span>
        )}
      </label>
    </div>
  );
}

interface CheckRowProps {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  children: React.ReactNode;
}

function CheckRow({ id, checked, onChange, required, children }: CheckRowProps) {
  return (
    <label
      htmlFor={id}
      className="flex gap-3 cursor-pointer"
      style={{ color: 'var(--color-ink)' }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
        className="mt-0.5 w-4 h-4 rounded shrink-0 cursor-pointer"
        style={{ accentColor: 'var(--color-azure)' }}
      />
      <span className="font-sans text-sm leading-relaxed">{children}</span>
    </label>
  );
}
